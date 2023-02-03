import { getInput } from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import { context } from "@actions/github";
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

  let filesToUpload = [`build.${packageExtension}`];

  if (extraArtifactFiles) {
    let extraArtifactFilesArray = extraArtifactFiles.split(",");

    extraArtifactFilesArray = extraArtifactFilesArray.filter((el) => {
      return el.trim();
    });

    filesToUpload = filesToUpload.concat(extraArtifactFilesArray);
  }

  for (const file in filesToUpload) {
    if (artifactRepo === ArtifactRepo.artifactory) {
      const output = await getExecOutput(
        `curl -X PUT -H "Authorization: Bearer ${artifactToken}" ${artifactHost}/${artifactPath}/${revision}/${file} -T ${file}`
      );

      if (output.stdout) {
        /**
         * TODO: Fix module id not appearing in build info
         */
        await createBuildInfo(
          buildArtifactName,
          revision,
          JSON.parse(output.stdout)
        );
        await uploadBuildInfo();
      }
    }
  }
};

const createBuildInfo = async (
  buildArtifactName: string,
  version: string,
  artifactUploadReponse: ArtifactUploadResponse
) => {
  const buildNumber = context.runNumber;

  const { checksums, path, mimeType } = artifactUploadReponse;
  const { sha1, md5, sha256 } = checksums;

  const id = generateBuildInfoModuleId(path, version);

  const buildInfo: ArtifactoryBuildInfo = {
    version,
    name: buildArtifactName,
    number: buildNumber,
    started: artifactUploadReponse.created,
    url: `${context.serverUrl}/${context.repo.repo}/actions/runs/${context.runId}`,
    buildAgent: {
      name: "Pipeline",
      version: "",
    },
    agent: {
      name: "GithubAction",
      version: "",
    },
    modules: [
      {
        id,
        artifacts: [
          {
            name: buildArtifactName,
            type: mimeType,
            sha1,
            md5,
            sha256,
            path,
          },
        ],
      },
    ],
  };

  writeFileSync(join("build-info.json"), JSON.stringify(buildInfo), {
    encoding: "utf8",
  });

  return id;
};

const uploadBuildInfo = async () => {
  await exec(
    `curl -X PUT -H "Authorization: Bearer ${artifactToken}" ${artifactHost}/artifactory-build-info -T build-info.json`
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
  url: string;
  buildAgent?: ArtifactoryBuildInfoBuildAgent;
  agent?: ArtifactoryBuildInfoAgent;
  modules: ArtifactoryBuildInfoModule[];
};

export type ArtifactoryBuildInfoBuildAgent = {
  name: string;
  version: string;
};

export type ArtifactoryBuildInfoAgent = {
  name: string;
  version: string;
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
  type: string;
  path: string;
};
