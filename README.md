# Build-failure-analyse Action

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

## Inputs

## `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.



## Outputs

## `NONE`

## Example usage

uses: actions/build-failure-analyser-action@v0.1
with:
  who-to-greet: 'Mona the Octocat'


## Message format

<!-- id_build_failure_analyser_action_3 -->:bangbang: [build-failure-analyser-action] : Some regexes have matched one the file logs.txt :bangbang: 
The line 
```
Fri Dec 16 01:46:23 2005] [error] [client 1.2.3.4] Directory index forbidden by rule: /home/test/
```
has been match with the rule(s) : 
- `regex` (ID / NAME) : 
  - DEscription
  

