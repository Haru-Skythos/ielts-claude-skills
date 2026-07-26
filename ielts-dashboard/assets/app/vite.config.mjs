import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadData } from './server/loadData.mjs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ielts-data-api',
      configureServer(server) {
        server.middlewares.use('/api/data', (req, res) => {
          try {
            const data = loadData()
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: String(e && e.message ? e.message : e) }))
          }
        })
      },
    },
  ],
  server: {
    port: 5173,
    open: false,
  },
})
