const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ALLOWED_FILES = [
    'dishes.json', 'categories.json', 'ingredients.json',
    'inventory.json', 'flavorOptionsMapping.json', 'ingredientMapping.json',
    'orders.json'
];

const DATA_DIR = path.join(__dirname, 'public', 'data');

const writeQueues = new Map();

async function atomicWrite(filePath, data) {
    const tmpPath = filePath + '.tmp';
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmpPath, filePath);
}

function enqueueWrite(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    if (!writeQueues.has(filename)) {
        writeQueues.set(filename, Promise.resolve());
    }
    const next = writeQueues.get(filename).then(() => atomicWrite(filePath, data));
    writeQueues.set(filename, next);
    return next;
}

app.post('/api/save', async (req, res) => {
    try {
        const { filename, data } = req.body;

        if (!ALLOWED_FILES.includes(filename)) {
            return res.status(403).json({ success: false, message: '禁止修改此文件' });
        }

        await enqueueWrite(filename, data);

        res.json({ success: true, message: `${filename} 保存成功！` });
    } catch (error) {
        console.error('保存失败:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/order', async (req, res) => {
    try {
        const order = req.body;

        if (!order || !order.items || !Array.isArray(order.items) || order.items.length === 0) {
            return res.status(400).json({ success: false, message: '订单数据不合法' });
        }

        const ordersPath = path.join(DATA_DIR, 'orders.json');
        let orders = [];
        try {
            const raw = await fs.readFile(ordersPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.orders)) {
                orders = parsed.orders;
            }
        } catch (e) {
            // 首次写入，文件还不存在
        }

        order.id = `ord_${Date.now()}`;
        order.createdAt = new Date().toLocaleString('zh-CN', { hour12: false });
        order.status = 'pending';
        orders.unshift(order);

        await atomicWrite(ordersPath, { orders });

        res.json({ success: true, orderId: order.id });
    } catch (error) {
        console.error('订单提交失败:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`\n🍽️ 家庭点菜系统已启动！`);
    console.log(`=================================`);
    console.log(`📱 【前台点菜】 http://localhost:${PORT}`);
    console.log(`⚙️  【后台管理】 http://localhost:${PORT}/admin.html`);
    console.log(`=================================\n`);
});
