// File: controllers/paymentController.js
const { pool } = require('../config/db');
const crypto = require('crypto');
const querystring = require('querystring');
const { createNotification } = require('./NotificationController');

// Cấu hình các gói VIP Freemium
const VIP_PACKAGES = {
    vip_creator: {
        id: 'vip_creator',
        name: 'Gói VIP Sáng Tạo (VIP Creator)',
        amount: 59000,
        tier: 'creator',
        badge: 'crown_gold',
        boostCredits: 5,
        durationDays: 30
    },
    vip_pro: {
        id: 'vip_pro',
        name: 'Gói VIP Pro Chuyên Nghiệp (VIP Pro)',
        amount: 129000,
        tier: 'pro',
        badge: 'crown_diamond',
        boostCredits: 20,
        durationDays: 30
    }
};

/**
 * Thuật toán sắp xếp tham số chuẩn theo đặc tả tích hợp API của VNPAY
 */
function sortObject(obj) {
    const sorted = {};
    const str = [];
    let key;
    for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[decodeURIComponent(str[key])]).replace(/%20/g, "+");
    }
    return sorted;
}

/**
 * Định dạng ngày YYYYMMDDHHmmss cho VNPAY
 */
function formatVnpDate(date) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds());
}

/**
 * Cập nhật thông tin nâng cấp VIP cho người dùng trong DB
 */
async function applyVipUpgrade(userId, packageInfo) {
    const days = packageInfo.durationDays || 30;
    const updateQuery = `
        UPDATE users 
        SET vip_tier = $1,
            vip_badge = $2,
            is_verified = TRUE,
            ad_free = TRUE,
            post_boost_credits = COALESCE(post_boost_credits, 0) + $3,
            vip_expires_at = (
                CASE 
                    WHEN vip_expires_at IS NOT NULL AND vip_expires_at > NOW() 
                    THEN vip_expires_at + ($4 || ' days')::INTERVAL 
                    ELSE NOW() + ($4 || ' days')::INTERVAL 
                END
            )
        WHERE user_id = $5
        RETURNING user_id, username, vip_tier, vip_badge, is_verified, ad_free, post_boost_credits, vip_expires_at;
    `;
    const res = await pool.query(updateQuery, [
        packageInfo.tier,
        packageInfo.badge,
        packageInfo.boostCredits,
        String(days),
        userId
    ]);

    // Tạo thông báo chúc mừng người dùng
    try {
        await createNotification(
            userId,
            userId,
            'vip_upgrade',
            `Chúc mừng! Bạn đã nâng cấp thành công ${packageInfo.name}. Tích xanh, huy hiệu VIP và tính năng không quảng cáo đã được kích hoạt!`,
            null
        );
    } catch (notifErr) {
        console.warn('Không thể gửi thông báo VIP:', notifErr.message);
    }

    return res.rows[0];
}

/**
 * API: Tạo liên kết thanh toán VNPAY (Sandbox / Production)
 * POST /api/payment/create-payment-url
 */
