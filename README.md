# Solana Mint Tracker

Detects and enriches Solana token mints in real-time from specified launchpads.

## How It Works

1. **Detection**: Listens to blockchain logs via WebSocket and identifies mint creation events from PumpFun and Raydium LaunchLab.

2. **Buffering**: Detected mints are queued to prevent loss during slow operations. Queue can be configured to run several concurrent workers.

3. **Enrichment**: Fetches token metadata (mint address, name, symbol) from Helius API and emits enriched events.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create `.env` file:
   ```
   HELIUS_API_KEY=your_api_key
   ```

3. Start the app:
   ```
   npm start
   ```

## Notes

- Work in progress
