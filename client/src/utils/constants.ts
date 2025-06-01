export const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000';
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
