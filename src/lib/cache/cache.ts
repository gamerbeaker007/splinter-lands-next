import NodeCache from "node-cache";

export const cache = new NodeCache({ stdTTL: 3600 }); // TTL = 1 hour
