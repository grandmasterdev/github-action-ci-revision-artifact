import { getInput } from "@actions/core";
import { getExecOutput } from "@actions/exec";
import { getOctokit, context } from "@actions/github";

const versionType = getInput("version-type", {
  required: true,
  trimWhitespace: true,
});

const createRevision = getInput("create-revision", {
  required: false,
  trimWhitespace: true,
});

export const createGitRevision = async () => {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error(`[createGitRevision] no github token found in the env!`);
  }

  const github = getOctokit(process.env.GITHUB_TOKEN);
  const { repo, owner } = context.repo;

  const gitSHA5 = context.sha ? context.sha.slice(-5) : "";

  let revision = "";

  if (versionType !== VersionType.datehash) {
    /**
     * Only supporting nodejs based applications at the moment
     */
    throw new Error(
      `[createGitRevision] only supporting 'datehash' versioning at the moment. sorry.`
    );
  } else {
    revision = new Date()
      .toISOString()
      .replace(/-/g, "")
      .replace(/:/g, "")
      .replace(/\./g, "");

    revision = revision + gitSHA5;
  }

  const releaseMessage = (
    await getExecOutput(`git log -n 1 --pretty=format:%B`)
  ).stdout;

  if (createRevision === "true") {
    github.rest.repos.createRelease({
      owner,
      repo,
      tag_name: revision,
      generate_release_notes: true,
      name: releaseMessage,
    });
  }

  return {
    repo,
    revision,
  };
};

export enum VersionType {
  semantic = "semantic",
  datehash = "datehash",
}