const createPaymentUrl = async (req, res) => {
    try {
        const { packageId, bankCode } = req.body;
        const userId = req.user?.id || req.body.userId || req.body.user_id;

        if (!userId) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để nâng cấp gói VIP.' });
        }

        const selectedPackage = VIP_PACKAGES[packageId];
        if (!selectedPackage) {
            return res.status(400).json({ message: 'Gói VIP không hợp lệ.' });
        }

        const tmnCode = process.env.VNP_TMN_CODE || 'CGXZLS0Z';
        const secretKey = process.env.VNP_HASH_SECRET || 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';
        let vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        const returnUrl = req.body.returnUrl || process.env.VNP_RETURN_URL || 'http://localhost:5173/payment/result';

        const date = new Date();
        const createDate = formatVnpDate(date);
        // Mã orderId chuẩn VNPAY: chỉ bao gồm chữ số và chữ cái, không chứa gạch dưới _
        const orderId = `${createDate}${userId}${Math.floor(1000 + Math.random() * 9000)}`;
        const amount = selectedPackage.amount;

        // Lưu bản ghi giao dịch chờ thanh toán vào DB
        await pool.query(`
            INSERT INTO payment_transactions 
                (user_id, order_id, amount, package_id, payment_method, bank_code, status)
            VALUES ($1, $2, $3, $4, 'VNPAY', $5, 'pending')
            ON CONFLICT (order_id) DO NOTHING
        `, [userId, orderId, amount, packageId, bankCode || 'ALL']);

        let rawIp = req.headers['x-forwarded-for'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.connection?.socket?.remoteAddress ||
            '127.0.0.1';
        if (typeof rawIp === 'string') {
            if (rawIp.includes(',')) rawIp = rawIp.split(',')[0].trim();
            if (rawIp.includes('::ffff:')) rawIp = rawIp.replace('::ffff:', '');
            if (rawIp === '::1' || !/^(\d{1,3}\.){3}\d{1,3}$/.test(rawIp)) {
                rawIp = '127.0.0.1';
            }
        } else {
            rawIp = '127.0.0.1';
        }

        // vnp_OrderInfo chỉ chứa chữ cái không dấu, số, khoảng trắng (chuẩn API VNPAY)
        const cleanPkgName = selectedPackage.id === 'vip_pro' ? 'VIP Pro' : 'VIP Creator';
        const orderInfo = `Thanh toan ${cleanPkgName} ma ${orderId}`;

        let vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_Amount: Math.round(Number(amount) * 100), // VNPAY tính theo đơn vị nhân 100
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: rawIp,
            vnp_CreateDate: createDate
        };

        if (bankCode && bankCode.trim() !== '' && bankCode !== 'ALL') {
            vnp_Params.vnp_BankCode = bankCode.trim();
        }

        vnp_Params = sortObject(vnp_Params);

        // Chuỗi ký chuẩn VNPAY: nối các tham số đã sort bằng dấu & (không dùng querystring.stringify có thể lỗi separator)
        const signData = Object.keys(vnp_Params)
            .map(key => `${key}=${vnp_Params[key]}`)
            .join('&');

        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params.vnp_SecureHash = signed;

        const finalPaymentUrl = vnpUrl + '?' + Object.keys(vnp_Params)
            .map(key => `${key}=${vnp_Params[key]}`)
            .join('&');

        return res.status(200).json({
            success: true,
            orderId,
            paymentUrl: finalPaymentUrl,
            package: selectedPackage
        });
    } catch (err) {
        console.error('Lỗi khi tạo URL VNPAY:', err);
        return res.status(500).json({ message: 'Lỗi server khi tạo giao dịch VNPAY', error: err.message });
    }
};

/**
 * API: Xác minh kết quả trả về từ VNPAY và kích hoạt gói VIP
 * POST /api/payment/vnpay-verify
 */
const vnpayVerify = async (req, res) => {
    try {
        let vnp_Params = req.body;
        const secureHash = vnp_Params.vnp_SecureHash;

        delete vnp_Params.vnp_SecureHash;
        delete vnp_Params.vnp_SecureHashType;

        vnp_Params = sortObject(vnp_Params);
        const secretKey = process.env.VNP_HASH_SECRET || 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';
        const signData = Object.keys(vnp_Params)
            .map(key => `${key}=${vnp_Params[key]}`)
            .join('&');
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash !== signed) {
            return res.status(400).json({
                success: false,
                message: 'Chữ ký giao dịch không hợp lệ (Sai checksum HMAC SHA512)'
            });
        }

        const orderId = vnp_Params.vnp_TxnRef;
        const rspCode = vnp_Params.vnp_ResponseCode;
        const transactionNo = vnp_Params.vnp_TransactionNo;
        const bankCode = vnp_Params.vnp_BankCode;

        // Tìm bản ghi giao dịch
        const txnRes = await pool.query(
            'SELECT * FROM payment_transactions WHERE order_id = $1 LIMIT 1',
            [orderId]
        );

        if (txnRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mã đơn hàng giao dịch.' });
        }

        const txn = txnRes.rows[0];

        // Mã phản hồi '00' là giao dịch thành công trong chuẩn VNPAY
        if (rspCode === '00') {
            await pool.query(`
                UPDATE payment_transactions 
                SET status = 'success', 
                    vnp_transaction_no = $1, 
                    vnp_response_code = $2, 
                    bank_code = $3,
                    updated_at = NOW()
                WHERE order_id = $4
            `, [transactionNo, rspCode, bankCode, orderId]);

            const packageInfo = VIP_PACKAGES[txn.package_id] || VIP_PACKAGES.vip_creator;
            const updatedUser = await applyVipUpgrade(txn.user_id, packageInfo);

            return res.status(200).json({
                success: true,
                message: 'Giao dịch thanh toán VNPAY thành công! Bạn đã được kích hoạt VIP.',
                package: packageInfo,
                user: updatedUser
            });
        } else {
            await pool.query(`
                UPDATE payment_transactions 
                SET status = 'failed', 
                    vnp_response_code = $1,
                    updated_at = NOW()
                WHERE order_id = $2
            `, [rspCode, orderId]);

            return res.status(200).json({
                success: false,
                message: `Giao dịch không thành công hoặc người dùng đã hủy (Mã phản hồi: ${rspCode}).`
            });
        }
    } catch (err) {
        console.error('Lỗi khi xác minh giao dịch VNPAY:', err);
        return res.status(500).json({ message: 'Lỗi server khi xác minh VNPAY', error: err.message });
    }
};

