import { describe, it, expect } from "vitest";
import { LaunchLab } from "../../src/programs/LaunchLab.ts";

describe("LaunchLab Program Definition", () => {
  const program = new LaunchLab();

  it("should return TRUE when new mint log is found", () => {
    const mockLog = {
      logs: [
        "Program token success",
        "Program Log: Instruction: InitializeMint",
      ],
    };
    expect(program.isNewMint(mockLog)).toBe(true);
  });

  it("should return FALSE when the log is not a new mint", () => {
    const mockLog = {
      logs: ["Program Log: Transfer"],
    };
    expect(program.isNewMint(mockLog)).toBe(false);
  });

  it("should throw a TypeError error when log is undefined", () => {
    const mockLog = ["Program Log: InitializeMint"];
    expect(() => program.isNewMint(mockLog)).toThrowError(TypeError);
  });
});
