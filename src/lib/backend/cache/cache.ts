import NodeCache from "node-cache";

export const cache = new NodeCache({ stdTTL: 3600 }); // TTL = 1 hour
export const dailyCache = new NodeCache({ stdTTL: 90000 }); // TTL = 1 day and 1 hour
