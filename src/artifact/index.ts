import { getInput } from "@actions/core";
import { exec } from "@actions/exec";
import { generateBuildInfoModuleId } from "../utils/artifactory-util";
import { writeFileSync } from "fs";
import { join } from "path";

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
    const output = await exec(
      `curl -X PUT -H "Authorization: Bearer ${artifactToken}" ${artifactHost}/${artifactPath}/${buildArtifactName} -T ${buildArtifactName}`
    );

    console.log("####", output);

    // await createBuildInfo(buildArtifactName, revision, JSON.parse(output))
    // await uploadBuildInfo(buildArtifactName);
  }
};

const createBuildInfo = async (
  buildArtifactName: string,
  version: string,
  artifactUploadReponse: ArtifactUploadResponse
) => {
  const buildNumber = 1;

  const { checksums, repo, path } = artifactUploadReponse;
  const { sha1, md5, sha256 } = checksums;

  const buildInfo: ArtifactoryBuildInfo = {
    version,
    name: buildArtifactName,
    number: buildNumber,
    started: artifactUploadReponse.created,
    modules: [
      {
        id: generateBuildInfoModuleId(repo, path),
        artifacts: [
          {
            name: buildArtifactName,
            sha1,
            md5,
            sha256,
          },
        ],
      },
    ],
  };

  writeFileSync(join("build-info.json"), JSON.stringify(buildInfo), {
    encoding: "utf8",
  });
};

const uploadBuildInfo = async (buildArtifactName: string) => {
  await exec(
    `curl -X PUT -H "Authorization: Bearer ${artifactToken}" ${artifactHost}/artifactory-build-info/${buildArtifactName} -T ${buildArtifactName}`
  );
};

export enum ArtifactRepo {
  artifactory = "artifactory",
}

export type ArtifactUploadResponse = {
  repo: string;
  path: string;
  created: string;
  createdBy: string;
  downloadUri: string;
  mimeType: string;
  size: string | number;
  checksums: {
    sha1: string;
    md5: string;
    sha256: string;
  };
  originalChecksums: {
    sha256: string;
  };
  uri: string;
};

export type ArtifactoryBuildInfo = {
  version: string;
  name: string;
  number: number;
  started: string;
  modules: ArtifactoryBuildInfoModule[];
};

export type ArtifactoryBuildInfoModule = {
  id: string;
  artifacts: ArtifactoryBuildInfoArtifact[];
};

export type ArtifactoryBuildInfoArtifact = {
  sha1: string;
  md5: string;
  sha256: string;
  name: string;
};
