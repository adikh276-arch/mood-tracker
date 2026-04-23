/// <reference types="vite/client" />

interface Window {
  env: {
    VITE_NEON_CONNECTION_STRING: string;
    VITE_NEON_API_KEY: string;
    VITE_PROJECT_ID: string;
  };
}
