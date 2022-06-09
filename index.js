const core = require('@actions/core');
const github = require('@actions/github');
const lineReader = require('line-reader');

const regex = {
  getRegexHash() {
    const regexHash = {}

    const jsonData = require('../database.json');
    const causesEntries = Object.entries(jsonData.causes)
    const nbrCauses = causesEntries.length
    let nbrIndications = 0
    for(const [id, cause] of causesEntries) {
      for(const indication of cause.indications){
        regexHash[indication] = id
        nbrIndications++
      }
    }
    console.log(`Loaded ${nbrCauses} cause(s), including ${nbrIndications} indication(s)`)
  }
};

try {
  const pathLogFile = core.getInput('path-log-file');
  const githubToken = core.getInput('github-token');
  const githubDatabaseRepo = core.getInput('github-database-repo');

  console.log(`Go read file at : ${pathLogFile}!`);

  const regexHash = regex.getRegexHash()
  lineReader.eachLine(pathLogFile, function(line, last) {

    var re = new RegExp("ab+c");

    console.log('Line ' + line);
    if(last) {
      console.log('Last line printed.');
    }
  });

} catch (error) {
  core.setFailed(error.message);
}


