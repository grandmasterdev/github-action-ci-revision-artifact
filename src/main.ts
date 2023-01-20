import { createGitRevision } from "./revision";
import { uploadArtifact } from "./artifact";

export const run = async () => {
  const output = await createGitRevision();

  await uploadArtifact(output.repo, output.revision);
};
