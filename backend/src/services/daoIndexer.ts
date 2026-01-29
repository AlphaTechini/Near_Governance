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

// Helper for delays between RPC calls
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialize and refresh DAO data from chain
 * First indexes TRACKED_DAOS (curated list), then discovers more from factory
 */
export async function refreshDAOData(): Promise<void> {
    console.log(`Refreshing DAO data for ${TRACKED_DAOS.length} tracked DAOs...`);

    for (const daoId of TRACKED_DAOS) {
        try {
            await indexDAO(daoId);
            // Small delay between DAOs to reduce RPC pressure
            await delay(200);
        } catch (error) {
            console.error(`Failed to index DAO ${daoId}:`, error);
        }
    }

    console.log('Tracked DAOs refresh complete.');

    // Background discovery disabled - using only curated TRACKED_DAOS list
    // The factory discovery was causing duplicate suffix issues and indexing many dead DAOs
    // To re-enable, uncomment the following:
    // discoverActiveDAOs().catch(err =>
    //     console.error('Background DAO discovery failed:', err)
    // );
}

/**
 * Discover and index active DAOs from the factory
 * Only indexes DAOs with 50+ proposals to filter spam
 */
const MIN_PROPOSALS_FOR_DISCOVERY = 50;
const DISCOVERY_BATCH_SIZE = 100;
const MAX_DAOS_TO_DISCOVER = 500; // Limit discovery to top 500 to avoid overload

async function discoverActiveDAOs(): Promise<void> {
    console.log('Discovering active DAOs from factory...');

    let offset = 0;
    let discovered = 0;
    let indexed = 0;

    while (discovered < MAX_DAOS_TO_DISCOVER) {
        try {
            const factoryDaos = await getDAOListFromFactory('sputnik-dao.near', offset, DISCOVERY_BATCH_SIZE);

            if (factoryDaos.length === 0) {
                console.log('No more DAOs in factory.');
                break;
            }

            for (const daoName of factoryDaos) {
                const daoId = `${daoName}.sputnik-dao.near`;

                // Skip if already tracked
                if (TRACKED_DAOS.includes(daoId)) continue;

                // Check if already in database
                const existing = await prisma.dAO.findUnique({ where: { id: daoId } });
                if (existing) {
                    discovered++;
                    continue;
                }

                // Get proposal count first (lightweight check)
                try {
                    const count = await getProposalCount(daoId);

                    if (count >= MIN_PROPOSALS_FOR_DISCOVERY) {
                        console.log(`Discovered active DAO: ${daoId} (${count} proposals)`);
                        await indexDAO(daoId);
                        indexed++;
                    }

                    discovered++;
                    await delay(100); // Rate limit
                } catch (err) {
                    // Skip DAOs that fail (might be deleted or invalid)
                    continue;
                }
            }

            offset += factoryDaos.length;
            console.log(`Discovery progress: checked ${offset} DAOs, indexed ${indexed} new active DAOs`);

            await delay(500); // Longer delay between batches

        } catch (error) {
            console.error('Error during DAO discovery:', error);
            break;
        }
    }

    console.log(`DAO discovery complete. Indexed ${indexed} new active DAOs.`);
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

    // Only fetch the most recent N proposals (defined in config)
    const MAX_PROPOSALS = POLLING_CONFIG.maxProposalsPerDAO; // 100
    const effectiveStartId = Math.max(startId, totalOnChain - MAX_PROPOSALS);

    if (effectiveStartId >= totalOnChain) {
        console.log(`${daoId}: Up to date (Local: ${lastIndexedId}, Chain: ${totalOnChain})`);
        return;
    }

    const proposalsToFetch = totalOnChain - effectiveStartId;
    console.log(`${daoId}: Fetching ${proposalsToFetch} proposals (ID ${effectiveStartId} to ${totalOnChain})...`);

    // 3. Fetch in batches
    const BATCH_SIZE = 50; // Smaller batches for more reliable fetching
    for (let i = effectiveStartId; i < totalOnChain; i += BATCH_SIZE) {
        const rawProposals = await getProposals(daoId, i, Math.min(BATCH_SIZE, totalOnChain - i));

        // Small delay between batches to avoid rate limits
        await delay(100);

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
