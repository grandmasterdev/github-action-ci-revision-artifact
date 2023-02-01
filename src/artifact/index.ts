import { getInput } from "@actions/core";
import { exec } from "@actions/exec";

const artifactRepo = getInput("artifact-repo", {
  required: true,
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

  let buildArtifactName = `${repoName}-${revision}.${packageExtension}`;

  if (mainBranch) {
    buildArtifactName = `${repoName}-${revision}${
      artifactPostfix ? "-" + artifactPostfix : ""
    }.${packageExtension}`;
  }

  await exec(`cp ./build.${packageExtension} ./${buildArtifactName}`);

  if (artifactRepo === ArtifactRepo.artifactory) {
    await exec(
      `curl -X PUT -H "Authorization: Bearer ${artifactToken}" ${artifactHost}/${artifactPath}/${buildArtifactName} -T ${buildArtifactName}`
    );
  }
};

export enum ArtifactRepo {
  artifactory = "artifactory",
}
