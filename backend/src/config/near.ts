// ===========================================
// NEAR RPC Configuration
// ===========================================

export const NEAR_CONFIG = {
    networkId: 'mainnet',
    nodeUrl: 'https://free.rpc.fastnear.com',
    archivalNodeUrl: 'https://archival-rpc.mainnet.near.org',
    explorerUrl: 'https://nearblocks.io',
} as const;

export const SERVER_CONFIG = {
    port: Number(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'https://near-governance.vercel.app', 'https://neardao.cyberpunkinc.xyz'],
} as const;

// Polling configuration for MVP
export const POLLING_CONFIG = {
    intervalMs: 30 * 60 * 1000, // 30 minutes
    maxProposalsPerDAO: 100,
    cacheExpiryMs: 15 * 60 * 1000, // 15 minutes
} as const;
