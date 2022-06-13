# Build Failure Analyser Action

A GitHub action that scans the log for recognised patterns of known causes to build failures and displays them on the build page for quicker recognition of why the build failed.
## Inputs

## `path-log-file`
**Required** The path of the logs file

## `path-log-database-json`
**Required** The path of the json file with the alert

## `github-token`
**Required** The github token to be able to update comment on the PR

## `step-outcome`
**Required** The step outcome, to know if this is a failure or not

| Name                     | Description                                           | Required   |
|--------------------------|-------------------------------------------------------|------------|
| `path-log-file`          | The path of the log file                              | **True**   |
| `path-log-database-json` | The path of the [json databse](#json-database)        | **True**   |
| `github-token`           | Github token to be able use github api                | **True**   |
| `step-outcome`           | The step outcome, to know if this is a failure or not | **True**   |

## Outputs

## `status`
Return what the job did : create / update / delete the comment

| Name                     | Description                                                | Required |
|--------------------------|------------------------------------------------------------|----------|
| `step-outcome`           | What happened in the process ( create / update / created ) | true     |


## Json Database

The format of the pattern with the message
```json
{
  "causes": {
    "ID_1": {
      "name": "NAME_1",
      "description": "DESCRIPTION_1",
      "comment": "",
      "indications": [
        "PATTERN_1_a",
        "PATTERN_1_b"
      ]
    }
  }
}
```


## Example usage
```yaml
id: run_build_failure_analyser
name: Run job failure analyser
uses: Superbasil3/build-failure-analyser-action@v0.1.0
with:
  path-log-file: /tmp/var/logs
  path-log-database-json: /tmp/var/database.json
  github-token: ${{ secrets.GITHUB_TOKEN }}
  step-outcome: ${{ steps.<step_id>.outcome }}
```

## Full Example usage
```yaml
jobs:
  pr_validation:
    runs-on: ubuntu-latest
    name: Try build-failure-analyser-action
    steps:
      - id: generate_log_file
        name: Create log file
        run: |
          echo 'This is a test' > ${RUNNER_TEMP}/logs.txt
      - id: generate_variable
        if: always()
        name : Generate Varirable
        run: |
          echo "::set-output name=path_logs::$(echo ${RUNNER_TEMP,,}'/logs.txt')"
          echo "::set-output name=path_json_database::$(echo ${RUNNER_TEMP,,}'/remote-database.json')"
      - id: download_json_file
        if: always()
        name: Download json database
        run: curl https://raw.githubusercontent.com/Superbasil3/build-failure-analyser-action/alpha/database.json -o ${{ steps.generate_variable.outputs.path_json_database }}
      - id: run_build_failure_analyser
        if: always()
        name: Run job failure analyser
        uses: Superbasil3/build-failure-analyser-action@v0.1.0
        with:
          path-log-file: ${{ steps.generate_variable.outputs.path_logs }}
          path-log-database-json: ${{ steps.generate_variable.outputs.path_json_database }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          step-outcome: ${{ steps.generate_log_file.outcome }}
```

## Current limitations
- We do not allow multi-line matching
- We are not able to get the logs directly from the workflow run
  - use tee in order to have both the logs in the console and in a file
    - `${CMD} | tee -a ${RUNNER_TEMP}/maven-logs.txt ; exit "${PIPESTATUS[0]}`
    - `-a` to specify the log file
    - `exit "${PIPESTATUS[0]}` allow to return the status of `${CMD}`, so the steps finish failed as normal

## Inspiration
Thanks to the jenkins plugin [build-failure-analyzer-plugin](https://github.com/jenkinsci/build-failure-analyzer-plugin) which I missed a lot when migrating to github action.

# License
MIT License
