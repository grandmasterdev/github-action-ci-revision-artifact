export const generateBuildInfoModuleId = (
  repoPath: string,
  revision: string
) => {
  if (!repoPath) {
    throw new Error(`[generateBuildInfoModuleId] Missing repo path`);
  }

  const paths = repoPath.split("/");

  const cleanPaths = paths.filter((el) => {
    return el !== "" && el !== undefined && el !== null && el !== revision;
  });

  return `${cleanPaths.join(":")}:${revision}`;
};
