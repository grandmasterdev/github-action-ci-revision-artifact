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

export const uploadArtifact = async (repoName: string, revision: string) => {
  if (!revision) {
    throw new Error(`[uploadArtifact] missing revision!`);
  }

  if (!artifactRepo) {
    throw new Error(`[uploadArtifact] missing artifact repo!`);
  }

  const buildArtifactName = `${repoName}-${revision}.zip`;

  await exec(`cp ./build.zip ./${buildArtifactName}`);

  if (artifactRepo === ArtifactRepo.artifactory) {
    await exec(
      `curl -X PUT -H "Authorization: Bearer ${{ artifactToken }}" ${{
        artifactHost,
      }}/${{ artifactPath }} -T ${{ buildArtifactName }}`
    );
  }
};

export enum ArtifactRepo {
  artifactory = "artifactory",
}
