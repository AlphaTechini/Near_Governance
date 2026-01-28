
import { connect, keyStores } from 'near-api-js';

const NEAR_CONFIG = {
    networkId: 'mainnet',
    nodeUrl: 'https://free.rpc.fastnear.com',
};

async function main() {
    console.log('Connecting to NEAR...');
    const near = await connect({
        networkId: NEAR_CONFIG.networkId,
        nodeUrl: NEAR_CONFIG.nodeUrl,
        keyStore: new keyStores.InMemoryKeyStore(),
    });

    const account = await near.account('dontcare');
    
    // Test multiple DAOs to find ones with actual proposals
    const daosToTest = [
        'marketing.sputnik-dao.near',
        'croncat.sputnik-dao.near', 
        'nearweek-news-contribution.sputnik-dao.near',
        'creatives.sputnik-dao.near',
    ];

    for (const daoId of daosToTest) {
        console.log(`\n--- Testing ${daoId} ---`);
        
        try {
            const lastId = await account.viewFunction({
                contractId: daoId,
                methodName: 'get_last_proposal_id',
                args: {},
            });
            console.log(`Last Proposal ID: ${lastId}`);

            if (lastId > 0) {
                // Try to fetch the latest proposal
                const latestIdx = lastId - 1;
                try {
                    const p = await account.viewFunction({
                        contractId: daoId,
                        methodName: 'get_proposal',
                        args: { id: latestIdx },
                    });
                    console.log(`Proposal ${latestIdx}: Status=${p.status}, Proposer=${p.proposer?.slice(0,20)}...`);
                } catch (e) {
                    console.log(`get_proposal(${latestIdx}) failed`);
                }

                // Fetch list
                const startIdx = Math.max(0, lastId - 5);
                const proposals = await account.viewFunction({
                    contractId: daoId,
                    methodName: 'get_proposals',
                    args: { from_index: startIdx, limit: 5 },
                });
                console.log(`get_proposals(${startIdx}, 5): ${proposals.length} proposals`);
                if (proposals.length > 0) {
                    console.log(`  Sample: id=${proposals[0].id}, status=${proposals[0].status}`);
                }
            }
        } catch (e) {
            console.log(`ERROR: ${(e as any).message.split('\n')[0]}`);
        }
    }
}

main().catch(console.error);
