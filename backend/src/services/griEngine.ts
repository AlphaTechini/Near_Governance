// ===========================================
// GRI Scoring Engine
// ===========================================
// 
// GRI Score Formula:
// - Participation Score (40%)
// - Execution Reliability (30%)
// - Governance Latency (20%)
// - Transparency Signals (10%)
//
// All metrics are explainable with raw values.
// No black boxes.
// ===========================================

import type { Proposal, GRIScore, GRIBreakdown, GRIMetric, DAOPolicy } from '../types/index.js';

const WEIGHTS = {
    participation: 0.4,
    executionReliability: 0.3,
    governanceLatency: 0.2,
    transparency: 0.1,
} as const;

/**
 * Calculate full GRI score for a DAO
 */
export function calculateGRI(
    proposals: Proposal[],
    policy: DAOPolicy | undefined,
    memberCount: number
): GRIScore {
    const breakdown: GRIBreakdown = {
        participation: calculateParticipationScore(proposals, memberCount),
        executionReliability: calculateExecutionReliability(proposals),
        governanceLatency: calculateGovernanceLatency(proposals),
        transparency: calculateTransparencyScore(proposals),
    };

    const overall =
        breakdown.participation.score * WEIGHTS.participation +
        breakdown.executionReliability.score * WEIGHTS.executionReliability +
        breakdown.governanceLatency.score * WEIGHTS.governanceLatency +
        breakdown.transparency.score * WEIGHTS.transparency;

    return {
        overall: Math.round(overall * 10) / 10,
        breakdown,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Participation Score (40%)
 * Measures: avg voters per proposal / eligible voters
 */
function calculateParticipationScore(proposals: Proposal[], memberCount: number): GRIMetric {
    if (proposals.length === 0 || memberCount === 0) {
        return {
            score: 0,
            weight: WEIGHTS.participation,
            rawValue: 0,
            description: 'No proposals or members found',
        };
    }

    // Calculate average unique voters per proposal
    let totalVoters = 0;
    for (const proposal of proposals) {
        totalVoters += Object.keys(proposal.votes).length;
    }
    const avgVoters = totalVoters / proposals.length;

    // Score = (avg voters / member count) * 100, capped at 100
    const participationRate = Math.min((avgVoters / memberCount) * 100, 100);

    return {
        score: Math.round(participationRate * 10) / 10,
        weight: WEIGHTS.participation,
        rawValue: Math.round(avgVoters * 10) / 10,
        description: `Average ${avgVoters.toFixed(1)} voters per proposal out of ${memberCount} members`,
    };
}

/**
 * Execution Reliability Score (30%)
 * Measures: approved proposals that completed successfully
 */
function calculateExecutionReliability(proposals: Proposal[]): GRIMetric {
    if (proposals.length === 0) {
        return {
            score: 0,
            weight: WEIGHTS.executionReliability,
            rawValue: 0,
            description: 'No proposals found',
        };
    }

    const approved = proposals.filter((p) => p.status === 'Approved').length;
    const rejected = proposals.filter((p) => p.status === 'Rejected').length;
    const expired = proposals.filter((p) => p.status === 'Expired').length;
    const failed = proposals.filter((p) => p.status === 'Failed').length;

    const decided = approved + rejected;
    if (decided === 0) {
        return {
            score: 50, // Neutral if no decided proposals
            weight: WEIGHTS.executionReliability,
            rawValue: 0,
            description: 'No decided proposals yet',
        };
    }

    // Score based on:
    // - High approval rate is good (governance is functional)
    // - Low expired/failed rate is good (proposals are being processed)
    const successRate = (approved / (approved + failed + expired)) * 100;
    const score = Math.min(successRate, 100);

    return {
        score: Math.round(score * 10) / 10,
        weight: WEIGHTS.executionReliability,
        rawValue: approved,
        description: `${approved} approved, ${rejected} rejected, ${expired} expired, ${failed} failed`,
    };
}

/**
 * Governance Latency Score (20%)
 * Measures: how fast proposals are decided
 */
function calculateGovernanceLatency(proposals: Proposal[]): GRIMetric {
    const decidedProposals = proposals.filter((p) =>
        ['Approved', 'Rejected'].includes(p.status)
    );

    if (decidedProposals.length === 0) {
        return {
            score: 50, // Neutral
            weight: WEIGHTS.governanceLatency,
            rawValue: 0,
            description: 'No decided proposals to measure latency',
        };
    }

    // We don't have explicit decision timestamps in basic proposal data
    // For MVP, we estimate based on proposal volume and activity patterns
    // Lower score for DAOs with lots of expired proposals (slow governance)
    const expiredCount = proposals.filter((p) => p.status === 'Expired').length;
    const expiredRatio = expiredCount / proposals.length;

    // Score: 100 if no expired, decreasing as expired ratio increases
    const score = Math.max(0, 100 - expiredRatio * 200);

    return {
        score: Math.round(score * 10) / 10,
        weight: WEIGHTS.governanceLatency,
        rawValue: expiredRatio,
        description: `${expiredCount} of ${proposals.length} proposals expired (${(expiredRatio * 100).toFixed(1)}%)`,
    };
}

/**
 * Transparency Score (10%)
 * Measures: proposals with meaningful descriptions
 * (MVP: simple heuristic based on description length)
 */
function calculateTransparencyScore(proposals: Proposal[]): GRIMetric {
    if (proposals.length === 0) {
        return {
            score: 0,
            weight: WEIGHTS.transparency,
            rawValue: 0,
            description: 'No proposals found',
        };
    }

    // Count proposals with substantial descriptions (>50 chars)
    const withDescription = proposals.filter(
        (p) => p.description && p.description.length > 50
    ).length;

    const transparencyRate = (withDescription / proposals.length) * 100;

    return {
        score: Math.round(transparencyRate * 10) / 10,
        weight: WEIGHTS.transparency,
        rawValue: withDescription,
        description: `${withDescription} of ${proposals.length} proposals have detailed descriptions`,
    };
}

/**
 * Calculate network-wide median GRI
 */
export function calculateMedianGRI(griScores: number[]): number {
    if (griScores.length === 0) return 0;

    const sorted = [...griScores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

/**
 * Get GRI grade label from score
 */
export function getGRIGrade(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Needs Improvement';
    return 'Critical';
}
