import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Chuỗi '/api' là tiền tố của các request bạn muốn proxy
      '/api': {
        target: 'https://social-media-clone-di9z.onrender.com/api', // Địa chỉ của backend server
        changeOrigin: true, // Cần thiết cho các virtual hosted sites
        secure: false,      // Không yêu cầu https
      },
    },
  },
})
