import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    root: '.',
    publicDir: 'public',
    server: {
        proxy: {
            '/api': {
                target: 'https://social-media-clone-di9z.onrender.com/api',
                changeOrigin: true,
                secure: false,
            },
        },
    },
})