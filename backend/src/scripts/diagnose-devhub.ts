
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
    const targetDao = 'devhub.sputnik-dao.near';

    console.log(`\nDiagnosing DAO: ${targetDao}`);

    try {
        console.log('Fetching Last Proposal ID...');
        const lastId = await account.viewFunction({
            contractId: targetDao,
            methodName: 'get_last_proposal_id',
            args: {},
        });
        console.log(`Last Proposal ID: ${lastId}`);

        if (typeof lastId === 'number') {
            console.log('Fetching range [0, 5]...');
            try {
                const proposals = await account.viewFunction({
                    contractId: targetDao,
                    methodName: 'get_proposals',
                    args: { from_index: 0, limit: 5 },
                });
                console.log(`Fetched ${Array.isArray(proposals) ? proposals.length : 'invalid'} proposals.`);
                if (proposals.length > 0) console.log('First:', JSON.stringify(proposals[0], null, 2));
            } catch (err) {
                console.error('get_proposals FAILED:', (err as any).message);
            }

            // Reverse fetch?
            console.log('Fetching range [lastId - 5, 5]...');
            const start = Math.max(0, lastId - 5);
            try {
                const proposals = await account.viewFunction({
                    contractId: targetDao,
                    methodName: 'get_proposals',
                    args: { from_index: start, limit: 5 },
                });
                console.log(`Fetched ${Array.isArray(proposals) ? proposals.length : 'invalid'} proposals from end.`);
            } catch (err) {
                console.error('get_proposals (end) FAILED:', (err as any).message);
            }
        }
    } catch (e) {
        console.error(`FAILED to fetch info for ${targetDao}:`, (e as any).message);
    }
}

main().catch(console.error);
