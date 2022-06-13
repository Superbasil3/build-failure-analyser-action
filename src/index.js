const core = require('@actions/core');
const github = require('@actions/github');
const lineReader = require('line-reader');

try {

    const pathLogFile = core.getInput('path-log-file');
    const githubToken = core.getInput('github-token');
    const pathLogDatabaseJson = core.getInput('path-log-database-json');
    const stepOutcome = core.getInput('step-outcome');


    function getRegexHash(pathJson) {
        const regexHash = {}
        const jsonData = require(pathJson);
        const causesEntries = Object.entries(jsonData.causes)
        const nbrCauses = causesEntries.length
        let nbrIndications = 0
        for (const [id, cause] of causesEntries) {
            for (const indication of cause.indications) {
                let object = {}
                object['id'] = id
                object['regex'] = new RegExp(indication);
                regexHash[indication] = object
                nbrIndications++
            }
        }
        console.log(`Loaded ${nbrCauses} cause(s), including ${nbrIndications} indication(s)`)
        return Object.entries(regexHash)
    }

    function formatComment(comments){
        let formattedMessage = '# Build failure analyzer action[^1]'
        const jsonData = require(pathLogDatabaseJson);
        let nbrIteration = 0
        for(const comment of comments) {
            nbrIteration++
            let cause = jsonData.causes[comment.id]
            let template = `
## ${nbrIteration} **${cause.name} (id : ${comment.id})** - line #${comment.lineNbr} - regex \`${comment.regex}\` 
\`${comment.line}\` 
${cause.description}`
            formattedMessage += template
        }
        formattedMessage += '\n[^1]: This message will be updated / deleted depending of the latest build result - [build-failure-analyser-action](https://github.com/Superbasil3/build-failure-analyser-action)'
        return formattedMessage
    }


    const octokit = github.getOctokit(githubToken)

    const pullRequest = {
        async update(commentsToAdd, owner, repo, issueNumber) {
            console.log(`issueNumber ${issueNumber} and ${owner} owner and ${repo} repo and ${githubToken}`)
            const {data: comments} = await octokit.rest.issues.listComments({
                issue_number: issueNumber,
                owner: owner,
                repo: repo
            })
            for (const comment of comments) {
                console.log(`comment.user.login ${comment.user.login}`)
            }
            let stepFailed = stepOutcome === 'failure'
            const botComment = comments.find(comment => comment.user.login === 'github-actions[bot]' && comment.body.includes("FAILURE_REPORT"))
            console.debug(`botComment ${botComment}`)
            if (typeof botComment !== 'undefined' && botComment && !stepFailed) {
                console.debug(`Delete comment : ${botComment.id}`)
                core.setOutput("status", "Status not in error, removing comment");
                pullRequest.deleteComments(owner, repo, botComment.id)
            } else if (typeof botComment !== 'undefined' && botComment) {
                console.debug(`Replace comment : ${botComment.id}`)
                core.setOutput("status", "Status still in error, updating comment");
                pullRequest.replaceComments(owner, repo, commentsToAdd, botComment.id)
            } else if (stepFailed) {
                console.debug(`Create comment`)
                core.setOutput("status", "Status in error, creating comment");
                pullRequest.createComments(owner, repo, issueNumber, commentsToAdd)
            }
        },

        createComments(owner, repo, issueNumber, comments) {
            octokit.rest.issues.createComment({
                issue_number: issueNumber,
                owner: owner,
                repo: repo,
                body: formatComment(comments)
            })
        },

        deleteComments(owner, repo, commentId) {
            octokit.rest.issues.deleteComment({
                owner: owner,
                repo: repo,
                comment_id: commentId
            })
        },

        replaceComments(owner, repo, comments, commentId) {
            octokit.rest.issues.updateComment({
                owner: owner,
                repo: repo,
                comment_id: commentId,
                body: formatComment(comments)
            })
        }
    }

    const githubContext = github.context;
    if (githubContext.payload.pull_request == null) {
        core.setFailed('No pull request found.');
        throw new Error('No pull request found.');
    }

    console.debug(`Go read file at : ${pathLogFile}!`);
    let regexHash = getRegexHash(pathLogDatabaseJson)
    let comments = []
    let lineNbr = 0
    lineReader.eachLine(pathLogFile, function (line, last) {
        lineNbr++
        for (const [regex, regexElement] of regexHash) {
            if (regexElement.regex.test(line)) {
                let comment = `Indication ${regex} of cause ${regexElement.id} is matching the line \n ${line}`
                let commentObj = {regex: regex, id: regexElement.id, line: line, lineNbr: lineNbr}
                comments.push(commentObj)
                console.debug(comment)
            }
        }
    });

    pullRequest.update(comments, githubContext.repo.owner, githubContext.repo.repo, githubContext.issue.number)

} catch (error) {
    core.setFailed(error.message);
}


