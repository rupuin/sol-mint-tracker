import type { LogSource } from "./providers/index.ts";

/**
 * Program configuration with mint detection pattern
 */
export class Launchpad implements LogSource {
  constructor(
    readonly name: string,
    readonly address: string,
    readonly mintInstruction: string,
  ) {}
}

export class LaunchpadRegistry {
  private launchpads = new Map<string, Launchpad>();

  public add(launchpad: Launchpad): this {
    this.launchpads.set(launchpad.name, launchpad);
    return this;
  }

  public remove(name: string): boolean {
    return this.launchpads.delete(name);
  }

  public all(): Launchpad[] {
    return Array.from(this.launchpads.values());
  }
}
