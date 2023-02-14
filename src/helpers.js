const lineReader = require('line-reader');
const {execSync} = require('child_process');
const fs = require('fs');

const unshuffled = ['👀', '🦹', '🥉', '🌡️', '🤔', '⏰', '🌵', '😮‍💨', '🧄', '❌', '⚡'];
const messageHeader = `[build-failure-analyser-action] runned by workflow `;
const messageFooter = '\n' +
  '<sup>Read the documentation of the plugins <a href="https://github.com/Superbasil3/build-failure-analyser-action">build-failure-analyser-action</a></sup></br>' +
  '<sup>You can test and validate the test file and logs on the <a href="https://superbasil3.github.io/build-failure-analyser-action/">Github Page</a></sup>';
const noCauseMessage = `No problems were identified. If you know why this problem occurred, please add a suitable cause for it.`;

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
 * @param {number} prNumber
 * @param {string} actionName
 * @return {string}
 */
const generateUniqueId = function(prNumber, actionName) {
  return `<!-- id_build_failure_analyser_action_${actionName}_${prNumber} -->`;
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
 * @param {{id: string, name: string, description: string, regex: RegExp}} regexElement
 * @param {string} indication
 * @param {string} formattedDescription
 * @return {string}
 */
const formatMessageTab = function(regexElement, indication, formattedDescription) {
  return `| ${regexElement.id} | ${regexElement.name} | \`${indication}\` | ${formattedDescription} |`;
};

/**
 * @param {Octokit} octokit
 * @param {Map} githubContext
 * @return {string}
 */
const getWorkflowRunUrl = async function(octokit, githubContext) {
  const {data} = await octokit.actions.listJobsForWorkflowRunAttempt({
    owner: githubContext.repo.owner,
    repo: githubContext.repo.repo,
    run_id: githubContext.runId,
    attempt_number: process.env.GITHUB_RUN_ATTEMPT,
  });
  // sort jobs get the one matching the current jobs
  const job = data.jobs.find((job) => job.name = githubContext.job);
  return `[${job.workflow_name} / ${job.name}](${job.html_url})`;
};

/**
 * @param {string} line
 * @param {string[]} regexesMatchingComment
 * @param {number} lineMatched
 * @return {string}
 */
const formatGlobalCommentTab = function(line, regexesMatchingComment, lineMatched) {
  return `> ### <ins>Match n°${lineMatched}<ins> ${shuffled[lineMatched % shuffled.length]}
> \`\`\`
> ${line}
> \`\`\`
> | ID | Name | Regex | Description |
> | --- | --- | --- | --- |
> ${regexesMatchingComment.join('\n')}
> ---
`;
};

/**
 * @param {string} globalComment
 * @param {string} pathLogFile
 * @param {int} pullRequestNumber
 * @param {Octokit} octokit
 * @param {Map} githubContext
 */
const formatGlobalComment = async function(globalComment, pathLogFile, pullRequestNumber, octokit, githubContext) {
  if (globalComment !== '') {
    console.debug(`Will create/update comment for the log_file : ${pathLogFile}`);
    const workflowRunUrl = await getWorkflowRunUrl(octokit, githubContext);
    await updatePRComment(octokit, messageHeader + workflowRunUrl + ' :\n\n' + globalComment + messageFooter, githubContext.repo.owner, githubContext.repo.repo, pullRequestNumber, githubContext.action);
  } else {
    console.debug(`Will remove comment/do nothing : ${pathLogFile}`);
    await deletePreviousComment(octokit, githubContext.repo.owner, githubContext.repo.repo, pullRequestNumber, githubContext.action);
  }
};

/**
 * @param {Octokit} octokit
 * @param {string} message
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @param {string} actionName
 * @return {Promise<void>}
 */
const updatePRComment = async function(octokit, message, owner, repo, prNumber, actionName) {
  const prActionAnalyserId = generateUniqueId(prNumber, actionName);

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
    body: prActionAnalyserId + '\n' + message,
  });
};

/**
 * @param {Octokit}  octokit
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @param {string} actionName
 * @return {Promise<void>}
 */
const deletePreviousComment = async function(octokit, owner, repo, prNumber, actionName) {
  // Get old PR comments
  const prComments = await octokit.issues.listComments({
    owner: owner,
    repo: repo,
    issue_number: prNumber,
  });

  // Check if on of the PR comment container the variable prActionAnalyserId
  const prComment = prComments.data.find((comment) => comment.body.includes(generateUniqueId(prNumber, actionName)));

  // If the PR comment already exists, update it
  if (prComment) {
    const result = await octokit.issues.deleteComment({
      owner: owner,
      repo: repo,
      comment_id: prComment.id,
    });
    console.log('Comment deleted', result);
  } else {
    console.log('No comment to delete');
  }
};

/**
 * @param {string} regexesFileLocation
 * @param {string} pathLogFile
 * @param {Map} githubContext
 * @param {int} pullRequestNumber
 * @param {Octokit} octokit
 */
const processLogs = async function(regexesFileLocation, pathLogFile, githubContext, pullRequestNumber, octokit) {
  const listJobsLogsFilename = await getListJobsLogsFilename(pathLogFile, octokit, githubContext);

  const regexHash = getRegexHash(regexesFileLocation);
  let fileComment = '';
  for (const fileName of listJobsLogsFilename) {
    fileComment += await analyseFile(fileName, regexHash);
  }
  if (fileComment === '' && listJobsLogsFilename.length > 0) {
    fileComment = getNoCausesMessage(regexesFileLocation);
  }
  formatGlobalComment(fileComment, pathLogFile, pullRequestNumber, octokit, githubContext);
};

