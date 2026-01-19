// ===========================================
// Shared Types (Mirror of Backend)
// ===========================================

export interface DAO {
    id: string;
    name: string;
    contractId: string;
    memberCount: number;
    proposalCount: number;
    createdAt?: string;
    lastActivityAt?: string;
    griScore?: number;
}

export interface GRIScore {
    overall: number;
    breakdown: GRIBreakdown;
    lastUpdated: string;
}

export interface GRIBreakdown {
    participation: GRIMetric;
    executionReliability: GRIMetric;
    governanceLatency: GRIMetric;
    transparency: GRIMetric;
}

export interface GRIMetric {
    score: number;
    weight: number;
    rawValue: number;
    description: string;
}

export interface Proposal {
    id: number;
    daoId: string;
    proposer: string;
    description: string;
    kind: unknown;
    status: 'InProgress' | 'Approved' | 'Rejected' | 'Removed' | 'Expired' | 'Moved' | 'Failed';
    voteCount: {
        approve: number;
        reject: number;
        remove: number;
    };
    submissionTime: string;
    votes: Record<string, string>;
}

export interface DAOOverviewResponse {
    dao: DAO;
    gri: GRIScore;
    recentProposals: Proposal[];
    memberCount: number;
    activeMembers: number;
}

export interface NetworkHealthResponse {
    medianGRI: number;
    activeDAOs: number;
    inactiveDAOs: number;
    totalProposals: number;
    totalVotes: number;
    participationTrend: TrendPoint[];
}

export interface TrendPoint {
    date: string;
    value: number;
}

export interface DAOListResponse {
    daos: DAO[];
    totalCount: number;
    networkGRI: number;
}