/**
 * Webhook VNPAY IPN (Gọi nền từ server VNPAY sang server ứng dụng)
 * GET /api/payment/vnpay-ipn
 */
const vnpayIpn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params.vnp_SecureHash;

        delete vnp_Params.vnp_SecureHash;
        delete vnp_Params.vnp_SecureHashType;

        vnp_Params = sortObject(vnp_Params);
        const secretKey = process.env.VNP_HASH_SECRET || 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';
        const signData = Object.keys(vnp_Params)
            .map(key => `${key}=${vnp_Params[key]}`)
            .join('&');
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash !== signed) {
            return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
        }

        const orderId = vnp_Params.vnp_TxnRef;
        const rspCode = vnp_Params.vnp_ResponseCode;
        const txnRes = await pool.query('SELECT * FROM payment_transactions WHERE order_id = $1 LIMIT 1', [orderId]);

        if (txnRes.rows.length === 0) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        const txn = txnRes.rows[0];
        if (txn.status === 'success') {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        if (rspCode === '00') {
            await pool.query(`
                UPDATE payment_transactions 
                SET status = 'success', 
                    vnp_transaction_no = $1, 
                    vnp_response_code = $2, 
                    updated_at = NOW()
                WHERE order_id = $3
            `, [vnp_Params.vnp_TransactionNo, rspCode, orderId]);

            const packageInfo = VIP_PACKAGES[txn.package_id] || VIP_PACKAGES.vip_creator;
            await applyVipUpgrade(txn.user_id, packageInfo);

            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            await pool.query(`
                UPDATE payment_transactions 
                SET status = 'failed', 
                    vnp_response_code = $1, 
                    updated_at = NOW()
                WHERE order_id = $2
            `, [rspCode, orderId]);

            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        }
    } catch (err) {
        console.error('Lỗi VNPAY IPN:', err);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

/**
 * API: Thử nghiệm kích hoạt nhanh trong môi trường Sandbox (Test Sandbox Instant)
 * Giúp người dùng hoặc ban giám khảo kiểm tra trực tiếp ngay lập tức quyền lợi VIP mà không cần thẻ test VNPAY
 * POST /api/payment/test-sandbox-activate
 */
const testSandboxActivate = async (req, res) => {
    try {
        const { packageId } = req.body;
        const userId = req.user?.id || req.body.userId || req.body.user_id;

        if (!userId) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để thử nghiệm VIP.' });
        }

        const selectedPackage = VIP_PACKAGES[packageId] || VIP_PACKAGES.vip_creator;
        const orderId = `SANDBOX_${Date.now()}_${userId}`;

        await pool.query(`
            INSERT INTO payment_transactions 
                (user_id, order_id, amount, package_id, payment_method, status)
            VALUES ($1, $2, $3, $4, 'VNPAY_SANDBOX_TEST', 'success')
        `, [userId, orderId, selectedPackage.amount, selectedPackage.id]);

        const updatedUser = await applyVipUpgrade(userId, selectedPackage);

        return res.status(200).json({
            success: true,
            message: `[Sandbox Test] Bạn đã kích hoạt thành công ${selectedPackage.name}!`,
            package: selectedPackage,
            user: updatedUser
        });
    } catch (err) {
        console.error('Lỗi khi kích hoạt sandbox test:', err);
        return res.status(500).json({ message: 'Lỗi server khi kích hoạt thử nghiệm', error: err.message });
    }
};

