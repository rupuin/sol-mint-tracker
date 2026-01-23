import type { LogSource } from "../types.ts";

/**
 * Launchpad configuration with mint detection pattern
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

	add(launchpad: Launchpad): this {
		this.launchpads.set(launchpad.name, launchpad);
		return this;
	}

	remove(name: string): boolean {
		return this.launchpads.delete(name);
	}

	getByName(name: string): Launchpad | null {
		return this.launchpads.get(name) ?? null;
	}

	all(): Launchpad[] {
		return Array.from(this.launchpads.values());
	}
}
