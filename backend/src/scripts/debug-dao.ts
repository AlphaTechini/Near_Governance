
import { connect, keyStores } from 'near-api-js';

const TRACKED_DAOS = [
    'sputnik-dao.near',
    'near.sputnik-dao.near',
    'marketing.sputnik-dao.near',
    'creative.sputnik-dao.near',
    'devhub.sputnik-dao.near',
];

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

    for (const daoId of TRACKED_DAOS) {
        console.log(`\n-----------------------------------`);
        console.log(`Checking DAO: ${daoId}`);
        try {
            console.log(`Fetching proposal count...`);
            const count = await account.viewFunction({
                contractId: daoId,
                methodName: 'get_last_proposal_id',
                args: {},
            });
            console.log(`Proposal Count: ${count}`);

            console.log(`Fetching first 5 proposals...`);
            const result = await account.viewFunction({
                contractId: daoId,
                methodName: 'get_proposals',
                args: { from_index: 0, limit: 5 },
            });

            if (Array.isArray(result)) {
                console.log(`SUCCESS: Fetched ${result.length} proposals.`);
                if (result.length > 0) {
                    console.log('Sample Proposal ID:', result[0].id);
                }
            } else {
                console.log('WARNING: Result is not an array:', result);
            }

        } catch (error) {
            console.error(`ERROR fetching proposals for ${daoId}:`);
            console.error((error as any).message);
        }
    }
}

main().catch(console.error);
