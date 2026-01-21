// ===========================================
// DAO API Routes
// ===========================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    getAllDAOs,
    getDAO,
    getDAOProposals,
} from '../services/daoIndexer.js';
import { getPolicy } from '../services/nearClient.js'; // Fetch policy live or cache in DB later
import { calculateGRI, getGRIGrade } from '../services/griEngine.js';
import type { DAOListResponse, DAOOverviewResponse, Proposal } from '../types/index.js';

export async function daoRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /daos - List all tracked DAOs
     */
    fastify.get('/daos', async (request: FastifyRequest, reply: FastifyReply) => {
        const daos = await getAllDAOs();

        // Calculate GRI for each DAO
        const daosWithGRI = await Promise.all(daos.map(async (dao: any) => {
            const proposals = await getDAOProposals(dao.id);
            const policy = await getPolicy(dao.id);
            const gri = calculateGRI(proposals, policy ?? undefined, dao.memberCount);
            return {
                ...dao,
                griScore: gri.overall,
            };
        }));

        // Calculate network median GRI
        const griScores = daosWithGRI.map((d: any) => d.griScore ?? 0);
        const networkGRI = griScores.length > 0
            ? griScores.reduce((a: number, b: number) => a + b, 0) / griScores.length
            : 0;

        const response: DAOListResponse = {
            daos: daosWithGRI as any, // Cast for minor type mismatch in Prisma vs App type
            totalCount: daos.length,
            networkGRI: Math.round(networkGRI * 10) / 10,
        };

        return response;
    });

    /**
     * GET /dao/:id/overview - DAO summary with GRI
     */
    fastify.get(
        '/dao/:id/overview',
        async (
            request: FastifyRequest<{ Params: { id: string } }>,
            reply: FastifyReply
        ) => {
            const { id } = request.params;
            const dao = await getDAO(id);

            if (!dao) {
                return reply.status(404).send({ error: 'DAO not found' });
            }

            const proposals = await getDAOProposals(id);
            const policy = await getPolicy(id);
            const gri = calculateGRI(proposals, policy ?? undefined, dao.memberCount);

            // Get recent proposals (last 10)
            const recentProposals = [...proposals]
                .sort((a: Proposal, b: Proposal) => Number(b.submissionTime) - Number(a.submissionTime))
                .slice(0, 10);

            // Calculate active members (those who voted in last 30 days)
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            const activeVoters = new Set<string>();
            for (const proposal of proposals) {
                const submissionTime = Number(proposal.submissionTime) / 1_000_000; // Convert nanoseconds
                if (submissionTime > thirtyDaysAgo) {
                    for (const voter of Object.keys(proposal.votes)) {
                        activeVoters.add(voter);
                    }
                }
            }

            const response: DAOOverviewResponse = {
                dao: { ...dao, griScore: gri.overall } as any,
                gri,
                recentProposals: recentProposals as any,
                memberCount: dao.memberCount,
                activeMembers: activeVoters.size,
            };

            return response;
        }
    );

    /**
     * GET /dao/:id/proposals - All proposals for a DAO
     */
    fastify.get(
        '/dao/:id/proposals',
        async (
            request: FastifyRequest<{ Params: { id: string }; Querystring: { status?: string } }>,
            reply: FastifyReply
        ) => {
            const { id } = request.params;
            const { status } = request.query;

            const dao = await getDAO(id);
            if (!dao) {
                return reply.status(404).send({ error: 'DAO not found' });
            }

            let proposals = await getDAOProposals(id);

            // Filter by status if provided
            if (status) {
                proposals = proposals.filter((p) => p.status === status);
            }

            // Sort by submission time, newest first
            proposals = [...proposals].sort(
                (a: Proposal, b: Proposal) => Number(b.submissionTime) - Number(a.submissionTime)
            );

            return {
                daoId: id,
                proposals,
                totalCount: proposals.length,
            };
        }
    );

    /**
     * GET /dao/:id/gri - Detailed GRI breakdown
     */
    fastify.get(
        '/dao/:id/gri',
        async (
            request: FastifyRequest<{ Params: { id: string } }>,
            reply: FastifyReply
        ) => {
            const { id } = request.params;
            const dao = await getDAO(id);

            if (!dao) {
                return reply.status(404).send({ error: 'DAO not found' });
            }

            const proposals = await getDAOProposals(id);
            const policy = await getPolicy(id);
            const gri = calculateGRI(proposals, policy ?? undefined, dao.memberCount);

            return {
                daoId: id,
                daoName: dao.name,
                gri,
                grade: getGRIGrade(gri.overall),
                proposalCount: proposals.length,
                memberCount: dao.memberCount,
            };
        }
    );

    /**
     * GET /dao/:id/proposal/:proposalId - Single proposal detail
     */
    fastify.get(
        '/dao/:id/proposal/:proposalId',
        async (
            request: FastifyRequest<{ Params: { id: string; proposalId: string } }>,
            reply: FastifyReply
        ) => {
            const { id, proposalId } = request.params;
            const dao = await getDAO(id);

            if (!dao) {
                return reply.status(404).send({ error: 'DAO not found' });
            }

            const proposals = await getDAOProposals(id);
            const proposal = proposals.find((p) => p.id === Number(proposalId));

            if (!proposal) {
                return reply.status(404).send({ error: 'Proposal not found' });
            }

            // Calculate voting metrics
            const voterCount = Object.keys(proposal.votes).length;
            const participationRate = dao.memberCount > 0
                ? (voterCount / dao.memberCount) * 100
                : 0;

            return {
                proposal,
                voterCount,
                participationRate: Math.round(participationRate * 10) / 10,
                memberCount: dao.memberCount,
            };
        }
    );
}
