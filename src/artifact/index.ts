import { getInput } from "@actions/core";
import { exec } from "@actions/exec";
import { ArtifactRepo, deploy } from "./artifactory";

const artifactRepo = getInput("artifact-repo", {
  required: false,
});
const artifactToken = getInput("artifact-token", {
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

  if (mainBranch) {
    buildArtifactName = `${repoName}-${revision}${
      artifactPostfix ? "-" + artifactPostfix : ""
    }.${packageExtension}`;
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
      revision,
      filesToUpload,
    });
  }
};
