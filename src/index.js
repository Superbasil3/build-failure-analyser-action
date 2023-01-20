const core = require('@actions/core');
const github = require('@actions/github');
const {Octokit} = require('@octokit/rest');
const {processLogs} = require('./helpers');

try {
  const pathLogFile = core.getInput('path-log-file');
  const githubContext = github.context;
  const githubToken = core.getInput('github-token');
  const regexesFileLocation = core.getInput('regexes-file-location') || '../regexes.json';
  // Create a variable to store that basename from pathRegexFile
  if (githubContext.payload.pull_request == null) {
    core.setFailed('No pull request found.');
    throw new Error('No pull request found.');
  }
  const pullRequestNumber = githubContext.payload.pull_request.number;
  const octokit = new Octokit({
    auth: githubToken,
  });
  processLogs(regexesFileLocation, pathLogFile, githubContext, pullRequestNumber, octokit);
} catch (error) {
  console.log(error);
  core.setFailed(error.message);
}
