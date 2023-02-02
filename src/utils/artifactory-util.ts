export const generateBuildInfoModuleId = (repoPath: string) => {
  if (!repoPath) {
    throw new Error(`[generateBuildInfoModuleId] Missing repo path`);
  }

  const paths = repoPath.split("/");

  const cleanPaths = paths.filter((el) => {
    return el !== "" && el !== undefined && el !== null;
  });

  return `${cleanPaths.join("::")}`;
};
