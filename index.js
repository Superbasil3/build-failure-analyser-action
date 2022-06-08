const core = require('@actions/core');
const github = require('@actions/github');
const lineReader = require('line-reader');

try {
  const pathLogFile = core.getInput('path-log-file');
  const githubToken = core.getInput('github-token');
  const githubDatabaseRepo = core.getInput('github-database-repo');

  console.log(`Go read file at : ${pathLogFile}!`);

  lineReader.eachLine(pathLogFile, function(line, last) {
    if(last) {
      console.log('Last line printed.');
    }
  });
} catch (error) {
  core.setFailed(error.message);
}
