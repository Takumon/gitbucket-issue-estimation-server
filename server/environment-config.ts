
export const SERVER_PORT: string            = process.env.PORT || process.env.SERVER_PORT || '3000';
export const MONGO_URL: string              = process.env.MONGO_URL                       || 'mongodb://localhost:27017/test';
export const MONGO_RETRY_INTERVAL: number   = Number(process.env.MONGO_RETRY_INTERVAL)    || 20; // 単位は秒
