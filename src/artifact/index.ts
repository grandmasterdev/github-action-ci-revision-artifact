import { getInput, setOutput } from "@actions/core";
import { exec } from "@actions/exec";
import { context } from "@actions/github";
import { generateArtifactUrl } from "../utils/artifactory-util";
import { ArtifactRepo, deploy } from "./artifactory";
import { writeFileSync } from "fs";
import { getExecOutput } from "@actions/exec";

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
const pushSource = getInput("push-source", {
  required: false,
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

/**
 *
 * @param repoName
 * @param revision
 */
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
    console.log("NOT MAIN BRANCH");
    revision = artifactPostfix
      ? `${revision}-${artifactPostfix}`
      : `${revision}`;

    buildArtifactName = `${repoName}-${revision}`;
  }

  const buildArtifactFilename = `${buildArtifactName}.${packageExtension}`;

  const pwdOut = await getExecOutput("pwd");
  const workingDir = pwdOut.stdout.replace(/\n/g, "");

  writeFileSync(workingDir + "/version.conf", `VERSION=${revision}`, {
    encoding: "utf-8",
  });

  let filesToUpload = [`${buildArtifactFilename}`];

  if (packageExtension && packageExtension === "zip") {
    filesToUpload = await pushSourceToRepo(pushSource, {
      buildArtifactName,
      packageExtension,
      filesToUpload,
    });

    await exec(`zip ./${buildArtifactFilename} ./build.${packageExtension}`);
    await exec(`zip -ur ./${buildArtifactFilename} version.conf`);
  }

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

    const artifactUrl = generateArtifactUrl({
      artifactHost,
      artifactPath,
      revision,
      buildArtifactFilename,
    });

    setOutput("artifact-url", artifactUrl);
    setOutput("revision", revision);
  }
};

/**
 *
 * @param isPushSource
 * @param props
 * @returns
 */
const pushSourceToRepo = async (
  isPushSource: string,
  props: PushSourceToRepoProps
) => {
  const { buildArtifactName, packageExtension } = props;

  let { filesToUpload } = props;

  if (isPushSource && isPushSource === "true") {
    const buildSource = `./${buildArtifactName}-src`;

    await exec(
      `zip -r ${buildSource} ./ -x ./node_modules/**/* -x ./.git/**/*`
    );

    filesToUpload = filesToUpload.concat(`${buildSource}.${packageExtension}`);
  }

  return filesToUpload;
};

export interface PushSourceToRepoProps {
  buildArtifactName: string;
  packageExtension: string;
  filesToUpload: string[];
}