/**
 * API: Đẩy bài viết (Post Boost) - Tiêu thụ 1 lượt boost của tài khoản VIP
 * POST /api/payment/boost-post/:postId
 */
const boostPost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.id || req.body.userId || req.body.user_id;

    if (!userId) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để đẩy bài viết.' });
    }

    try {
        // Kiểm tra quyền sở hữu bài viết
        const postRes = await pool.query('SELECT post_id, user_id, is_boosted, boosted_until FROM post WHERE post_id = $1', [postId]);
        if (postRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        const post = postRes.rows[0];
        if (Number(post.user_id) !== Number(userId)) {
            return res.status(403).json({ message: 'Bạn chỉ có thể đẩy bài viết do chính mình đăng tải.' });
        }

        // Kiểm tra số lượt boost còn lại của người dùng
        const userRes = await pool.query('SELECT user_id, vip_tier, COALESCE(post_boost_credits, 0) AS post_boost_credits FROM users WHERE user_id = $1', [userId]);
        const user = userRes.rows[0];

        const credits = Number(user.post_boost_credits || 0);
        if (credits <= 0) {
            return res.status(403).json({
                message: 'Bạn đã hết lượt đẩy bài viết ưu tiên. Vui lòng nâng cấp hoặc gia hạn gói VIP để nhận thêm lượt đẩy!',
                needVip: true
            });
        }

        // Trừ 1 credit và cập nhật bài viết được boost trong 24 giờ
        await pool.query('UPDATE users SET post_boost_credits = post_boost_credits - 1 WHERE user_id = $1', [userId]);
        const updatePostRes = await pool.query(`
            UPDATE post 
            SET is_boosted = TRUE, 
                boosted_until = NOW() + INTERVAL '24 hours' 
            WHERE post_id = $1 
            RETURNING post_id, is_boosted, boosted_until
        `, [postId]);

        return res.status(200).json({
            success: true,
            message: '🚀 Đẩy bài viết thành công! Bài viết của bạn sẽ được ưu tiên hiển thị trên đỉnh Bảng tin trong 24 giờ.',
            remainingCredits: credits - 1,
            post: updatePostRes.rows[0]
        });
    } catch (err) {
        console.error('Lỗi khi đẩy bài viết:', err);
        return res.status(500).json({ message: 'Lỗi server khi đẩy bài viết', error: err.message });
    }
};

/**
 * API: Lấy thông tin trạng thái VIP và số lượt boost của người dùng
 * GET /api/payment/vip-status/:userId
 */
