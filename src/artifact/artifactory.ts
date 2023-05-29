import { exec, getExecOutput } from "@actions/exec";
import { context } from "@actions/github";
import {
  generateBuildInfoModuleId,
  generateCurlCredential,
} from "../utils/artifactory-util";
import { writeFileSync } from "fs";
import { join } from "path";
import { getInput } from "@actions/core";

const artifactProperties = getInput("artifact-properties", {
  required: false,
});

/**
 * Run deployment of artifact and build-info to jfrog artifactory repo
 * @param props
 */
export const deploy = async (props: Deploy) => {
  const startTime = new Date();

  const {
    artifactHost,
    artifactToken,
    artifactUsername,
    artifactPassword,
    artifactPath,
    revision,
    filesToUpload,
  } = props;

  const artifactUploadResponses: ArtifactUploadResponseInfo[] = [];

  const credentialStr = generateCurlCredential({
    artifactPassword,
    artifactUsername,
    artifactToken,
  });

  for (const i in filesToUpload) {
    const artifactUrl = `${artifactHost}/${artifactPath}/${revision}/${filesToUpload[i]}`;

    const output = await getExecOutput(
      `curl -X PUT ${credentialStr} ${artifactUrl} -T ${filesToUpload[i]}`
    );

    if (output.stdout) {
      artifactUploadResponses.push({
        filename: filesToUpload[i],
        response: JSON.parse(output.stdout),
      });

      await addPropertiesToArtifact({
        artifactUsername,
        artifactPassword,
        artifactToken,
        artifactHost,
        artifactPath: `${artifactPath}/${revision}`,
        file: filesToUpload[i],
      });
    }
  }

  const artifacts = createBuildInfoModuleArtifacts({
    version: revision,
    artifactUploadResponses,
  });

  await createBuildInfo({
    revision,
    artifacts,
    artifactPath,
    startTime,
  });

  await uploadBuildInfo(
    {
      artifactUsername,
      artifactPassword,
      artifactToken,
    },
    artifactHost
  );
};

/**
 *
 * @param props
 */
const addPropertiesToArtifact = async (props: ArtifactMetadata) => {
  if (artifactProperties) {
    const {
      artifactPassword,
      artifactUsername,
      artifactToken,
      artifactHost,
      artifactPath,
      file,
    } = props;

    const credentialStr = generateCurlCredential({
      artifactPassword,
      artifactUsername,
      artifactToken,
    });

    const artifactPropertiesArr = artifactProperties.split(",");

    const properties: Record<string, string> = {};

    artifactPropertiesArr.forEach((propStr) => {
      const propArr = propStr.split("=");

      if (Array.isArray(propArr) && propArr.length > 1) {
        properties[propArr[0]] = propArr[1];
      }
    });

    const artifactUrl = `${artifactHost}/api/metadata/${artifactPath}/${file}`;

    const output = await getExecOutput(
      `curl -X PATCH -H "content-type: application/json" ${credentialStr} ${artifactUrl} -d ${JSON.stringify(
        properties
      )}`
    );

    if (output.stdout) {
      console.log(
        `[addPropertiesToArtifact] successfully added properties to artifact.`
      );
      console.debug(`[addPropertiesToArtifact] ${JSON.stringify(properties)}`);
    }
  }
};

/**
 *
 * @param props
 * @returns ArtifactoryBuildInfoArtifact[]
 */
const createBuildInfoModuleArtifacts = (
  props: ArtifactoryCreateBuildInfoModuleArtifactsProps
) => {
  const { artifactUploadResponses } = props;

  const moduleArtifacts: ArtifactoryBuildInfoArtifact[] = [];

  for (const i in artifactUploadResponses) {
    const { response, filename } = artifactUploadResponses[i];
    const { checksums, path, mimeType } = response;
    const { sha1, md5, sha256 } = checksums;

    moduleArtifacts.push({
      name: filename,
      sha1,
      md5,
      sha256,
      type: mimeType,
      path: path,
    });
  }

  return moduleArtifacts;
};

/**
 *
 * @param props
 * @returns id
 */
const createBuildInfo = async (props: ArtifactoryCreateBuildInfoProps) => {
  const buildNumber = context.runNumber;
  const gitRef = context.ref;
  const gitRefParts = gitRef.split("/");
  const branch = gitRefParts[gitRefParts.length - 1];

  const { revision, artifacts, artifactPath, startTime } = props;

  const id = generateBuildInfoModuleId(artifactPath, branch);

  const durationMillis = new Date().getTime() - startTime.getTime();

  const buildInfo: ArtifactoryBuildInfo = {
    version: revision,
    name: id,
    number: buildNumber,
    started: startTime.toISOString(),
    durationMillis,
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
        artifacts,
      },
    ],
  };

  writeFileSync(join("build-info.json"), JSON.stringify(buildInfo), {
    encoding: "utf8",
  });

  return id;
};

/**
 *
 * @param artifactToken
 * @param artifactHost
 */
const uploadBuildInfo = async (
  credentials: CredentialProps,
  artifactHost: string
) => {
  const credentialStr = generateCurlCredential({
    ...credentials,
  });

  await exec(
    `curl -X PUT ${credentialStr} ${artifactHost}/artifactory-build-info -T build-info.json`
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

export type ArtifactUploadResponseInfo = {
  response: ArtifactUploadResponse;
  filename: string;
};

export type ArtifactoryBuildInfo = {
  version: string;
  name: string;
  number: number;
  started: string;
  durationMillis: number;
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

export interface Deploy {
  artifactToken: string;
  artifactHost: string;
  artifactPath: string;
  artifactUsername: string;
  artifactPassword: string;
  revision: string;
  filesToUpload: string[];
}

export interface ArtifactoryCreateBuildInfoModuleArtifactsProps {
  artifactUploadResponses: ArtifactUploadResponseInfo[];
  version: string;
}

export interface ArtifactoryCreateBuildInfoProps {
  revision: string;
  artifactPath: string;
  artifacts: ArtifactoryBuildInfoArtifact[];
  startTime: Date;
}

export interface ArtifactMetadata {
  artifactHost: string;
  artifactPath: string;
  file: string;
  artifactToken?: string;
  artifactUsername?: string;
  artifactPassword?: string;
}

export interface CredentialProps {
  artifactToken?: string;
  artifactUsername?: string;
  artifactPassword?: string;
}
