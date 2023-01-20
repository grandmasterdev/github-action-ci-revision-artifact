import { getInput } from "@actions/core";
import { getExecOutput, exec } from "@actions/exec";

const versionType = getInput("version-type", {
  required: true,
  trimWhitespace: true,
});

export const createGitRevision = async () => {
  let revision = "";

  await exec(`apt install git-extras`);

  if (versionType !== VersionType.datehash) {
    /**
     * Only supporting nodejs based applications at the moment
     */
  } else {
    revision = new Date()
      .toISOString()
      .replace(/-/g, "")
      .replace(/:/g, "")
      .replace(/\./g, "");
  }

  // await exec(`git tag ${revision}`);
  // await exec(`git push origin --tags`);

  // const releaseTitle = (await getExecOutput(`git log -n 1 --pretty=format:%s`))
  //   .stdout;
  const releaseMessage = (
    await getExecOutput(`git log -n 1 --pretty=format:%B`)
  ).stdout;

  await exec(`git-release ${revision} -m ${releaseMessage}`);

  return revision;
};

export enum VersionType {
  semantic = "semantic",
  datehash = "datehash",
}
