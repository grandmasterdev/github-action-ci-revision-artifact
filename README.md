# github-action-ci-revision-artifact

Update git with revision and upload packaged build to artifact repo

## Dependecies

- [github-action-ci-nodejs-package](https://github.com/grandmasterdev/github-action-ci-nodejs-package)

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

### Create/Not a revision tag to git

If your build is from the main/master branch where you want it to be use as the release build, you may congfigure the action with the following input and it will create a release tag...

```yaml
- uses: grandmasterdev/github-action-ci-revision-artifact@latest
      with:
        working-dir: ${{github.workspace}}
        create-revision: true
```

If you do not want the build to create the release tag you may configure the action input like the following...

```yaml
- uses: grandmasterdev/github-action-ci-revision-artifact@latest
      with:
        working-dir: ${{github.workspace}}
        create-revision: false
```

## Inputs

| Name                                | Description                                                                                                                                                                                                 | Required?          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| working-dir                         | The directory where the code is being checkout                                                                                                                                                              | :heavy_check_mark: |
| version-type                        | The revision to use `semantic` or `datehash`                                                                                                                                                                | :heavy_check_mark: |
| artifact-repo                       | "artifactory" (only supporting artifactory for now). Default to "artifactory"                                                                                                                               | :x:                |
| artifact-host                       | The host of the artifact repo (eg. http://localhost:8081/artifactory)                                                                                                                                       | :heavy_check_mark: |
| artifact-path                       | The repo path to upload the build artifact                                                                                                                                                                  | :heavy_check_mark: |
| artifact-token                      | The artifact host api token. Not needed if username/password is set                                                                                                                                         | :x:                |
| artifact-username                   | The artifact repo service username. Not needed if token is set                                                                                                                                              | :x:                |
| artifact-password                   | The artifact repo service password. Not needed if token is set                                                                                                                                              | :x:                |
| main-branch                         | The idenfier of which will be the main git repo branch that will be use for production release. Only needed if you wist to have different name of production vs non-production artifact.                    | :x:                |
| artifact-postfix                    | The postfix that will be use for non-production artifact if "main-branch" is configured. If no value is set here it will default to standard naming.                                                        | :x:                |
| packager-type                       | Define if it is a "zip" or "tar" package. If no value provided it will be defaulted to "zip"                                                                                                                | :x:                |
| extra-artifact-files                | The files that will be uploaded as artifacts other than "build.<extension>". Multiple artifacts must be "," seperated (eg. "asset.tar, script.sh"). Default would be "build.<ext>" if no value is provided. | :x:                |
| create-revision                     | Determine if the revision should be created or not by the action. Default to `true`                                                                                                                         | :x:                |
| revision-datehash-with-milliseconds | Determine if the datehash revision should include milliseconds or not. Default to `true`                                                                                                                    | :x:                |

## Outputs

| Name         | Description                                       | Type   |
| ------------ | ------------------------------------------------- | ------ |
| artifact-url | The path where the packaged artifact was uploaded | string |
| revision     | The revision number/label of the build            | string |
