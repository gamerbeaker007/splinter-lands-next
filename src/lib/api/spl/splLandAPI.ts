import axios from 'axios';
import * as rax from 'retry-axios';

const splLandClient = axios.create({
    baseURL: 'https://vapi.splinterlands.com',
    timeout: 60000,
    headers: {
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'User-Agent': 'SPL-Data/1.0',
    },
});


rax.attach(splLandClient);
splLandClient.defaults.raxConfig = {
    instance: splLandClient,
    retry: 10,
    retryDelay: 1000,
    backoffType: 'exponential',
    statusCodesToRetry: [[429, 429], [500, 599]],
    onRetryAttempt: err => {
        const cfg = rax.getConfig(err);
        console.warn(`Retry attempt #${cfg?.currentRetryAttempt}`);
    },
};

export async function fetchRegionData(region: number) {
    const url = '/land/deeds';
    const res = await splLandClient.get(url, { params: { region_number: region } });

    const data = res.data?.data;

    if (!data) throw new Error('Invalid response from Splinterlands API');

    return {
        deeds: data.deeds,
        worksite_details: data.worksite_details,
        staking_details: data.staking_details,
    };
}

export async function getLandResourcesPools() {
    const url = `/land/liquidity/landpools`;
    const res = await splLandClient.get(url);

    const data = res.data?.data;
    if (!data) throw new Error('Invalid response from Splinterlands API');
    return data || []
}

export async function getMidnightPotionPrice(): Promise<number> {
    try {
        const url = '/market/landing';
        const params = { assets: 'CONSUMABLES' };

        const res = await splLandClient.get(url, { params });

        const assets = res.data?.data?.assets;
        if (!Array.isArray(assets)) {
            console.warn('⚠️ No assets array found in response.');
            return 0;
        }

        const potion = assets.find(asset => asset.detailId === 'MIDNIGHTPOT');

        const price = potion?.prices?.[0]?.minPrice;

        if (typeof price === 'number') {
            return price;
        }

        console.warn('⚠️ Midnight Potion not found or missing price.');
        return 0;
    } catch (error) {
        console.error('❌ Failed to fetch Midnight Potion price:', error);
        return 0;
    }
}
