const {updatePRComment} = require('../src/helpers');

test('test_call_update_pr_ok', () => {
  const octokit = {
    issues: {
      createComment: jest.fn(),
      listComments: jest.fn().mockReturnValue({'data': []}),
      updateComment: jest.fn(),
    },
  };
  updatePRComment(octokit, 'message', 'owner', 'repo', 1);
  expect(octokit.issues.updateComment).not.toHaveBeenCalled();
  expect(octokit.issues.listComments).toHaveBeenCalledWith({owner: 'owner', repo: 'repo', issue_number: 1});
});


test('test_description_formatting', () => {
  const logs = '2021-03-03T15:00:00.000Z - info: [build-failure-analyser-action] : Some regexes have matched one the file regexes.json :bangbang:';
  const regex = new RegExp(/.* - (.*): \[(.*)\] : .*/);
  const regexMatch = regex.exec(logs);
  let description = 'Matching the log level with \'{0}\' for the message \'{1}\'';
  regexMatch.shift();
  regexMatch.forEach((element, index) => {
    description = description.replace(`{${index}}`, element);
  });
  expect(description).toBe('Matching the log level with \'info\' for the message \'build-failure-analyser-action\'');
});
