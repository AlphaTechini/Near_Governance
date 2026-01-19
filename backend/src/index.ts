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

// Register CORS
await fastify.register(cors, {
    origin: SERVER_CONFIG.corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
});

// Register routes
fastify.register(daoRoutes);
fastify.register(networkRoutes);

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
        // Initial data load
        console.log('Loading initial DAO data...');
        await refreshDAOData();

        // Start periodic refresh
        setInterval(async () => {
            if (needsRefresh()) {
                await refreshDAOData();
            }
        }, 60 * 1000); // Check every minute

        // Start listening
        await fastify.listen({
            port: SERVER_CONFIG.port,
            host: SERVER_CONFIG.host,
        });

        console.log(`
╔═══════════════════════════════════════════════╗
║  Governance Reality Index (GRI) API Server    ║
║  Running on http://localhost:${SERVER_CONFIG.port}            ║
╚═══════════════════════════════════════════════╝
    `);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
