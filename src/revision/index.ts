import { getInput } from "@actions/core";
import { getExecOutput } from "@actions/exec";
import { getOctokit, context } from "@actions/github";

const versionType = getInput("version-type", {
  required: true,
  trimWhitespace: true,
});

export const createGitRevision = async () => {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error(`[createGitRevision] no github token found in the env!`);
  }

  const github = getOctokit(process.env.GITHUB_TOKEN);
  const { repo, owner } = context.repo;

  let revision = "";

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

  github.rest.repos.createRelease({
    owner,
    repo,
    tag_name: revision,
    generate_release_notes: true,
    name: releaseMessage,
  });
  // await exec(`git-release ${revision} -m ${releaseMessage}`);

  return revision;
};

export enum VersionType {
  semantic = "semantic",
  datehash = "datehash",
}
