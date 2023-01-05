# Build-failure-analyse Action

This action is analysing a log file againt a json list of regexes to match potential recurrent build failures.

## Inputs

## `path-log-file`

**Not Required**  "Where the log file is located". Default `../regexes.json`.

## `github-token`

**Required** GitHub token with permission to read / create / delete PR comment. Default `none`.

## `regexes-file-location`

**Required** The system file location of the regexes to run again the log file. Default `none`.

## Outputs

## `NONE`

## Example usage

uses: actions/build-failure-analyser-action@v0.1
with:
  who-to-greet: 'Mona the Octocat'


## Message format

<!-- id_build_failure_analyser_action_4 -->:bangbang: [build-failure-analyser-action] : Some regexes have matched one the file logs.txt :bangbang: 

### <ins>Match n°1<ins> ⏰
```
[Fri Dec 16 02:25:55 2005] [error] [client 1.2.3.4] Client sent malformed Host header
```
| ID | Name | Regex | Description |
| --- | --- | --- | --- |
| ID_1 | NAME_1 | `\[error\] \[client \d+\.\d+\.\d+\.\d+\] Client sent malformed Host header` | DESCRIPTION_1_LINE_1</br>DESCRIPTION_1_LINE_2 |
---
### <ins>Match n°2<ins> ❌
```
[Sat Jun 24 09:06:23 2006] [notice] Apache/2.0.46 (Red Hat) DAV/2 configured -- resuming normal operations(PATTERN_2_a)
```
| ID | Name | Regex | Description |
| --- | --- | --- | --- |
| ID_2 | NAME_2 | `PATTERN_2_a` | DESCRIPTION_2 |
---

## Config testing
You can check the json of rules and/or validate against a lot file on the [build-failure-analyser-action GitHub Page](https://superbasil3.github.io/build-failure-analyser-action/)

