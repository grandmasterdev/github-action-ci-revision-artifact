import { exec, getExecOutput } from "@actions/exec";
import { context } from "@actions/github";
import {
  generateBuildInfoModuleId,
  generateCurlCredential,
} from "../utils/artifactory-util";
import { writeFileSync } from "fs";
import { join } from "path";

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

  for (const i in filesToUpload) {
    const output = await getExecOutput(
      `curl -X PUT -H "Authorization: Bearer ${artifactToken}" ${artifactHost}/${artifactPath}/${revision}/${filesToUpload[i]} -T ${filesToUpload[i]}`
    );

    if (output.stdout) {
      artifactUploadResponses.push({
        filename: filesToUpload[i],
        response: JSON.parse(output.stdout),
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

export interface CredentialProps {
  artifactToken?: string;
  artifactUsername?: string;
  artifactPassword?: string;
}
