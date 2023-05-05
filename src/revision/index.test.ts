jest.mock("@actions/github", () => {
  return {
    getOctokit: (token: string) => {
      if (!token) {
        throw new Error("[jest] no github token!");
      }

      return {
        rest: {
          repos: {
            createRelease: jest.fn(),
          },
        },
      };
    },
    context: {
      repo: {
        owner: "jest",
        repo: "jest-repo",
      },
      sha: "9eabf5b536662000f79978c4d1b6e4eff5c8d785",
    },
  };
});

describe("createGitRevision tests", () => {
  const processEnvOri = process.env;

  const dateNow = new Date("2023-05-05T00:00:00.999Z");

  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("should return datehash revision value without milliseconds", async () => {
    const cut = await import("./index");

    process.env = {
      ...processEnvOri,
      GITHUB_TOKEN: "GITHUB_TOKEN",
    };

    jest.mock("@actions/core", () => {
      return {
        getInput: jest.fn().mockImplementation((name) => {
          if (name === "version-type") {
            return "datehash";
          }

          if (name === "revision-datehash-with-milliseconds") {
            return "false";
          }

          if (name === "create-revision") {
            return "true";
          }
        }),
      };
    });

    jest.spyOn(global, "Date").mockReturnValue(dateNow);

    const result = await cut.createGitRevision();

    expect(result).toEqual({
      repo: "jest-repo",
      revision: "20230505T000000H5c8d785",
    });
  });

  it("should return datehash revision value with milliseconds", async () => {
    const cut = await import("./index");

    process.env = {
      ...processEnvOri,
      GITHUB_TOKEN: "GITHUB_TOKEN",
    };

    jest.mock("@actions/core", () => {
      return {
        getInput: jest.fn().mockImplementation((name) => {
          if (name === "version-type") {
            return "datehash";
          }

          if (name === "revision-datehash-with-milliseconds") {
            return "true";
          }

          if (name === "create-revision") {
            return "true";
          }
        }),
      };
    });

    jest.spyOn(global, "Date").mockReturnValue(dateNow);

    const result = await cut.createGitRevision();

    expect(result).toEqual({
      repo: "jest-repo",
      revision: "20230505T000000999H5c8d785",
    });
  });
});
