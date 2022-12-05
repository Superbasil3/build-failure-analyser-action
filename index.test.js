const {updatePRComment} = require('./helpers');

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
