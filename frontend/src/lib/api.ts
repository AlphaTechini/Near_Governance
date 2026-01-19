// ===========================================
// API Client
// ===========================================

import type {
    DAOListResponse,
    DAOOverviewResponse,
    NetworkHealthResponse,
    Proposal,
} from './types';

const API_BASE = 'http://localhost:3001';

export async function fetchNetworkHealth(): Promise<NetworkHealthResponse> {
    const res = await fetch(`${API_BASE}/network/health`);
    if (!res.ok) throw new Error('Failed to fetch network health');
    return res.json();
}

export async function fetchDAOs(): Promise<DAOListResponse> {
    const res = await fetch(`${API_BASE}/daos`);
    if (!res.ok) throw new Error('Failed to fetch DAOs');
    return res.json();
}

export async function fetchDAOOverview(id: string): Promise<DAOOverviewResponse> {
    const res = await fetch(`${API_BASE}/dao/${id}/overview`);
    if (!res.ok) throw new Error(`Failed to fetch overview for ${id}`);
    return res.json();
}

export async function fetchProposal(daoId: string, proposalId: string): Promise<{ proposal: Proposal; participationRate: number }> {
    const res = await fetch(`${API_BASE}/dao/${daoId}/proposal/${proposalId}`);
    if (!res.ok) throw new Error(`Failed to fetch proposal ${proposalId}`);
    return res.json();
}
