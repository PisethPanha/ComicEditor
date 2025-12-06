import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Use fallback to empty string to prevent "undefined" in code if key is missing
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "")
    }
  };
});