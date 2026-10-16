import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Git ignores do not prevent Vite from serving files over HTTP. Keep the
    // payment backend, credential exports and private QA artifacts off the web.
    fs: {
      deny: [
        '.env', '.env.*', '*.{crt,pem}', '**/.git/**',
        '**/server/**', '**/serviceAccountKey.json', '**/rzp.csv',
        '**/.secrets/**', '**/*.local.*',
      ],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
    allowedHosts: ["cdc60be16c44.ngrok-free.app"], // for local
    host: "0.0.0.0"
  }
})
