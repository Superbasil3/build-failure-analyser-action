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
 * @param {string} description
 * @param {String[]} regexMatch
 * @return {string}
 */
const formatDescription = (description, regexMatch) => {
  console.debug('formatDescription', description, regexMatch);
  let newDescription = description;
  // remove first three elements of the array (the first one is the whole match, the second one is the first group)
  regexMatch.shift();

  regexMatch.forEach((element, index) => {
    newDescription = newDescription.replace(`{${index}}`, element);
  });
  console.debug('newDescription', newDescription);
  return newDescription;
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
  return parseRegexHash(getJsonContent(regexesFileLocation));
};

/**
 * @param {String} pathRegexFile
 * @return {string}
 */
const getJsonContent = function(pathRegexFile) {
  return require(pathRegexFile);
};

/**
 * @param {String} regexesContent
 * @return {String[]}
 */
const validateRegex = function(regexesContent) {
  const regexes = JSON.parse(regexesContent);
  const message = [];
  if (!regexes.hasOwnProperty('causes')) {
    message.push('Json must contain a "causes" property.');
  } else {
    const causesEntries = Object.entries(regexes.causes);
    for (const [id, cause] of causesEntries) {
      if (!cause.hasOwnProperty('name')) {
        message.push(`Cause ${id} must contain a "name" property.`);
      }
      if (!cause.hasOwnProperty('description')) {
        message.push(`Cause ${id} must contain a "description" property.`);
      }
      if (!cause.hasOwnProperty('indications')) {
        message.push(`Cause ${id} must contain an "indications" property.`);
      } else {
        if (!Array.isArray(cause.indications)) {
          message.push(`Cause ${id} must contain an "indications" property of type Array.`);
        }
      }
      if (cause.hasOwnProperty('test_lines_to_match')) {
        if (!Array.isArray(cause.test_lines_to_match)) {
          message.push(`Cause causes.${id}.test_lines_to_match must be a property of type Array.`);
        } else {
          for (const testLine of cause.test_lines_to_match) {
            // We want that one test line match is matched by a least one indication
            let checkLineMatched = false;
            for (const indication of cause.indications) {
              if (new RegExp(indication).test(testLine)) {
                checkLineMatched = true;
                break;
              }
            }
            if (!checkLineMatched) {
              message.push(`Cause causes.${id}.test_lines_to_match must be matched by at least one indication.`);
              break;
            }
          }
        }
      }
    }
  }
  return message;
};

/**
 * @param {string} regexesContent
 * @return {Map<string, {id: string, name: string, description: string, regex: RegExp}>}
 */
const parseRegexHash = function(regexesContent) {
  const regexHash = {};
  const causesEntries = Object.entries(regexesContent.causes);
  const nbrCauses = causesEntries.length;
  let nbrIndications = 0;
  for (const [id, cause] of causesEntries) {
    for (const indication of cause.indications) {
      regexHash[indication] = {
        id: id,
        name: cause.name,
        description: String(cause.description).split(',').join('</br>'),
        regex: new RegExp(indication),
      };
      nbrIndications++;
    }
  }
  console.log(`Loaded ${nbrCauses} cause(s), including ${nbrIndications} indication(s) from the file`);
  return Object.entries(regexHash);
};

/**
 * @param {{id: string, name: string, description: string, regex: RegExp}} regexElement
 * @param {string} indication
 * @param {string} formattedDescription
 * @return {string}
 */
const formatMessageTab = function(regexElement, indication, formattedDescription) {
  return `| ${regexElement.id} | ${regexElement.name} | \`${indication}\` | ${formattedDescription} |`;
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
        const formattedDescription = formatDescription(regexElement.description, regexElement.regex.exec(line));
        regexesMatchingComment.push(formatMessageTab(regexElement, indication, formattedDescription));
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

module.exports = {deletePreviousComment, formatGlobalCommentTab, formatMessageTab, getFileNameFromPath, parseRegexHash, processLogs, updatePRComment, validateRegex};
