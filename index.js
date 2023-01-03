const core = require('@actions/core');
const github = require('@actions/github');
const {Octokit} = require('@octokit/rest');
const {getFileNameFromPath, processLogs} = require('./helpers');

try {
  const pathLogFile = core.getInput('path-log-file') || '../regexes.json';
  const githubContext = github.context;
  const githubToken = core.getInput('github-token');
  const regexesFileLocation = core.getInput('regexes-file-location');
  // Create a variable to store that basename from pathRegexFile
  const fileName = getFileNameFromPath(pathLogFile);
  const messageHeader = `:bangbang: [build-failure-analyser-action] : Some regexes have matched one the file ${fileName} :bangbang: \n\n`;
  if (githubContext.payload.pull_request == null) {
    core.setFailed('No pull request found.');
    throw new Error('No pull request found.');
  }
  const pullRequestNumber = githubContext.payload.pull_request.number;
  const octokit = new Octokit({
    auth: githubToken,
  });
  processLogs(regexesFileLocation, pathLogFile, messageHeader, githubContext, pullRequestNumber, octokit);
} catch (error) {
  core.setFailed(error.message);
}
