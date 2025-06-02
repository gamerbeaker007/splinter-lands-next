import { ResourceSupplyResponse } from '@/types/resourceSupplyResponse';
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

export async function fetchResourceSupply(resource: string) {
    const url = '/land/resources/leaderboards';
    const params = new URLSearchParams({
        territory: "",
        region: "",
        resource,
        player: "",
        limit: "150000",
    });

    const res = await splLandClient.get(url, { params: params });

    const data = res.data?.data;
    if (!data) throw new Error('Invalid response from Splinterlands API');

    return Array.isArray(data)
        ? (data as ResourceSupplyResponse[])
        : [];
}
