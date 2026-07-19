import NodeCache from "node-cache";

export const alertCache = new NodeCache({ stdTTL: 60 }); // Cache for 1 minute
