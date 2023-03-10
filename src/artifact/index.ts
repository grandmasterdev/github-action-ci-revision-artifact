import { getInput } from "@actions/core";
import { exec } from "@actions/exec";
import { context } from "@actions/github";
import { ArtifactRepo, deploy } from "./artifactory";

const artifactRepo = getInput("artifact-repo", {
  required: false,
});
const artifactToken = getInput("artifact-token", {
  required: false,
});
const artifactUsername = getInput("artifact-username", {
  required: false,
});
const artifactPassword = getInput("artifact-password", {
  required: false,
});
const artifactHost = getInput("artifact-host", {
  required: true,
});
const artifactPath = getInput("artifact-path", {
  required: true,
});
const mainBranch = getInput("main-branch", {
  required: false,
});
const artifactPostfix = getInput("artifact-postfix", {
  required: false,
});
const packagerType = getInput("packager-type", {
  required: false,
});
const extraArtifactFiles = getInput("extra-artifact-files", {
  required: false,
});

export const uploadArtifact = async (repoName: string, revision: string) => {
  if (!revision) {
    throw new Error(`[uploadArtifact] missing revision!`);
  }

  if (!artifactRepo) {
    throw new Error(`[uploadArtifact] missing artifact repo!`);
  }

  let packageExtension = "zip";

  if (packagerType) {
    packageExtension = packagerType;
  }

  let buildArtifactName = `${repoName}-${revision}`;

  const gitRef = context.ref;
  const gitRefParts = gitRef.split("/");
  const branch = gitRefParts[gitRefParts.length - 1];

  console.log("mainBranch", mainBranch);
  console.log("branch", branch);

  if (mainBranch && mainBranch !== branch) {
    buildArtifactName = artifactPostfix
      ? `${repoName}-${revision}"-"${artifactPostfix}`
      : `${repoName}-${revision}`;
  }

  const buildArtifactFilename = `${buildArtifactName}.${packageExtension}`;

  await exec(`cp ./build.${packageExtension} ./${buildArtifactFilename}`);

  let filesToUpload = [`${buildArtifactFilename}`];

  if (extraArtifactFiles) {
    let extraArtifactFilesArray = extraArtifactFiles.split(",");

    extraArtifactFilesArray = extraArtifactFilesArray.filter((el) => {
      return el.trim();
    });

    filesToUpload = filesToUpload.concat(extraArtifactFilesArray);
  }

  if (artifactRepo === ArtifactRepo.artifactory) {
    await deploy({
      artifactHost,
      artifactPath,
      artifactToken,
      artifactUsername,
      artifactPassword,
      revision,
      filesToUpload,
    });
  }
};
