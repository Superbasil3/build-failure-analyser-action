const {formatGlobalCommentTab, formatMessageTab, parseRegexHash, validateRegex, formatDescription} = require('../../src/helpers');
const showdown = require('showdown');

// Create function to validate the regexes file format
validateRegexesFileFormat = function(regexesContent) {
  try {
    const messages = validateRegex(regexesContent);
    if (messages.length > 0) {
      document.getElementById('input_json_string_message').innerHTML = '<lu><li>' + messages.join('</li><li>') + '</li></lu>';
      document.getElementById('input_json_string_message').className = 'error';
      return false;
    } else {
      document.getElementById('input_json_string_message').innerHTML = 'The json is valid';
      document.getElementById('input_json_string_message').className = 'success';
      return true;
    }
  } catch (e) {
    document.getElementById('input_json_string_message').innerHTML = '<p>' + e.message + '</p><p>' + e.stack + '</p>';
    document.getElementById('input_json_string_message').className = 'error';
    return false;
  }
};

beautifyJson = function() {
  document.getElementById('input_json_string_message').innerHTML = '';
  document.getElementById('input_json_string_message').className = '';
  try {
    var ugly = document.getElementById('input_json_string').value;
    var obj = JSON.parse(ugly);
    var pretty = JSON.stringify(obj, undefined, 2);
    if(ugly === pretty) {
      document.getElementById('input_json_string_message').innerHTML = 'The json is already beautiful <3';
      document.getElementById('input_json_string_message').className = 'success';
    } else {
      document.getElementById('input_json_string').value = pretty;
    }
  } catch (e){
    document.getElementById('input_json_string_message').innerHTML = '<p>' + e.message + '</p><p>' + e.stack + '</p>';
    document.getElementById('input_json_string_message').className = 'error';
  }
}

// Create function to parse regexesContent into object
parseRegexesContent = function(regexesContent) {
  return parseRegexHash(JSON.parse(regexesContent));
};

// Create function to run regex against string
runRegex = function(regexHash, textarea) {
  let message = '';
  let lineMatched = 0;
  try {
    for (const line of textarea.split('\n')) {
      const regexesMatchingComment = [];
      for (const [indication, regexElement] of regexHash) {
        if (regexElement.regex.test(line)) {
          const formattedDescription = formatDescription(regexElement.description, regexElement.regex.exec(line));
          regexesMatchingComment.push(formatMessageTab(regexElement, indication, formattedDescription));
        }
      }
      if (regexesMatchingComment.length > 0) {
        // create the message to be sent to the PR
        message += formatGlobalCommentTab(line, regexesMatchingComment, ++lineMatched);
      }
    }
    if (message.length > 0) {
      console.log('message', message);
      document.getElementById('input_logs_string_message').innerHTML = convertMarkdownToHtml(message);
      document.getElementById('input_logs_string_message').className = '';
      return true;
    } else {
      document.getElementById('input_logs_string_message').innerHTML = 'No match found';
      document.getElementById('input_logs_string_message').className = '';
    }
  } catch (e) {
    document.getElementById('input_logs_string_message').innerHTML = '<p>' + e.message + '</p><p>' + e.stack + '</p>';
    document.getElementById('input_logs_string_message').className = 'error';
    return false;
  }
};

convertMarkdownToHtml = function(markdown) {
  const converter = new showdown.Converter();
  converter.setOption('tables', true);
  return converter.makeHtml(markdown.replaceAll('---\n','\n<hr>\n'));
};