const getVipStatus = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT user_id, username, vip_tier, vip_badge, vip_expires_at, 
                   (ad_free IS TRUE) AS ad_free, (is_verified IS TRUE) AS is_verified,
                   COALESCE(post_boost_credits, 0) AS post_boost_credits
            FROM users 
            WHERE user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        const user = result.rows[0];
        const isVipActive = user.vip_tier && user.vip_tier !== 'free' && (!user.vip_expires_at || new Date(user.vip_expires_at) > new Date());

        return res.json({
            ...user,
            isVipActive,
            packages: VIP_PACKAGES
        });
    } catch (err) {
        console.error('Lỗi khi lấy trạng thái VIP:', err);
        return res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// Cấu hình tài khoản ngân hàng nhận tiền trực tiếp của chủ hệ thống (Vietcombank)
const OWNER_BANK_CONFIG = {
    bankId: 'vietcombank', // Vietcombank Napas ID
    bankName: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
    shortName: 'Vietcombank',
    accountNo: '9394465396',
    accountName: 'CHỦ TÀI KHOẢN VCB'
};

/**
 * API: Tạo yêu cầu thanh toán chuyển khoản trực tiếp qua VietQR (Tài khoản VCB)
 * POST /api/payment/create-vietqr
 */
const createVietQrPayment = async (req, res) => {
    try {
        const { packageId } = req.body;
        const userId = req.user?.id || req.body.userId || req.body.user_id;

        if (!userId) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để nâng cấp gói VIP.' });
        }

        const selectedPackage = VIP_PACKAGES[packageId];
        if (!selectedPackage) {
            return res.status(400).json({ message: 'Gói VIP không hợp lệ.' });
        }

        const date = new Date();
        const createDate = formatVnpDate(date);
        const orderSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderId = `NVG${createDate.slice(8)}${userId}${orderSuffix}`;
        const amount = selectedPackage.amount;
        const addInfo = `${orderId}`;

        // Lưu bản ghi giao dịch chờ thanh toán vào DB
        await pool.query(`
            INSERT INTO payment_transactions 
                (user_id, order_id, amount, package_id, payment_method, bank_code, status)
            VALUES ($1, $2, $3, $4, 'VIETQR_VCB', 'Vietcombank', 'pending')
            ON CONFLICT (order_id) DO NOTHING
        `, [userId, orderId, amount, packageId]);

        // Link sinh mã QR động chuẩn VietQR Napas
        const qrUrl = `https://img.vietqr.io/image/${OWNER_BANK_CONFIG.bankId}-${OWNER_BANK_CONFIG.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;

        return res.status(200).json({
            success: true,
            orderId,
            bankConfig: OWNER_BANK_CONFIG,
            amount,
            addInfo,
            qrUrl,
            package: selectedPackage
        });
    } catch (err) {
        console.error('Lỗi khi tạo mã VietQR:', err);
        return res.status(500).json({ message: 'Lỗi server khi tạo mã VietQR', error: err.message });
    }
};

/**
 * API: Xác nhận đã chuyển khoản thành công qua VietQR và kích hoạt VIP
 * POST /api/payment/confirm-vietqr
 */
const confirmVietQrPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user?.id || req.body.userId || req.body.user_id;

        if (!userId || !orderId) {
            return res.status(400).json({ message: 'Thiếu thông tin đơn hàng.' });
        }

        const txnRes = await pool.query(
            'SELECT * FROM payment_transactions WHERE order_id = $1 AND user_id = $2 LIMIT 1',
            [orderId, userId]
        );

        if (txnRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng giao dịch.' });
        }

        const txn = txnRes.rows[0];

        // Cập nhật trạng thái giao dịch
        await pool.query(`
            UPDATE payment_transactions 
            SET status = 'success', 
                updated_at = NOW() 
            WHERE order_id = $1
        `, [orderId]);

        const selectedPackage = VIP_PACKAGES[txn.package_id] || VIP_PACKAGES.vip_creator;
        const updatedUser = await applyVipUpgrade(userId, selectedPackage);

        return res.status(200).json({
            success: true,
            message: `Xác nhận giao dịch thành công! ${selectedPackage.name} của bạn đã được kích hoạt.`,
            package: selectedPackage,
            user: updatedUser
        });
    } catch (err) {
        console.error('Lỗi xác nhận VietQR:', err);
        return res.status(500).json({ message: 'Lỗi server khi xác nhận thanh toán', error: err.message });
    }
};

/**
 * API: Lấy danh sách giao dịch cho Quản trị viên (đối soát tiền vào tài khoản Vietcombank)
 * GET /api/payment/transactions
 */
const getAllTransactions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pt.*, u.username, u.profile_photo_url
            FROM payment_transactions pt
            JOIN users u ON pt.user_id = u.user_id
            ORDER BY pt.created_at DESC
            LIMIT 100
        `);
        return res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách giao dịch:', err);
        return res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

module.exports = {
    VIP_PACKAGES,
    OWNER_BANK_CONFIG,
    createPaymentUrl,
    vnpayVerify,
    vnpayIpn,
    testSandboxActivate,
    boostPost,
    getVipStatus,
    createVietQrPayment,
    confirmVietQrPayment,
    getAllTransactions
};
