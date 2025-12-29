
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  define: {
    // Cela permet à Vite de remplacer "process.env.API_KEY" par sa valeur réelle lors du build sur Vercel
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
