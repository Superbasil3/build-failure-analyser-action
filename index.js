const core = require('@actions/core');
const github = require('@actions/github');
const lineReader = require('line-reader');

const regex = {
  getRegexList() {
    const regexHash = {}
    let jsonData = require('../database.json');
    console.log(jsonData);
    for(const [id, cause] of  Object.entries(jsonData.causes)) {
      for(const indication of cause.indications){
        console.log("indication : " + indication)
        regexList[indication] = id
      }
    }
    console.log(regexHash)
  }
};

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


