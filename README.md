# ci-nodejs-package

Continuous Integration using **NodeJs** for packaging artifact

## What this does?

It creates a git release and publish the build artifact to selected artifact repo.

- artifactory (jFrog)

## How to use it

Create a step in your job that will use the action as follows:

```yaml
-  uses: actions/checkout

-  uses: grandmasterdev/github-action-ci-revision-artifact@latest
        with:
          working-dir: ${{github.workspace}}
        env:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}

```

### Getting the working directory

The working directory can be retrieve from various ways, but the easiest is by environment variables.
You can get the value by adding the following action before this action in the steps.

```yaml
name: Get working directory list
      run: |
        WD=$(pwd)
        echo "wd=${WD}" >> $GITHUB_ENV
      id: working-dir

```

Alternatively, you could use github action `context` to get the working directory via

```
${{github.workspace}}
```

With the above, you can then access the value of the working directory via the environment variable like the following:

```yaml
- name: Get working directory list
      run: |
        WD=$(pwd)
        echo "wd=${WD}" >> $GITHUB_ENV
      id: working-dir

- uses: grandmasterdev/github-action-ci-revision-artifact@latest
      with:
        working-dir: ${{env.wd}}
```

or if you are using `context`

```yaml
- uses: grandmasterdev/github-action-ci-revision-artifact@latest
      with:
        working-dir: ${{github.workspace}}
```

## Inputs

| Name             | Description                                                                                                                                                                              | Required?          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| working-dir      | The directory where the code is being checkout                                                                                                                                           | :heavy_check_mark: |
| version-type     | The revision to use `semantic` or `datehash`                                                                                                                                             | :heavy_check_mark: |
| artifact-repo    | The desired artifact repo to upload the build artifact                                                                                                                                   | :heavy_check_mark: |
| artifact-host    | The host of the artifact repo (eg. http://localhost:8081/artifactory)                                                                                                                    | :heavy_check_mark: |
| artifact-path    | The repo path to upload the build artifact                                                                                                                                               | :heavy_check_mark: |
| artifact-token   | The artifact host api token                                                                                                                                                              | :x:                |
| main-branch      | The idenfier of which will be the main git repo branch that will be use for production release. Only needed if you wist to have different name of production vs non-production artifact. | :x:                |
| artifact-postfix | The postfix that will be use for non-production artifact if "main-branch" is configured. If no value is set here it will default to standard naming.                                     | :x:                |

## Outputs

| Name       | Description                                   | Type    |
| ---------- | --------------------------------------------- | ------- |
| is_updated | Inform if the version has been updated or not | boolean |
