import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Chuỗi '/api' là tiền tố của các request bạn muốn proxy
      '/api': {
        target: 'http://localhost:5000', // Địa chỉ của backend server
        changeOrigin: true, // Cần thiết cho các virtual hosted sites
        secure: false,      // Không yêu cầu https
      },
    },
  },
})
