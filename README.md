***


# 🍲 家庭点菜系统 (Home Ordering System)

一个专为家庭和小型聚会打造的极简、现代、全响应式点菜与库存管理系统。

本项目采用**纯前端驱动 + 极轻量级 Node.js 本地文件存储**架构，无需配置 Webpack/Vite 等构建工具，无需数据库，只需 Node.js 环境即可一键启动。非常适合部署在家庭局域网（如树莓派、NAS 或普通 PC）中，供家人手机扫码点菜，主厨在后台统一管理。

---

## ✨ 核心特性

### 📱 前台：极简点菜体验
* **零学习成本**：清爽的菜单界面，支持按分类快速定位菜品。
* **智能忌口过滤**：用户可设置个人忌口（如不吃香菜、海鲜过敏），系统会自动拦截包含冲突食材的菜品，并给出显眼提示。
* **高度定制口味**：支持配置单选（如辣度）、多选（如加料）、甚至 iOS 风格的二选一开关（如加/不加葱）。
* **一键复制订单**：购物车点餐完毕后，一键生成清晰的纯文本订单（支持整单备注），方便发送到家庭微信群。
* **无缝持久化**：用户的购物车、偏好设置自动保存在浏览器本地，刷新不丢失。

### ⚙️ 后台：强大的数据管理台
* **物理隔离安全**：前台与后台分为独立的页面（`index.html` 和 `admin.html`），防止家人误触修改库存。
* **动态可视化表单**：自动读取现有 JSON，提供针对各种数据类型（文本、数字、数组、JSON 配置）的直观编辑界面。
* **拖拽排序**：分类目录支持直观的拖拽重新排序。
* **多维深度筛选**：支持按分类、状态（充足/缺货）、包含食材等多种维度交叉筛选列表。
* **自动化库存推算**：根据食材数量和设定的阈值，自动高亮“充足”、“需补货”或“已售罄”状态。
* **全量数据导入导出**：一键备份整个系统的 JSON 数据至本地，或从历史备份中恢复。

### 🎨 现代化 UI 与响应式设计
* **自适应全平台**：深度优化的 CSS，在 PC、平板和手机端均有极佳的交互体验（自动折叠导航、横向滑动列表等）。
* **日间/夜间模式**：系统内置 ☀️/🌙 主题切换，支持跟随系统级偏好（Dark Mode）自动适配，保护视力。

---

## 🛠️ 技术栈

