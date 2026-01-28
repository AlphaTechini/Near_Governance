// ===========================================
// Script: Discover Top DAOs by Proposal Count
// ===========================================
// Usage: npx tsx src/scripts/discover-top-daos.ts
// 
// This script fetches proposal counts for all DAOs from the factory
// and outputs the Top N DAOs sorted by proposal count.
// It's efficient because get_last_proposal_id is a lightweight call.

import { connect, keyStores } from 'near-api-js';

const NEAR_CONFIG = {
    networkId: 'mainnet',
    nodeUrl: 'https://free.rpc.fastnear.com',
};

const FACTORY_ID = 'sputnik-dao.near';
const TOP_N = 15; // Get top 15 to have some extras

interface DAOInfo {
    id: string;
    proposalCount: number;
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('Connecting to NEAR...');
    const near = await connect({
        networkId: NEAR_CONFIG.networkId,
        nodeUrl: NEAR_CONFIG.nodeUrl,
        keyStore: new keyStores.InMemoryKeyStore(),
    });

    const account = await near.account('dontcare');

    // Step 1: Get all DAOs from factory (paginated)
    console.log('Fetching DAO list from factory...');
    const allDaos: string[] = [];
    let offset = 0;
    const batchSize = 500;

    while (true) {
        const batch = await account.viewFunction({
            contractId: FACTORY_ID,
            methodName: 'get_dao_list',
            args: { from_index: offset, limit: batchSize },
        }) as string[];

        if (batch.length === 0) break;
        allDaos.push(...batch);
        offset += batch.length;
        console.log(`  Fetched ${allDaos.length} DAOs so far...`);
    }

    console.log(`\nTotal DAOs in factory: ${allDaos.length}`);

    // Step 2: Get proposal count for each DAO
    console.log('\nFetching proposal counts (this may take a few minutes)...');
    const daoInfos: DAOInfo[] = [];
    let processed = 0;
    let errors = 0;

    for (const daoName of allDaos) {
        const daoId = `${daoName}.${FACTORY_ID}`;
        try {
            const count = await account.viewFunction({
                contractId: daoId,
                methodName: 'get_last_proposal_id',
                args: {},
            }) as number;

            daoInfos.push({ id: daoId, proposalCount: count });
        } catch (error) {
            // Some DAOs might be invalid or have issues
            errors++;
        }

        processed++;
        if (processed % 100 === 0) {
            console.log(`  Processed ${processed}/${allDaos.length} (${errors} errors)`);
        }

        // Small delay to avoid RPC rate limits
        await delay(50);
    }

    console.log(`\nProcessed ${processed} DAOs, ${errors} errors`);

    // Step 3: Sort by proposal count and get top N
    daoInfos.sort((a, b) => b.proposalCount - a.proposalCount);
    const topDaos = daoInfos.slice(0, TOP_N);

    // Step 4: Output results
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TOP ${TOP_N} DAOS BY PROPOSAL COUNT`);
    console.log(`${'='.repeat(60)}\n`);

    topDaos.forEach((dao, i) => {
        console.log(`${(i + 1).toString().padStart(2)}. ${dao.id.padEnd(45)} ${dao.proposalCount.toString().padStart(6)} proposals`);
    });

    // Step 5: Output as TypeScript array for copy-paste
    console.log(`\n${'='.repeat(60)}`);
    console.log('COPY-PASTE FOR TRACKED_DAOS:');
    console.log(`${'='.repeat(60)}\n`);

    console.log('export const TOP_DAOS = [');
    topDaos.forEach(dao => {
        console.log(`    '${dao.id}',`);
    });
    console.log('];');
}

main().catch(console.error);
