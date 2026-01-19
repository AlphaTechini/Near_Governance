// ===========================================
// GRI Backend - Shared TypeScript Types
// ===========================================

// DAO Types
export interface DAO {
  id: string;
  name: string;
  contractId: string;
  memberCount: number;
  proposalCount: number;
  createdAt?: string | Date;
  lastActivityAt?: string | Date;
  griScore?: number;
}

export interface DAOPolicy {
  roles: DAORole[];
  defaultVotePolicy: VotePolicy;
  proposalBond: string;
  proposalPeriod: string;
}

export interface DAORole {
  name: string;
  kind: 'Everyone' | 'Member' | 'Council' | { Group: string[] };
  permissions: string[];
  votePolicy?: Record<string, VotePolicy>;
}

export interface VotePolicy {
  weightKind: 'RoleWeight' | 'TokenWeight';
  quorum: string;
  threshold: [number, number] | 'Majority';
}

// Proposal Types
export interface Proposal {
  id: number;
  daoId: string;
  proposer: string;
  description: string;
  kind: ProposalKind;
  status: ProposalStatus;
  voteCount: VoteCounts;
  submissionTime: string;
  votePeriodEnd?: string;
  votes: Record<string, VoteAction>;
}

export type ProposalStatus =
  | 'InProgress'
  | 'Approved'
  | 'Rejected'
  | 'Removed'
  | 'Expired'
  | 'Moved'
  | 'Failed';

export type ProposalKind =
  | { AddMemberToRole: { member_id: string; role: string } }
  | { RemoveMemberFromRole: { member_id: string; role: string } }
  | { FunctionCall: { receiver_id: string; actions: FunctionCallAction[] } }
  | { Transfer: { token_id: string; receiver_id: string; amount: string } }
  | { SetStakingContract: { staking_id: string } }
  | { AddBounty: { bounty: Bounty } }
  | { BountyDone: { bounty_id: number; receiver_id: string } }
  | { Vote: unknown }
  | { FactoryInfoUpdate: unknown }
  | { ChangePolicyAddOrUpdateRole: { role: DAORole } }
  | { ChangePolicyRemoveRole: { role: string } }
  | { ChangePolicyUpdateDefaultVotePolicy: { vote_policy: VotePolicy } }
  | { ChangePolicyUpdateParameters: { parameters: unknown } }
  | { ChangeConfig: { config: unknown } };

export interface FunctionCallAction {
  method_name: string;
  args: string;
  deposit: string;
  gas: string;
}

export interface Bounty {
  description: string;
  token: string;
  amount: string;
  times: number;
  max_deadline: string;
}

export type VoteAction = 'Approve' | 'Reject' | 'Remove';

export interface VoteCounts {
  approve: number;
  reject: number;
  remove: number;
}

// Actor Types
export interface Actor {
  wallet: string;
  type: 'dao' | 'individual';
  participationCount: number;
  proposalsCreated: number;
  votesCount: number;
  lastActiveAt?: string;
}

// GRI Score Types
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

// API Response Types
export interface DAOListResponse {
  daos: DAO[];
  totalCount: number;
  networkGRI: number;
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

// Known DAOs to track (MVP - hardcoded list)
export const TRACKED_DAOS = [
  'sputnik-dao.near',
  'near.sputnik-dao.near',
  'marketing.sputnik-dao.near',
  'creative.sputnik-dao.near',
  'devhub.sputnik-dao.near',
];
