// ===========================================
// Network Health Routes
// ===========================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    getAllDAOs,
    getDAOProposals,
    getCacheStatus,
} from '../services/daoIndexer.js';
import { getPolicy } from '../services/nearClient.js';
import { calculateGRI, calculateMedianGRI } from '../services/griEngine.js';
import type { NetworkHealthResponse, TrendPoint } from '../types/index.js';

export async function networkRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /network/health - Network-wide governance health
     */
    fastify.get('/network/health', async (request: FastifyRequest, reply: FastifyReply) => {
        const daos = await getAllDAOs();

        // Calculate GRI for all DAOs
        const griScores: number[] = [];
        let totalProposals = 0;
        let totalVotes = 0;
        let activeDAOs = 0;
        let inactiveDAOs = 0;

        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        for (const dao of daos) {
            const proposals = await getDAOProposals(dao.id);
            const policy = await getPolicy(dao.id);
            const gri = calculateGRI(proposals, policy, dao.memberCount);
            griScores.push(gri.overall);

            totalProposals += proposals.length;

            // Count votes
            for (const proposal of proposals) {
                totalVotes += Object.keys(proposal.votes).length;
            }

            // Check if DAO is active (has proposals in last 30 days)
            const hasRecentActivity = proposals.some((p) => {
                const submissionTime = Number(p.submissionTime) / 1_000_000;
                return submissionTime > thirtyDaysAgo;
            });

            if (hasRecentActivity) {
                activeDAOs++;
            } else {
                inactiveDAOs++;
            }
        }

        // Generate participation trend (mock data for MVP - would be historical in production)
        const participationTrend: TrendPoint[] = generateMockTrend(7);

        const response: NetworkHealthResponse = {
            medianGRI: calculateMedianGRI(griScores),
            activeDAOs,
            inactiveDAOs,
            totalProposals,
            totalVotes,
            participationTrend,
        };

        return response;
    });

    /**
     * GET /network/status - API status and cache info
     */
    fastify.get('/network/status', async (request: FastifyRequest, reply: FastifyReply) => {
        const status = await getCacheStatus();
        const daos = await getAllDAOs();

        return {
            status: 'healthy',
            daoCount: daos.length,
            cache: {
                lastUpdated: status.lastUpdated?.toISOString() ?? null,
                daosCached: status.daoCount,
            },
            version: '1.0.0-mvp',
        };
    });
}

/**
 * Generate mock participation trend data for MVP
 * In production, this would query historical data
 */
function generateMockTrend(days: number): TrendPoint[] {
    const trend: TrendPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Generate somewhat realistic looking values
        const baseValue = 45;
        const variance = Math.random() * 20 - 10;

        trend.push({
            date: date.toISOString().split('T')[0],
            value: Math.round((baseValue + variance) * 10) / 10,
        });
    }

    return trend;
}
