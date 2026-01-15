export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  supply?: string;
}

export interface ProgramDefinition {
  readonly label: string;
  readonly address: string;

  isNewMint(log: any): boolean;
}
