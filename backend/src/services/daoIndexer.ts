// ===========================================
// DAO Indexer Service (Prisma + Backfilling)
// ===========================================

import {
    getProposals,
    getProposalCount,
    getPolicy,
    normalizeProposal,
    getDAOListFromFactory,
} from './nearClient.js';
import { prisma } from './db.js';
import type { DAOPolicy, Actor, Proposal, VoteAction, ProposalKind, ProposalStatus, VoteCounts } from '../types/index.js';
import { TRACKED_DAOS } from '../types/index.js';
import { POLLING_CONFIG } from '../config/near.js';

/**
 * Initialize and refresh DAO data from chain
 */
export async function refreshDAOData(): Promise<void> {
    console.log('Refreshing DAO data from chain...');

    // 1. Get list of DAOs from Factory
    // TODO: Pagination for full list (currently getting top 50 for MVP speed)
    const factoryDaos = await getDAOListFromFactory('sputnik-dao.near', 0, 50);
    console.log(`Found ${factoryDaos.length} DAOs from factory.`);

    // 2. Merge with tracked list (priority to tracked if not in factory)
    const allDaos = Array.from(new Set([...TRACKED_DAOS, ...factoryDaos]));

    for (const daoId of allDaos) {
        try {
            await indexDAO(daoId);
        } catch (error) {
            console.error(`Failed to index DAO ${daoId}:`, error);
        }
    }

    console.log('DAO data refresh complete.');
}

/**
 * Index a single DAO (Backfill + Update)
 */
async function indexDAO(daoId: string): Promise<void> {
    console.log(`Indexing ${daoId}...`);

    // 1. Upsert DAO record
    const policy = await getPolicy(daoId);
    const memberCount = calculateMemberCount(policy);

    await prisma.dAO.upsert({
        where: { contractId: daoId },
        create: {
            id: daoId,
            name: extractDAOName(daoId),
            contractId: daoId,
            memberCount,
        },
        update: {
            memberCount,
            lastIndexedAt: new Date(),
        },
    });

    // 2. Determine fetch range
    const totalOnChain = await getProposalCount(daoId);
    const lastLocal = await prisma.proposal.findFirst({
        where: { daoId },
        orderBy: { id: 'desc' },
    });

    const lastIndexedId = lastLocal?.id ?? -1;
    const startId = lastIndexedId + 1;

    if (startId >= totalOnChain) {
        console.log(`${daoId}: Up to date (Local: ${lastIndexedId}, Chain: ${totalOnChain})`);
        return;
    }

    console.log(`${daoId}: Backfilling from ID ${startId} to ${totalOnChain}...`);

    // 3. Fetch in batches
    const BATCH_SIZE = 100;
    for (let i = startId; i < totalOnChain; i += BATCH_SIZE) {
        // Explicitly pass batch size, limited by config max or batch size
        const rawProposals = await getProposals(daoId, i, BATCH_SIZE);

        for (const raw of rawProposals) {
            const p = normalizeProposal(raw, daoId);

            // Store Proposal
            await prisma.proposal.upsert({
                where: {
                    daoId_id: { daoId, id: p.id },
                },
                create: {
                    id: p.id,
                    daoId,
                    proposer: p.proposer,
                    description: p.description,
                    status: p.status,
                    kind: p.kind as any,
                    voteCounts: p.voteCount as any,
                    submissionTime: BigInt(p.submissionTime),
                },
                update: {
                    status: p.status,
                    voteCounts: p.voteCount as any,
                },
            });

            // Store Votes
            for (const [voter, vote] of Object.entries(p.votes)) {
                await prisma.vote.upsert({
                    where: {
                        daoId_proposalId_voter: {
                            daoId,
                            proposalId: p.id,
                            voter,
                        },
                    },
                    create: {
                        daoId,
                        proposalId: p.id,
                        voter,
                        vote,
                    },
                    update: {
                        vote,
                    },
                });
            }
        }
    }
}

function calculateMemberCount(policy: DAOPolicy | null): number {
    if (!policy) return 0;
    let count = 0;
    for (const role of policy.roles) {
        if (typeof role.kind === 'object' && 'Group' in role.kind) {
            count += role.kind.Group.length;
        }
    }
    return count;
}

/**
 * Extract human-readable name from DAO contract ID
 */
function extractDAOName(daoId: string): string {
    const parts = daoId.split('.');
    if (parts.length > 0) {
        const name = parts[0];
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
    }
    return daoId;
}

// ===========================================
// DB Access Methods (Replaces Cache)
// ===========================================

export async function getAllDAOs() {
    return prisma.dAO.findMany();
}

export async function getDAO(id: string) {
    return prisma.dAO.findUnique({ where: { id } });
}

export async function getDAOProposals(daoId: string): Promise<Proposal[]> {
    const proposals = await prisma.proposal.findMany({
        where: { daoId },
        include: { votes: true },
        orderBy: { id: 'desc' },
    });

    // Map DB model back to app type
    return proposals.map(mapDBProposalToType);
}

export async function needsRefresh(): Promise<boolean> {
    // Simpler check for now - could query lastIndexedAt
    return true;
}

// Helper: Map Prisma Proposal -> App Type
function mapDBProposalToType(p: any): Proposal {
    const votes: Record<string, VoteAction> = {};
    if (p.votes) {
        for (const v of p.votes) {
            votes[v.voter] = v.vote as VoteAction;
        }
    }

    return {
        id: p.id,
        daoId: p.daoId,
        proposer: p.proposer,
        description: p.description,
        kind: p.kind as ProposalKind,
        status: p.status as ProposalStatus,
        voteCount: p.voteCounts as VoteCounts,
        submissionTime: p.submissionTime.toString(),
        votes,
    };
}

export async function getCacheStatus() {
    const daoCount = await prisma.dAO.count();
    return {
        lastUpdated: new Date(),
        daoCount
    }
}
