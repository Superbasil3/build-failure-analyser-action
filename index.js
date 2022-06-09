const core = require('@actions/core');
const github = require('@actions/github');
const lineReader = require('line-reader');
import { Octokit } from '@octokit/rest';


try {
  const regex = {
    getRegexHash() {
      const regexHash = {}

      const jsonData = require('../database.json');
      const causesEntries = Object.entries(jsonData.causes)
      const nbrCauses = causesEntries.length
      let nbrIndications = 0
      for(const [id, cause] of causesEntries) {
        for(const indication of cause.indications){
          let object = {}
          object['id'] = id
          object['regex'] = new RegExp(indication);
          regexHash[indication] = object
          nbrIndications++
        }
      }
      console.log(`Loaded ${nbrCauses} cause(s), including ${nbrIndications} indication(s)`)
      return Object.entries(regex.getRegexHash())
    }
  };


  const pullRequest = {
    update(message){
    }
  }

  const githubContext = github.context;
  if (githubContext.payload.pull_request == null) {
    core.setFailed('No pull request found.');
    throw new Error('No pull request found.');
  }
  const pull_request_number = githubContext.payload.pull_request.number;

  const pathLogFile = core.getInput('path-log-file');
  const githubToken = core.getInput('github-token');
  const githubDatabaseRepo = core.getInput('github-database-repo');

  const octokit = new Octokit({
    auth: githubToken
  });

  console.debug(`Go read file at : ${pathLogFile}!`);

  const regexHash = regex.getRegexHash()
  lineReader.eachLine(pathLogFile, function(line, last) {
    for(const [regex, regexElement] of regexHash){
      if(regexElement.regex.test(line)){
        console.debug(`Indication ${regex} of cause ${regexElement.id} is matching the line \n ${line}`)
        // Format Message to append in the error message
      }
    }
  });

} catch (error) {
  core.setFailed(error.message);
}


