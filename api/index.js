const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ══════════════════════════════════════════════════
// 🤖 GEMINI AI ROUTE
// ══════════════════════════════════════════════════
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ 
            success: false, 
            error: { code: 400, message: 'Vui lòng cung cấp "prompt" trong body JSON.' } 
        });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return res.json({
                success: true,
                data: {
                    mode: 'real',
                    reply: text
                }
            });
        } 
        
        else {
            // Simulated Delay (1.5 seconds) for Mock Mode to feel real
            await new Promise(resolve => setTimeout(resolve, 1500));

            return res.json({
                success: true,
                data: {
                    mode: 'mock',
                    note: 'Chưa cấu hình GEMINI_API_KEY. Đây là phản hồi giả lập (có độ trễ 1.5s).',
                    reply: `(Giả lập) Chào bạn! Tôi là Cửu Vĩ (Goku Black Mode). Bạn vừa nói: "${prompt}". Hãy nhập Google API Key để kích hoạt sức mạnh thực sự!`
                }
            });
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ 
            success: false, 
            error: { code: 500, message: 'Lỗi máy chủ khi gọi Gemini API. Hãy kiểm tra lại cấu hình.' } 
        });
    }
});

// ══════════════════════════════════════════════════
// 💰 ZENI PAY ROUTES
// ══════════════════════════════════════════════════
const transactions = {};
const validKeys = new Set(['PAYOS_TEST_KEY']); // Thêm một key mặc định để test dễ dàng

// API: Generate a new API Key (Zeni Pay)
app.post('/api/generate-key', (req, res) => {
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newKey = 'PAYOS_' + randomString.toUpperCase();
    validKeys.add(newKey);
    res.json({ api_key: newKey });
});

// API: Create a new payment transaction
app.post('/api/create-payment', async (req, res) => {
    // Tạm thời cho phép bỏ qua check API Key để test Frontend cho mượt
    // Nếu muốn check chặt chẽ, bỏ comment đoạn dưới:
    /*
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || !validKeys.has(apiKey)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }
    */

    const amount = req.body.amount || 500000;
    const txnId = 'ZENI-' + Math.floor(Math.random() * 1000000);
    
    transactions[txnId] = {
        status: 'PENDING',
        amount: amount,
        createdAt: Date.now()
    };
    
    // Lấy domain hiện tại để tạo paymentUrl (Vercel tự cung cấp header host)
    const host = req.headers.host || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const paymentUrl = `${protocol}://${host}/api/pay/${txnId}`;
    
    try {
        const qrBase64 = await qrcode.toDataURL(paymentUrl, {
            color: {
                dark: '#ff4d94', // Rosé Pink
                light: '#ffffff'
            }
        });
        
        res.json({
            success: true,
            data: {
                transaction_id: txnId,
                qr_code: qrBase64,
                payment_url: paymentUrl,
                message: "Mã QR đã được tạo thành công!"
            }
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: { code: 500, message: 'Failed to generate QR code' } 
        });
    }
});

// API: Check payment status (Polling)
app.get('/api/status/:txnId', (req, res) => {
    const txn = transactions[req.params.txnId];
    if (!txn) {
        return res.status(404).json({ 
            success: false, 
            error: { code: 404, message: 'Transaction not found' } 
        });
    }
    res.json({
        success: true,
        data: txn
    });
});

// WEB: Payment Confirmation Page (To be opened on the phone via QR Code)
app.get('/api/pay/:txnId', (req, res) => {
    const txn = transactions[req.params.txnId];
    if (!txn) {
        return res.send('<h1 style="color:#ff4d94; text-align:center; font-family:sans-serif; margin-top:50px;">Giao dịch không tồn tại hoặc đã hết hạn.</h1>');
    }
    
    if (txn.status === 'PAID') {
        return res.send(`
            <div style="text-align: center; font-family: sans-serif; padding: 50px;">
                <h1 style="color: #27ae60;">Đã Thanh Toán!</h1>
                <p>Giao dịch ${req.params.txnId} đã hoàn tất.</p>
            </div>
        `);
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Xác nhận thanh toán Zeni</title>
            <style>
                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #10002b; color: #fff;}
                .card { background: rgba(255,255,255,0.05); padding: 30px; border-radius: 15px; border: 1px solid #ff4d94; text-align: center; }
                h1 { color: #ff4d94; margin-top: 0; }
                .amount { font-size: 24px; font-weight: bold; color: #ff9ebb; margin: 20px 0; }
                .btn { background: #9d4edd; color: white; border: none; padding: 15px 30px; font-size: 18px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; box-sizing: border-box; }
                .btn:active { background: #7b2cbf; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Zeni Pay</h1>
                <p>Mã GD: <strong style="color:#fff;">${req.params.txnId}</strong></p>
                <div class="amount">Số tiền: ${txn.amount.toLocaleString()} VND</div>
                <button class="btn" id="confirmBtn">Xác nhận Thanh toán</button>
                <p id="msg" style="margin-top: 15px; font-weight: bold;"></p>
            </div>
            
            <script>
                document.getElementById('confirmBtn').addEventListener('click', async () => {
                    const btn = document.getElementById('confirmBtn');
                    const msg = document.getElementById('msg');
                    btn.disabled = true;
                    btn.innerText = 'Đang xuất chiêu...';
                    
                    try {
                        const res = await fetch('/api/confirm/${req.params.txnId}', { method: 'POST' });
                        if (res.ok) {
                            msg.innerText = '✅ Chuyển khoản thành công!';
                            msg.style.color = '#27ae60';
                            btn.style.display = 'none';
                        } else {
                            msg.innerText = '❌ Có lỗi xảy ra!';
                            msg.style.color = '#ff4d94';
                            btn.disabled = false;
                            btn.innerText = 'Thử lại';
                        }
                    } catch (err) {
                        msg.innerText = '❌ Không thể kết nối tới máy chủ!';
                        msg.style.color = '#ff4d94';
                        btn.disabled = false;
                        btn.innerText = 'Thử lại';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// API: Confirm payment (Called by the phone's confirmation page)
app.post('/api/confirm/:txnId', (req, res) => {
    const txn = transactions[req.params.txnId];
    if (!txn) {
        return res.status(404).json({ error: 'Transaction not found' });
    }
    
    txn.status = 'PAID';
    txn.paidAt = Date.now();
    
    res.json({ success: true, transaction: txn });
});

// ══════════════════════════════════════════════════
// EXPORT FOR VERCEL
// ══════════════════════════════════════════════════
// Thay vì app.listen, chúng ta export module để Vercel chạy dưới dạng Serverless Function
module.exports = app;

// Nếu chạy local (node api/index.js), nó vẫn tự động chạy
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running locally at http://localhost:${PORT}`);
    });
}
