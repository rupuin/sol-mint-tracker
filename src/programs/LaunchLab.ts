import type { ProgramDefinition } from "../interfaces.ts";

export class LaunchLab implements ProgramDefinition {
  public readonly label = "Raydium LaunchLab (Bonk)";
  public readonly address = "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj";

  public isNewMint(log: any): boolean {
    const logs = log.logs as string[];
    return logs.some((line) => line.includes("Instruction: InitializeMint"));
  }
}
