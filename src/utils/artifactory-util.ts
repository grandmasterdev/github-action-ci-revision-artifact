/**
 *
 * @param repoPath path of the artifactory repo with the artifact
 * @param branch git branch where the artifact originate from
 * @returns
 */
export const generateBuildInfoModuleId = (repoPath: string, branch: string) => {
  if (!repoPath) {
    throw new Error(`[generateBuildInfoModuleId] Missing repo path`);
  }

  const paths = repoPath.split("/");

  const cleanPaths = paths.filter((el) => {
    return el !== "" && el !== undefined && el !== null && el !== branch;
  });

  return `${cleanPaths.join(":")}:${branch}`;
};

/**
 *
 * @param props
 * @returns curl credential string
 */
export const generateCurlCredential = (props: CurlCredentialProps) => {
  const { artifactToken, artifactUsername, artifactPassword } = props;

  if (artifactToken) {
    return `-H "Authorization: Bearer ${artifactToken}"`;
  }

  if (artifactUsername && artifactPassword) {
    return `-u ${artifactUsername}:${artifactPassword}`;
  }

  throw new Error(
    `[generateCurlCredential] no required props is/are available!`
  );
};

export interface CurlCredentialProps {
  artifactToken?: string;
  artifactUsername?: string;
  artifactPassword?: string;
}
