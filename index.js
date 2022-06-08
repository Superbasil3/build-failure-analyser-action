const core = require('@actions/core');
const github = require('@actions/github');
const lineReader = require('line-reader');

try {
  const pathLogFile = core.getInput('path-log-file');
  const githubToken = core.getInput('github-token');
  const githubDatabaseRepo = core.getInput('github-database-repo');

  console.log(`Go read file at : ${pathLogFile}!`);

  lineReader.eachLine(pathLogFile, function(line, last) {
    console.log('Line ' + line);
    if(last) {
      console.log('Last line printed.');
    }
  });
  regex.getRegexList()
} catch (error) {
  core.setFailed(error.message);
}


const regex = {
  getRegexList() {
    let jsonData = require('../database.json');
    console.log(jsonData);
  }
};