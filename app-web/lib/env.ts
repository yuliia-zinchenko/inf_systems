export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

// Server-side fetches run inside the web container in Docker, where the
// browser-facing URL (localhost) does not reach the API.
export const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? API_BASE_URL;

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
