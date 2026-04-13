const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// 解析 JSON 格式的请求体
app.use(express.json({ limit: '10mb' }));
// 静态托管项目根目录，以便访问 HTML/CSS/JS 和 images
app.use(express.static(__dirname));

// 统一的数据保存 API
app.post('/api/save', async (req, res) => {
    try {
        const { filename, data } = req.body;
        
        // 安全白名单，防止恶意篡改其他文件
        const allowedFiles = [
            'dishes.json', 'categories.json', 'ingredients.json', 
            'inventory.json', 'flavorOptionsMapping.json', 'ingredientMapping.json'
        ];
        
        if (!allowedFiles.includes(filename)) {
            return res.status(403).json({ success: false, message: '禁止修改此文件' });
        }

        const filePath = path.join(__dirname, 'data', filename);
        // 将数据格式化写入 JSON（带 2 个空格的缩进）
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        res.json({ success: true, message: `${filename} 保存成功！` });
    } catch (error) {
        console.error('保存失败:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🍽️ 家庭点菜系统已启动！`);
    console.log(`=================================`);
    console.log(`📱 【前台点菜】 http://localhost:${PORT}`);
    console.log(`⚙️  【后台管理】 http://localhost:${PORT}/admin.html`);
    console.log(`=================================\n`);
});