* **前端框架**：[Vue 3](https://vuejs.org/) (CDN 引入，无需编译)
* **UI / 样式**：纯原生 CSS 3 (CSS Variables, Flexbox, CSS Grid)
* **字体库**：Google Fonts (Noto Sans SC, Noto Serif SC)
* **后端服务**：[Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) (仅用作静态服务器与本地 JSON 读写)
* **数据存储**：本地 JSON 文件 (`data/` 目录) + 浏览器 `localStorage`

---

## 🚀 快速启动

### 1. 环境准备
请确保你的电脑或服务器上已安装 [Node.js](https://nodejs.org/zh-cn/) (推荐 v14 以上版本)。

### 2. 安装依赖
在项目根目录下，打开终端（命令行），运行以下命令安装 Express 框架：
```bash
npm install express
```

### 3. 启动系统
在终端中运行：
```bash
node server.js
```

启动成功后，终端会打印如下信息：
```text
🍽️ 家庭点菜系统已启动！
=================================
📱 【前台点菜】 http://localhost:3000
⚙️  【后台管理】 http://localhost:3000/admin.html
=================================
```

### 4. 局域网访问（供家人使用）
1. 找出你运行 Node.js 电脑的局域网 IP 地址（如 `192.168.1.100`）。
2. 让家人在手机浏览器中输入 `http://192.168.1.100:3000` 即可开始点菜！

---

### 5. 数据安全与升级

您的菜品、库存等自定义数据存储在 `public/data/`，该目录**不受 git 跟踪**。

- ✅ **首次运行**：`server.js` 会自动检查数据文件，缺失时从 `data-templates/` 复制默认配置，**无需手动初始化**
- ✅ **安全升级**：通过 `git pull` 拉取更新时，您已修改的数据文件**不会被覆盖或产生冲突**
- ✅ **重置默认**：如需恢复出厂设置，只需删除 `public/data/` 目录后重启服务器即可
- 💡 项目更新可能新增默认字段，后续版本会提供"应用模板更新"的后台功能

---

## 📁 目录结构

```text
/
├── server.js              # Node.js 轻量服务器（负责提供网页和保存 JSON）
├── index.html             # 面向家人的前台点菜页面
├── admin.html             # 面向厨师/管理员的后台管理页面
├── css/
│   └── style.css          # 全局样式表（包含响应式和夜间模式）
├── js/
│   ├── app.js             # 前台 Vue 3 业务逻辑
│   └── admin.js           # 后台 Vue 3 业务逻辑
├── data/                  # 运行时数据（不受 git 跟踪，更新代码库不会覆盖）
│   ├── dishes.json        # 菜品清单
│   ├── inventory.json     # 实时库存数据
│   ├── ingredients.json   # 食材基础库
│   ├── categories.json    # 菜品分类目录
│   ├── flavorOptionsMapping.json # 全局口味预设配置
│   └── ingredientMapping.json    # 忌口与关联食材映射规则
├── data-templates/        # 默认模板（git 跟踪，首次运行自动初始化）
│   ├── categories.json    # 分类默认配置
│   ├── dishes.json        # 菜品默认配置
│   ├── flavorOptionsMapping.json # 口味预设默认配置
│   ├── ingredientMapping.json    # 忌口映射默认配置
│   ├── ingredients.json   # 食材库默认配置
│   └── inventory.json     # 库存默认配置
└── images/                # 存放菜品图片的目录 (文件名需与 dishes.json 对应)
```

---

## ⚙️ 核心 JSON 配置文件说明

后台管理系统本质上是对以下 JSON 文件的可视化增删改查。如果需要手动修改或了解数据结构，请参考以下说明：

### 1. `categories.json` (分类)
定义前台左侧的导航分类，支持拖拽排序。
```json
{ "name": "hot_dishes", "displayName": "热炒", "icon": "🥘" }
```

### 2. `ingredients.json` (食材库)
所有在系统中流通的“基础物质”。
```json
{ "name": "beef_slice", "displayName": "肥牛卷", "tag": "肉类" }
```

### 3. `inventory.json` (库存表)
监控食材库中每种物质的当前存量。
```json
{ "name": "beef_slice", "quantity": 500, "unit": "g", "threshold": 200 }
```
*(当 `quantity` 为 0 时，依赖此食材的菜品将在前台被标记为“缺货”并禁止点单)*

### 4. `flavorOptionsMapping.json` (口味预设)
定义可供菜品绑定的口味类型。支持 `single` (单选，含 iOS 滑动开关) 和 `multiple` (多选数组)。
```json
{
  "name": "spicyLevel",
  "displayName": "辣度",
  "type": "single",
  "options": ["不辣", "微辣", "中辣"]
}
```

### 5. `ingredientMapping.json` (忌口映射)
定义过敏原或个人偏好。
```json
{
  "tag": "no_pork",
  "displayName": "不吃猪肉",
  "relatedIngredients": ["pork_belly", "minced_pork"]
}
```

### 6. `dishes.json` (菜品表)
整合以上所有基础数据。
```json
{
  "id": "dish_01",
  "categoryName": "hot_dishes",
  "displayName": "小炒肉",
  "price": 38,
  "image": "xiaocaorou.jpg", 
  "ingredients": ["pork_belly", "green_pepper"],
  "flavorOptions": {
    "spicyLevel": { "default": "中辣" }
  }
}
```

---

## 👨‍💻 开发者备忘录

* **图片资源**：如果在 `images/` 目录下找不到 `dishes.json` 中配置的图片，系统会自动 fallback 显示该菜品所属分类的 emoji 作为占位图。
* **状态丢失问题**：如果你发现刚编辑的后台数据刷新后丢失，请检查浏览器控制台，确保 `node server.js` 正在运行，且终端没有报错。
* **扩展新模块**：若要增加新的 JSON 管理模块，只需在 `js/admin.js` 的 `tabsConfig` 数组中添加对应的列配置和表单字段即可，UI 将自动动态生成。

---

**Enjoy your family meals! 🥘👨‍👩‍👧‍👦**
