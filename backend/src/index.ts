// ===========================================
// GRI Backend - Main Entry Point
// ===========================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { SERVER_CONFIG } from './config/near.js';
import { daoRoutes } from './routes/daos.js';
import { networkRoutes } from './routes/network.js';
import { refreshDAOData, needsRefresh } from './services/daoIndexer.js';

const fastify = Fastify({
    logger: true,
});

console.log('[STARTUP] Fastify instance created');

// Register CORS
await fastify.register(cors, {
    origin: SERVER_CONFIG.corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
});

console.log('[STARTUP] CORS registered');

// Register routes
fastify.register(daoRoutes);
fastify.register(networkRoutes);

console.log('[STARTUP] Routes registered, calling start()...');

// Root endpoint
fastify.get('/', async (request, reply) => {
    return {
        name: 'Governance Reality Index (GRI) API',
        version: '1.0.0-mvp',
        description: 'NEAR Protocol governance observability and telemetry',
        endpoints: [
            'GET /daos',
            'GET /dao/:id/overview',
            'GET /dao/:id/proposals',
            'GET /dao/:id/gri',
            'GET /dao/:id/proposal/:proposalId',
            'GET /network/health',
            'GET /network/status',
        ],
    };
});

// Start server
async function start() {
    try {
        console.log('[STARTUP] start() called, binding to port...');
        // START SERVER FIRST - Bind to port immediately for Render health checks
        await fastify.listen({
            port: SERVER_CONFIG.port,
            host: SERVER_CONFIG.host,
        });

        console.log(`[STARTUP] Server is listening on ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
        console.log(`
╔═══════════════════════════════════════════════╗
║  Governance Reality Index (GRI) API Server    ║
║  Running on http://localhost:${SERVER_CONFIG.port}            ║
╚═══════════════════════════════════════════════╝
        `);

        // THEN start data refresh in background (non-blocking)
        console.log('Starting initial DAO data refresh in background...');
        refreshDAOData()
            .then(() => console.log('Initial DAO data refresh complete.'))
            .catch(err => console.error('Background refresh failed:', err));

        // Periodic refresh (every 5 minutes)
        setInterval(async () => {
            if (await needsRefresh()) {
                console.log('Starting periodic DAO data refresh...');
                refreshDAOData()
                    .then(() => console.log('Periodic DAO data refresh complete.'))
                    .catch(err => console.error('Periodic refresh failed:', err));
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
