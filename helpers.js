const lineReader = require('line-reader');

const unshuffled = ['👎', '🙄', '👀', '🦹', '🥉', '🌡️', '🤔', '⏰', '🌵', '😮‍💨', '🧄', '❌', '⚡'];

const shuffled = unshuffled
    .map((value) => ({value, sort: Math.random()}))
    .sort((a, b) => a.sort - b.sort)
    .map(({value}) => value);

/**
 * @param {string} pathLogFile
 * @return {string}
 */
const getFileNameFromPath = function(pathLogFile) {
  return pathLogFile.split('\\').pop().split('/').pop();
};

/**
 * @param {Octokit} octokit
 * @param {string} message
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @return {Promise<void>}
 */
const updatePRComment = async function(octokit, message, owner, repo, prNumber) {
  const prActionAnalyserId = `<!-- id_build_failure_analyser_action_${prNumber} -->`;

  // Get old PR comments
  const prComments = await octokit.issues.listComments({
    owner: owner,
    repo: repo,
    issue_number: prNumber,
  });

  // Check if on of the PR comment contains the variable prActionAnalyserId
  const prComment = prComments.data.find((comment) => comment.body.includes(prActionAnalyserId));

  // If the PR comment already exists, delete it
  if (prComment) {
    await octokit.issues.deleteComment({
      owner: owner,
      repo: repo,
      comment_id: prComment.id,
    });
  }
  // Create the comment (so it appears at the end of the discussion)
  await octokit.issues.createComment({
    owner: owner,
    repo: repo,
    issue_number: prNumber,
    body: prActionAnalyserId + message,
  });
};

/**
 * @param {Octokit}  octokit
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @return {Promise<void>}
 */
const deletePreviousComment = async function(octokit, owner, repo, prNumber) {
  // Get old PR comments
  const prComment = await octokit.issues.listComments({
    owner: owner,
    repo: repo,
    issue_number: prNumber,
  });

  // Check if on of the PR comment container the variable prActionAnalyserId
  const prCommentId = prComment.data.find((comment) => comment.body.includes(`<!-- id_build_failure_analyser_action_${prNumber} -->`));

  // If the PR comment already exists, update it
  if (prCommentId) {
    const result = await octokit.issues.deleteComment({
      owner: owner,
      repo: repo,
      comment_id: prCommentId.id,
    });
    console.log('Comment deleted', result);
  } else {
    console.log('No comment to delete');
  }
};

const processLogs = function(regexesFileLocation, pathLogFile, messageHeader, githubContext, pullRequestNumber, octokit) {
  const regexHash = getRegexHash(regexesFileLocation);
  readFile(pathLogFile, regexHash, messageHeader, githubContext, pullRequestNumber, octokit);
};

/**
 * @param {string} regexesFileLocation
 * @return {Map<string, {id: string, name: string, description: string, regex: RegExp}>}
 */
const getRegexHash = function(regexesFileLocation) {
  return parseRegexHash(regexesFileLocation);
};

/**
 * @param {string} pathRegexFile
 * @return {Map<string, {id: string, name: string, description: string, regex: RegExp}>}
 */
const parseRegexHash = function(pathRegexFile) {
  const regexHash = {};
  const jsonData = require(pathRegexFile);
  const causesEntries = Object.entries(jsonData.causes);
  const nbrCauses = causesEntries.length;
  let nbrIndications = 0;
  for (const [id, cause] of causesEntries) {
    for (const indication of cause.indications) {
      const object = {};
      object['id'] = id;
      object['name'] = cause.name;
      object['description'] = String(cause.description).split(',').join('</br>');
      object['regex'] = new RegExp(indication);
      regexHash[indication] = object;
      nbrIndications++;
    }
  }
  console.log(`Loaded ${nbrCauses} cause(s), including ${nbrIndications} indication(s) from the file ${getFileNameFromPath(pathRegexFile)}`);
  return Object.entries(regexHash);
};

/**
 * @param {{id: string, name: string, description: string, regex: RegExp}} regexElement
 * @param {string} indication
 * @return {string}
 */
const formatMessageTab = function(regexElement, indication) {
  return `| ${regexElement.id} | ${regexElement.name} | \`${indication}\` | ${regexElement.description} |`;
};

/**
 * @param {string} line
 * @param {string[]} regexesMatchingComment
 * @param {number} lineMatched
 * @return {string}
 */
const formatGlobalCommentTab = function(line, regexesMatchingComment, lineMatched) {
  return `### <ins>Match n°${lineMatched}<ins> ${shuffled[lineMatched % shuffled.length]}
\`\`\`
${line}
\`\`\`
| ID | Name | Regex | Description |
| --- | --- | --- | --- |
${regexesMatchingComment.join('\n')}
---
`;
};

/**
 * @param {string} pathLogFile
 * @param {Map<string, {name: string, description: string, regex: RegExp}>} regexHash
 * @param {string} messageHeader
 * @param {Context} githubContext
 * @param {number} pullRequestNumber
 * @param {Octokit} octokit
 */
const readFile = function(pathLogFile, regexHash, messageHeader, githubContext, pullRequestNumber, octokit) {
  let message = '';
  let lineMatched = 0;
  console.info(`Going to read the file : ${pathLogFile}`);
  lineReader.eachLine(pathLogFile, function(line, last) {
    const regexesMatchingComment = [];
    for (const [indication, regexElement] of regexHash) {
      if (regexElement.regex.test(line)) {
        regexesMatchingComment.push(formatMessageTab(regexElement, indication));
      }
    }
    if (regexesMatchingComment.length > 0) {
      // create the message to be sent to the PR
      message += formatGlobalCommentTab(line, regexesMatchingComment, ++lineMatched);
    }
    if (last) {
      if (message !== '') {
        console.debug(`Will create/update comment for the log_file : ${pathLogFile}`);
        updatePRComment(octokit, messageHeader + message, githubContext.repo.owner, githubContext.repo.repo, pullRequestNumber);
      } else {
        console.debug(`Will remove comment/do nothing : ${pathLogFile}`);
        deletePreviousComment(octokit, githubContext.repo.owner, githubContext.repo.repo, pullRequestNumber);
      }
    }
  });
};

module.exports = {deletePreviousComment, getFileNameFromPath, processLogs, updatePRComment};
