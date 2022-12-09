const core = require('@actions/core');
const github = require('@actions/github');
const {Octokit} = require('@octokit/rest');
const {getFileNameFromPath, getRegexHash, readFile, downloadFile} = require('./helpers');

try {
  const pathLogFile = core.getInput('path-log-file');
  const githubContext = github.context;
  const githubToken = core.getInput('github-token');
  const regexesFileUrl = core.getInput('regexes-file-url') || 'https://raw.githubusercontent.com/Superbasil3/build-failure-analyser-action/main/regexes.json';
  console.debug(`regexesFileUrl : ${regexesFileUrl}`);
  // Create a variable to store that basename from pathRegexFile
  const fileName = getFileNameFromPath(pathLogFile);
  const messageHeader = `:bangbang: [build-failure-analyser-action] : Some regexes have matched one the file ${fileName} :bangbang: \n\n`;
  if (githubContext.payload.pull_request == null) {
    core.setFailed('No pull request found.');
    throw new Error('No pull request found.');
  }
  const pullRequestNumber = githubContext.payload.pull_request.number;
  const regexHash = getRegexHash('../regexes.json');
  const octokit = new Octokit({
    auth: githubToken,
  });

  readFile(pathLogFile, regexHash, messageHeader, githubContext, pullRequestNumber, octokit);

  // Test to download files from URL
  downloadFile(regexesFileUrl, 'regexes.downloaded.json');
} catch (error) {
  core.setFailed(error.message);
}
