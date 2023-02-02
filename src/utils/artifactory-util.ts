export const generateBuildInfoModuleId = (repo: string, repoPath: string) => {
  if (!repo) {
    throw new Error(`[generateBuildInfoModuleId] Missing repo!`);
  }

  if (!repoPath) {
    throw new Error(`[generateBuildInfoModuleId] Missing repo path`);
  }

  const paths = repoPath.split("/");

  const cleanPaths = paths.filter((el) => {
    return el !== "" && el !== undefined && el !== null;
  });

  return `${repo}:${cleanPaths.join(":")}`;
};
