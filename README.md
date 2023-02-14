# Build-failure-analyse Action

This action is analysing a log file against a json list of regexes to match potential recurrent build failures.
* This is highly inspired by the [Build Failure Analyzer Plugin](https://wiki.jenkins.io/display/JENKINS/Build+Failure+Analyzer) for Jenkins.

## Inputs

### `path-log-file`

**Not Required**  "Where the log file is located". Default `../regexes.json`.

### `github-token`

**Required** GitHub token with permission to read / create / delete PR comment. Default `none`.

### `regexes-file-location`

**Required** The system file location of the regexes to run again the log file. Default `none`.

## Outputs

### `NONE`

## Permissions
The jobs need enough right to be able to read / delete / create PR comment
```yaml
permissions:
  discussions: write
  pull-requests: write
```


## How to use

### 1 - Analyse a single log file
You can pass a file path directly. Only this file will be analysed. It is preferred to have the analyse action in the same job as the build.
```yaml
jobs:
  analyse_logs_from_file:
    runs-on: ubuntu-latest
    steps:
      - name: build
        run: mvn clean package | tee maven-logs.txt ; exit "${PIPESTATUS[0]}" # tee allow to print the output both in the file AND the console. 'exit "${PIPESTATUS[0]}"' return the code the mvn command, which allow you to have a failed step if maven is failing.
      - name: analyse_logs_from_file
        id: analyse_logs_from_file
        if: always() # necessary for the step to run with previous run failed.
        uses: Superbasil3/build-failure-analyser-action@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          regexes-file-location: URL_CAUSES_FILE
          path-log-file: maven-logs.txt
```

### 2 - Analyse files in a folder
You can pass a folder path, it will analyse the file in the folder and their subfolders (depth 2 only). Message will say which cause are mapped with which file.             
```yaml
jobs:
  analyse_logs_from_folder:
    runs-on: ubuntu-latest
    steps:
      - name: create_log_folder
        run: mkdir -p logs
      - name: build_1
        run: mvn clean package1 | tee logs/build1.logs ; exit "${PIPESTATUS[0]}" # tee allow to print the output both in the file AND the console. 'exit "${PIPESTATUS[0]}"' return the code the mvn command, which allow you to have a failed step if maven is failing.
      - name: build_2
        if: always() # necessary for the step to run with previous run failed.
        run: mvn clean package2 | tee logs/build2.logs ; exit "${PIPESTATUS[0]}" # tee allow to print the output both in the file AND the console. 'exit "${PIPESTATUS[0]}"' return the code the mvn command, which allow you to have a failed step if maven is failing.
      - name: analyse_logs_from_folder
        id: analyse_logs_from_folder
        if: always() # necessary for the step to run with previous run failed.
        uses: Superbasil3/build-failure-analyser-action@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          regexes-file-location: URL_CAUSES_FILE
          path-log-file: logs
```

### 3 - Analyse the GitHub action logs of previous jobs
In this case, the action will download the logs of previous completed in failure jobs, and then analyse them against the causes file.
You just need to specify the `needs` block to be sure the step(s) you want to monitor are completed, and the `if: ${{ always() }}` block to run even with previous failed jobs.
```yaml
  previous_job:
    runs-on: ubuntu-latest
    steps:
      - name: previous_step
        run: mvn clean package
  analyse_logs_from_previous_steps:
    runs-on: ubuntu-latest
    needs: [previous_job] # necessary to wait for the previous jobs to be completed
    if: ${{ always() }} # necessary for the step to run with previous run failed.
    steps:
      - name: analyse_logs_from_previous_steps
        id: analyse_logs_from_previous_steps
        if: always() # necessary for the step to run with previous run failed.
        uses: Superbasil3/build-failure-analyser-action@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          regexes-file-location: URL_CAUSES_FILE
```

## Validate configuration
To validate the configuration, you can go on the [GitHub Page](https://superbasil3.github.io/build-failure-analyser-action) of the project.
At the moment, it allow you to **beautify** the json (easier to read), **validate** the format and **run it against** logs to see the message that will get generated.

## Message format

<!-- id_build_failure_analyser_action_analyse_logs_from_previous_steps_27 -->
[build-failure-analyser-action] runned by workflow [integration-testing / analyse_logs_from_previous_steps](https://github.com/Superbasil3/build-failure-analyser-action/actions/runs/4171629802/jobs/7221770600) :

## Analyse of generate_failed_job_logs_1.log 📄
> ### <ins>Match n°1<ins> ⚡
> ```
> 2023-02-14T07:57:43.9017657Z [Fri Dec 16 02:25:55 2005] [error] [client 1.2.3.4] Client sent malformed Host header
> ```
> | ID | Name | Regex | Description |
> | --- | --- | --- | --- |
> | ID_1 | Supposed to match file_server.log logs | `\[(.*?)\] \[client \d+\.\d+\.\d+\.\d+\] Client sent malformed (.*) header` | DESCRIPTION_1_LINE_1 matching log level 'Fri Dec 16 02:25:55 2005] [error'</br>DESCRIPTION_1_LINE_2 matching header name 'Host' |
> ---
## Analyse of generate_failed_job_logs_2.log 📄
> ### <ins>Match n°1<ins> ⚡
> ```
> 2023-02-14T07:57:42.2883564Z [Fri Dec 16 02:25:55 2005] [error] [client 1.2.3.4] Client sent malformed Host header
> ```
> | ID | Name | Regex | Description |
> | --- | --- | --- | --- |
> | ID_1 | Supposed to match file_server.log logs | `\[(.*?)\] \[client \d+\.\d+\.\d+\.\d+\] Client sent malformed (.*) header` | DESCRIPTION_1_LINE_1 matching log level 'Fri Dec 16 02:25:55 2005] [error'</br>DESCRIPTION_1_LINE_2 matching header name 'Host' |
> ---

<sup>Read the documentation of the plugins <a href="https://github.com/Superbasil3/build-failure-analyser-action">build-failure-analyser-action</a></sup></br><sup>You can test and validate the test file and logs on the <a href="https://superbasil3.github.io/build-failure-analyser-action/">Github Page</a></sup>
---