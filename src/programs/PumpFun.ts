import type { ProgramDefinition } from "../interfaces.ts";

export class PumpFun implements ProgramDefinition {
  public readonly label = "PumpFun";
  public readonly address = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

  public isNewMint(log: any): boolean {
    const logs = log.logs as string[];
    return logs.some((line) => line.includes("Instruction: Create"));
  }
}
