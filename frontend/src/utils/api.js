// frontend/src/utils/api.js

export const getApiBaseUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:5000/api';
    }
    return import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
};

export const FALLBACK_API_URL = 'https://social-media-clone-di9z.onrender.com/api';

/**
 * Thực hiện gọi fetch an toàn:
 * 1. Thử gọi API chính (ưu tiên Localhost nếu đang chạy local, hoặc Cloud Render)
 * 2. Nếu gặp lỗi mạng (offline/server tắt) hoặc HTTP 502/503/404 ở endpoint mới, tự động fallback sang Render
 */
export const safeFetch = async (endpoint, options = {}) => {
    const primaryBase = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const primaryUrl = endpoint.startsWith('http') ? endpoint : `${primaryBase}${cleanEndpoint}`;

    try {
        const response = await fetch(primaryUrl, options);
        // Nếu thành công hoặc các mã client (400, 401, 403), trả về bình thường
        if (response.ok) return response;

        // Nếu gặp 502, 503 (server đang khởi động/crash) hoặc 404 (endpoint mới chưa có trên server cũ)
        // và URL chính khác Fallback URL thì thử fallback
        if ((response.status >= 500 || response.status === 404) && !endpoint.startsWith('http') && primaryBase !== FALLBACK_API_URL) {
            try {
                const fallbackUrl = `${FALLBACK_API_URL}${cleanEndpoint}`;
                const fallbackRes = await fetch(fallbackUrl, options);
                if (fallbackRes.ok) return fallbackRes;
            } catch (fbErr) {
                console.warn('Fallback API không phản hồi:', fbErr);
            }
        }
        return response;
    } catch (networkError) {
        // Lỗi mạng hoàn toàn (connection refused, server local tắt, DNS...)
        if (!endpoint.startsWith('http') && primaryBase !== FALLBACK_API_URL) {
            try {
                const fallbackUrl = `${FALLBACK_API_URL}${cleanEndpoint}`;
                return await fetch(fallbackUrl, options);
            } catch (fbErr) {
                console.warn('Cả primary lẫn fallback API đều không phản hồi:', fbErr);
                throw networkError;
            }
        }
        throw networkError;
    }
};