/**
 * @param {string} pathLogFile
 * @param {Octokit} octokit
 * @param {Map} githubContext
 * @return {string[]}
 */
const getListJobsLogsFilename = async function(pathLogFile, octokit, githubContext) {
  let listJobsLogsFilename = [];
  console.debug('pathLogFile value : ', pathLogFile);
  if (pathLogFile === undefined || pathLogFile === '') {
    console.debug('path undefined, will retrieve completed in failure jobs logs');
    listJobsLogsFilename = await downloadJobsLogs(octokit, githubContext);
  } else {
    let absolutePath = pathLogFile;
    if (!pathLogFile.startsWith('/')) {
      absolutePath = `${process.cwd()}/${pathLogFile}`;
    }
    if (fs.lstatSync(absolutePath).isFile()) {
      console.debug('path is a file, will analyse this file');
      listJobsLogsFilename.push(absolutePath);
    } else if (fs.lstatSync(absolutePath).isDirectory()) {
      console.debug('path is a directory, will analyse all files in this directory and subdirectories');
      listJobsLogsFilename = retrieveLogsFilenames(absolutePath);
    }
  }
  return listJobsLogsFilename;
};

/**
 * @param {string} path
 * @return {string[]}
 */
const retrieveLogsFilenames = function(path) {
  const listFilenameJobsLogs = [];
  // Get the filename of the path folder and subdirectories
  const files = fs.readdirSync(path, {withFileTypes: true});
  for (const file of files) {
    if (file.isDirectory()) {
      listFilenameJobsLogs.push(...retrieveLogsFilenames(`${path}/${file.name}`));
    } else if (file.isFile()) {
      listFilenameJobsLogs.push(`${path}/${file.name}`);
    }
  }
  return listFilenameJobsLogs;
};

/**
 * @param {Octokit} octokit
 * @param {Map} githubContext
 * @return {Promise<String[]>}
 */
const downloadJobsLogs = async function(octokit, githubContext) {
  const listFilenameJobsLogs = [];
  await octokit.actions.listJobsForWorkflowRun({
    owner: githubContext.repo.owner,
    repo: githubContext.repo.repo,
    run_id: githubContext.runId,
  }).then(async (result) => {
    const jobs = result.data.jobs;
    for (const job of jobs) {
      if (job.status === 'completed' && job.conclusion === 'failure') {
        console.log(job.name, ' is completed and failed, will download and analyse');
        await octokit.actions.downloadJobLogsForWorkflowRun({
          owner: githubContext.repo.owner,
          repo: githubContext.repo.repo,
          job_id: job.id,
          run_id: githubContext.runId,
        }).then((result) => {
          const fileName = `${process.cwd()}/${job.name}.log`;
          downloadFromUrl(result.url, fileName);
          listFilenameJobsLogs.push(fileName);
        });
      }
    }
  });
  console.log('listFilenameJobsLogs', listFilenameJobsLogs);
  return listFilenameJobsLogs;
};

/**
 * @param {string} regexesFileLocation
 * @return {Map<string, {id: string, name: string, description: string, regex: RegExp}>}
 */
const getRegexHash = function(regexesFileLocation) {
  return parseRegexHash(getJsonContent(regexesFileLocation));
};

/**
 * @param {string} regexesFileLocation
 * @return {string}
 */
const getNoCausesMessage = function(regexesFileLocation) {
  try {
    const jsonContent = getJsonContent(regexesFileLocation);
    return jsonContent.noCausesMessage;
  } catch (e) {
    console.error(`Error while getting noCausesMessage from ${regexesFileLocation}`, e);
    return noCauseMessage;
  }
};

/**
 * @param {String} pathRegexFile
 * @return {string}
 */
const getJsonContent = function(pathRegexFile) {
  const tmpRegexesFile = `${process.cwd()}/${Date.now()}-causes.json`;
  downloadFromUrl(pathRegexFile, tmpRegexesFile);
  executeCommand('tree');
  return require(tmpRegexesFile);
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
 * @param {string} command
 */
const executeCommand = (command) => {
  console.debug('Will execute command : ', command);
  // get current working directory
  execSync(command, {stdio: 'inherit'}, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

/**
 * @param {string} url
 * @param {string} fileName
 */
const downloadFromUrl = (url, fileName) => {
  executeCommand(`curl -L "${url}" > ${fileName}`);
};

/**
 * @param {string} pathLogFile
 * @param {Map<string, {name: string, description: string, regex: RegExp}>} regexHash
 * @return {string}
 */
const analyseFile = async function(pathLogFile, regexHash) {
  let message = '';
  let lineMatched = 0;
  console.info(`Going to read the file : ${pathLogFile}`);
  const eachLinePromise = new Promise((resolve) => {
    lineReader.eachLine(pathLogFile, function(line) {
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
    },
    function() {
      resolve();
    });
  });
  await eachLinePromise;
  if (lineMatched !== 0) {
    const filename = getFileNameFromPath(pathLogFile);
    return `## Analyse of ${filename} 📄 \n` + message;
  }
  return message;
};

module.exports = {deletePreviousComment, formatGlobalCommentTab, formatDescription, formatMessageTab, getFileNameFromPath, parseRegexHash, processLogs, updatePRComment, validateRegex};
