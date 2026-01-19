TRACK 1: GOVERNANCE REALITY INDEX (GRI)
0. Why this problem exists (root cause, not symptoms)

NEAR governance feels opaque not because it is secret, but because:

Data is fragmented across forum, DAO contracts, and wallets

No canonical “governance index” exists

Most governance analysis is qualitative, not empirical

Core contributors see the data, but nobody packages it coherently

So the crack is observability, not mechanism design.

You are not fixing governance.
You are fixing governance legibility.

1. What GRI actually measures (non-negotiable metrics)

These are the minimum viable metrics that matter to core team discussions.

A. Participation Metrics

Unique voters per proposal

Voter recurrence rate

DAO vs individual participation ratio

Participation decay over time

B. Power Distribution

Vote weight concentration (Gini coefficient style)

Top 5 / Top 10 voter dominance

Wallet clustering (same DAO, same multisig)

C. Proposal Dynamics

Time from submission → decision

% proposals passing vs failing

Abstention rates

Proposal category bias (funding, policy, tooling)

D. Actor Consistency

Repeat proposers

Repeat voters

Influence score (not reputation, just presence)

No sentiment analysis. No guessing intent. Just behavior.

2. Data Sources (exact, realistic)
2.1 Governance Forums

Source

gov.near.org (Discourse-based)

How

Discourse REST API

Endpoints:

/latest.json

/t/{topic_id}.json

/posts.json

What you extract

Proposal metadata

Author

Timestamps

Engagement counts

Proposal category tags

This gives off-chain governance context.

2.2 On-chain Voting / DAO Data

NEAR governance is DAO-driven. You must read Sputnik DAO contracts.

Contract

sputnik-dao.near and variants

SDK

near-api-js

Key RPC calls

query → call_function

Methods:

get_proposals

get_policy

get_members

get_votes (varies by DAO version)

You’ll need to:

Loop DAOs

Normalize proposal structures (they differ slightly)

This gives actual decision data.

2.3 Wallet & Account Metadata

Source

NEAR RPC

Indexer APIs

Options

NEAR Lake Indexer

Pagoda Indexer

FastNear API (if speed matters)

Used for

Identifying voter wallets

Checking DAO membership overlap

Repeated behavior patterns

3. Architecture (don’t overcomplicate, don’t underthink)
3.1 Backend

Stack

Node.js (TypeScript)

use fastify

near-api-js

PostgreSQL

Prisma ORM

Why

JS aligns with your SDK contribution path

Prisma gives fast schema iteration

Postgres handles analytics queries cleanly

3.2 Data Ingestion Strategy
Historical Backfill

One-time batch job:

Crawl last X months of proposals

Store normalized records

Live Updates

Cron-based polling (every 15–30 mins)

No need for websocket complexity yet

You are not building a real-time trading engine. Calm down.

3.3 Schema (simplified but real)
proposals
- id
- dao_id
- author
- created_at
- decided_at
- status
- category

votes
- proposal_id
- voter
- vote
- weight

actors
- wallet
- type (dao | individual)
- participation_count


Enough for MVP. Anything more is vanity.

4. Analytics Layer (this is the value)

This is where people usually get lazy. Don’t.

Computed Metrics

Participation Rate = voters / eligible voters

Concentration Index = top N vote weight / total

Actor Persistence Score = votes over time

Proposal Velocity = avg decision time

You compute these server-side and cache results.

5. Frontend (functional, not pretty)

Stack

Svelte5

Tailwind

Chart.js or Recharts

Pages

Overview Dashboard

Proposal Deep Dive

Actor Profiles

Trends Over Time

If it looks clean and serious, that’s enough.

6. What makes core team pay attention

They can verify your numbers

You don’t editorialize

You surface things they already feel but haven’t quantified

This is “thankless but respected” work. Perfect.