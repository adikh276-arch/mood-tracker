import { neon } from '@neondatabase/serverless';

// @ts-ignore
const connectionString = window.env?.VITE_NEON_CONNECTION_STRING || import.meta.env.VITE_NEON_CONNECTION_STRING;

if (!connectionString) {
    throw new Error('Database connection string is missing');
}

export const sql = neon(connectionString);
