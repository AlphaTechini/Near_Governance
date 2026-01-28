// ===========================================
// NEAR RPC Client Service
// ===========================================

import { connect, keyStores, Contract, Near } from 'near-api-js';
import { NEAR_CONFIG, POLLING_CONFIG } from '../config/near.js';
import type { Proposal, DAOPolicy, VoteAction } from '../types/index.js';

let nearConnection: Near | null = null;

/**
 * Initialize NEAR connection (read-only, no signing required)
 */
export async function initNearConnection(): Promise<Near> {
    if (nearConnection) return nearConnection;

    nearConnection = await connect({
        networkId: NEAR_CONFIG.networkId,
        nodeUrl: NEAR_CONFIG.nodeUrl,
        keyStore: new keyStores.InMemoryKeyStore(),
    });

    return nearConnection;
}

/**
 * Get proposals from a Sputnik DAO contract
 */
export async function getProposals(
    daoId: string,
    fromIndex = 0,
    limit: number = POLLING_CONFIG.maxProposalsPerDAO
): Promise<RawProposal[]> {
    try {
        const near = await initNearConnection();
        const account = await near.account('dontcare');

        const result = await account.viewFunction({
            contractId: daoId,
            methodName: 'get_proposals',
            args: { from_index: fromIndex, limit },
        });

        return result as RawProposal[];
    } catch (error) {
        console.error(`Error fetching proposals from ${daoId}:`, error);
        return [];
    }
}

/**
 * Get the number of proposals in a DAO
 */
export async function getProposalCount(daoId: string): Promise<number> {
    try {
        const near = await initNearConnection();
        const account = await near.account('dontcare');

        const result = await account.viewFunction({
            contractId: daoId,
            methodName: 'get_last_proposal_id',
            args: {},
        });

        return result as number;
    } catch (error) {
        console.error(`Error fetching proposal count from ${daoId}:`, error);
        return 0;
    }
}

/**
 * Get DAO policy (voting rules, roles, thresholds)
 */
export async function getPolicy(daoId: string): Promise<DAOPolicy | null> {
    try {
        const near = await initNearConnection();
        const account = await near.account('dontcare');

        const result = await account.viewFunction({
            contractId: daoId,
            methodName: 'get_policy',
            args: {},
        });

        return result as DAOPolicy;
    } catch (error) {
        console.error(`Error fetching policy from ${daoId}:`, error);
        return null;
    }
}

/**
 * Get a specific proposal by ID
 */
export async function getProposal(
    daoId: string,
    proposalId: number
): Promise<RawProposal | null> {
    try {
        const near = await initNearConnection();
        const account = await near.account('dontcare');

        const result = await account.viewFunction({
            contractId: daoId,
            methodName: 'get_proposal',
            args: { id: proposalId },
        });

        return result as RawProposal;
    } catch (error) {
        console.error(`Error fetching proposal ${proposalId} from ${daoId}:`, error);
        return null;
    }
}

/**
 * Check if a contract is a valid Sputnik DAO
 */
export async function isValidDAO(contractId: string): Promise<boolean> {
    try {
        const policy = await getPolicy(contractId);
        return policy !== null;
    } catch {
        return false;
    }
}

/**
 * Get list of DAOs from factory contract
 */
export async function getDAOListFromFactory(
    factoryId: string = 'sputnik-dao.near',
    fromIndex = 0,
    limit = 100
): Promise<string[]> {
    try {
        const near = await initNearConnection();
        const account = await near.account('dontcare');

        const result = await account.viewFunction({
            contractId: factoryId,
            methodName: 'get_dao_list',
            args: { from_index: fromIndex, limit },
        });

        return result as string[];
    } catch (error) {
        console.error(`Error fetching DAO list from ${factoryId}:`, error);
        return [];
    }
}


// Raw proposal type from Sputnik DAO contract
export interface RawProposal {
    id: number;
    proposer: string;
    description: string;
    kind: unknown;
    status: string;
    vote_counts: Record<string, [number, number, number]>;
    votes: Record<string, string>;
    submission_time: string;
}

/**
 * Normalize raw proposal data from contract to our typed format
 */
export function normalizeProposal(raw: RawProposal, daoId: string): Proposal {
    // Extract vote counts (format varies by version)
    const voteCounts = { approve: 0, reject: 0, remove: 0 };

    if (raw.vote_counts) {
        for (const [role, counts] of Object.entries(raw.vote_counts)) {
            if (Array.isArray(counts) && counts.length >= 3) {
                voteCounts.approve += counts[0];
                voteCounts.reject += counts[1];
                voteCounts.remove += counts[2];
            }
        }
    }

    // Normalize votes
    const votes: Record<string, VoteAction> = {};
    if (raw.votes) {
        for (const [voter, vote] of Object.entries(raw.votes)) {
            votes[voter] = vote as VoteAction;
        }
    }

    return {
        id: raw.id,
        daoId,
        proposer: raw.proposer,
        description: raw.description,
        kind: raw.kind as Proposal['kind'],
        status: raw.status as Proposal['status'],
        voteCount: voteCounts,
        submissionTime: raw.submission_time,
        votes,
    };
}
