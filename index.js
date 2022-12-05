import * as fs from "fs";

const core = require('@actions/core');
const github = require('@actions/github');
const lineReader = require('line-reader');
import {Octokit} from '@octokit/rest';


// function to update the pull request with a message
async function updatePR(octokit, message, owner, repo, prNumber) {
    const result = await octokit.issues.createComment({
        owner: owner,
        repo: repo,
        issue_number: prNumber,
        body: message
    });
    console.log(result);
}

// function to check if the line matches any of the regexes
function checkLine(line, regexes) {
    let result = false;
    regexes.forEach(regex => {
        if (line.match(regex)) {
            result = true;
        }
    });
    return result;
}

//Define constant string with a generic message to be used in the PR
const messageHeader = ":bangbang: [build-failure-analyser-action] : Some errors have been matched in the log file :bangbang: \n\n" ;

try {
    const regex = {
        getRegexHash() {
            const regexHash = {}

            const jsonData = require('../regexes.json');
            const causesEntries = Object.entries(jsonData.causes)
            const nbrCauses = causesEntries.length
            let nbrIndications = 0
            for (const [id, cause] of causesEntries) {
                for (const indication of cause.indications) {
                    let object = {}
                    object['id'] = id
                    object['name'] = cause.name
                    object['description'] = cause.description
                    object['regex'] = new RegExp(indication);
                    regexHash[indication] = object
                    nbrIndications++
                }
            }
            console.log(`Loaded ${nbrCauses} cause(s), including ${nbrIndications} indication(s)`)
            return Object.entries(regex.getRegexHash())
        }
    };


    const pullRequest = {
        update(message) {
        }
    }
// reformat the code to make it more readable


    const githubContext = github.context;
    if (githubContext.payload.pull_request == null) {
        core.setFailed('No pull request found.');
        throw new Error('No pull request found.');
    }
    const pull_request_number = githubContext.payload.pull_request.number;

    const pathLogFile = core.getInput('path-log-file');
    const githubToken = core.getInput('github-token');
    const githubDatabaseRepo = core.getInput('github-database-repo');

    const octokit = new Octokit({
        auth: githubToken
    });

    console.debug(`Go read file at : ${pathLogFile}!`);

    const regexHash = regex.getRegexHash()

    // create an empty variable to store the message to send to the pull request
    let message = "";

    // create a variable to store string to be sent to the PR
    lineReader.eachLine(pathLogFile, function (line, last) {

        let regexesMatchingComment = [];

        for (const [indication, regexElement] of regexHash) {
            if (regexElement.regex.test(line)) {
                // push formated string to the array
                regexesMatchingComment.push(`- ${indication} ${regexElement.name} : ${regexElement.description}`);
            }
        }
        if (regexesMatchingComment.length > 0) {
            // create the message to be sent to the PR
            message = `<details>
                <summary>Error match on line '${line}'</summary>
                <p>                
                 ${regexesMatchingComment.join('</p><p>')}
                </p>
            </details>`
        }


    }).then(function () {
            if (message !== "") {
                updatePR(octokit, messageHeader + message, githubContext.repo.owner, githubContext.repo.repo, pull_request_number);
            }
        }
    );

} catch (error) {
    core.setFailed(error.message);
}


