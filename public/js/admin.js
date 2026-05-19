const { createApp, ref, computed, onMounted, watch, onUnmounted } = Vue;

createApp({
    setup() {
        const isDirty = ref(false);
        const currentTab = ref('dishes');
        const isDarkMode = ref(false); 
        const isMobile = ref(window.innerWidth <= 768); // 响应式状态侦听

        const db = ref({ dishes: [], inventory: [], ingredients: [], categories: [], flavorOptions: [], ingredientMapping: [], orders: [] });
        const filters = ref({
            dishes: { search: '', category: '', ingredient: '' }, inventory: { search: '', tag: '', status: '' },
            ingredients: { search: '', tag: '' }, categories: { search: '' }, flavorOptions: { search: '' }, ingredientMapping: { search: '' }, orders: { search: '' }
        });
        const selectedItems = ref([]);

        // 窗口尺寸变更侦听
        const updateDeviceType = () => { isMobile.value = window.innerWidth <= 768; };

        const initTheme = () => {
            const savedTheme = localStorage.getItem('nanshanTheme');
            if (savedTheme) { isDarkMode.value = savedTheme === 'dark'; } 
            else { isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches; }
            document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light');
        };

        const toggleTheme = () => {
            isDarkMode.value = !isDarkMode.value;
            document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light');
            localStorage.setItem('nanshanTheme', isDarkMode.value ? 'dark' : 'light');
        };

        const tabsConfig = [
            {
                id: 'dishes', name: '菜品', icon: '🍲', title: '菜品管理',
                columns: [{ key: 'id', label: 'ID', width: '80px' }, { key: 'displayName', label: '名称' }, { key: 'categoryName', label: '分类' }, { key: 'price', label: '价格' }, { key: 'ingredients', label: '食材', type: 'array' }, { key: 'flavorOptions', label: '配置', type: 'json' }],
                formFields: [{ key: 'id', label: '唯一ID', type: 'text', required: true }, { key: 'displayName', label: '名称', type: 'text', required: true }, { key: 'categoryName', label: '分类', type: 'categorySelect', required: true }, { key: 'price', label: '价格', type: 'number', required: true }, { key: 'image', label: '图片(可选)', type: 'text' }, { key: 'description', label: '描述', type: 'textarea', fullWidth: true }, { key: 'ingredients', label: '包含食材', type: 'ingredientMultiSelect', fullWidth: true }, { key: 'flavorOptions', label: '口味配置 (JSON)', type: 'jsonRaw', fullWidth: true }],
                emptyTemplate: () => ({ id: `dish_${Date.now()}`, displayName: '', categoryName: '', price: 0, image: '', description: '', ingredients: [], flavorOptions: {} })
            },
            {
                id: 'inventory', name: '库存', icon: '📦', title: '库存管理',
                columns: [{ key: 'name', label: '标识' }, { key: 'displayName', label: '名称', type: 'computed_ing_name' }, { key: 'quantity', label: '库存' }, { key: 'unit', label: '单位' }, { key: 'threshold', label: '预警' }, { key: 'status', label: '状态', type: 'status' }],
                formFields: [{ key: 'name', label: '食材标识', type: 'text', required: true }, { key: 'quantity', label: '数量', type: 'number', required: true }, { key: 'unit', label: '单位', type: 'text', required: true }, { key: 'threshold', label: '预警', type: 'number', required: true }],
                emptyTemplate: () => ({ name: '', quantity: 0, unit: 'g', threshold: 0 })
            },
            {
                id: 'ingredients', name: '食材库', icon: '🥬', title: '食材主数据',
                columns: [{ key: 'name', label: '标识' }, { key: 'displayName', label: '名称' }, { key: 'tag', label: '标签' }],
                formFields: [{ key: 'name', label: '标识', type: 'text', required: true }, { key: 'displayName', label: '名称', type: 'text', required: true }, { key: 'tag', label: '标签', type: 'text' }],
                emptyTemplate: () => ({ name: '', displayName: '', tag: '' })
            },
            {
                id: 'categories', name: '分类', icon: '🏷️', title: '分类管理',
                columns: [{ key: 'name', label: '标识' }, { key: 'displayName', label: '名称' }, { key: 'icon', label: '图标' }],
                formFields: [{ key: 'name', label: '标识', type: 'text', required: true }, { key: 'displayName', label: '名称', type: 'text', required: true }, { key: 'icon', label: '图标', type: 'text' }],
                emptyTemplate: () => ({ name: '', displayName: '', icon: '🍽️' })
            },
            {
                id: 'flavorOptions', name: '口味配置', icon: '🧂', title: '口味预设',
                columns: [{ key: 'name', label: '标识' }, { key: 'displayName', label: '名称' }, { key: 'type', label: '类型' }, { key: 'options', label: '选项', type: 'array' }],
                formFields: [{ key: 'name', label: '标识', type: 'text', required: true }, { key: 'displayName', label: '名称', type: 'text', required: true }, { key: 'type', label: '类型', type: 'flavorTypeSelect', required: true }, { key: 'options', label: '选项 (JSON)', type: 'jsonRaw', fullWidth: true }, { key: 'default', label: '默认值 (JSON)', type: 'jsonRaw', fullWidth: true }],
                emptyTemplate: () => ({ name: '', displayName: '', type: 'single', options: [], default: "" })
            },
            {
                id: 'ingredientMapping', name: '忌口', icon: '🚫', title: '忌口映射',
                columns: [{ key: 'tag', label: '标签' }, { key: 'displayName', label: '名称' }, { key: 'relatedIngredients', label: '波及食材', type: 'array' }],
                formFields: [{ key: 'tag', label: '标签', type: 'text', required: true }, { key: 'displayName', label: '名称', type: 'text', required: true }, { key: 'relatedIngredients', label: '波及食材', type: 'ingredientMultiSelect', fullWidth: true }],
                emptyTemplate: () => ({ tag: '', displayName: '', relatedIngredients: [] })
            },
            {
                id: 'orders', name: '订单', icon: '📋', title: '订单历史',
                columns: [
                    { key: 'id', label: '订单号', width: '160px' },
                    { key: 'createdAt', label: '提交时间', width: '160px' },
                    { key: 'items', label: '菜品', type: 'orderItems' },
                    { key: 'totalPrice', label: '金额', width: '80px' },
                    { key: 'status', label: '状态', type: 'orderStatus', width: '100px' },
                    { key: 'remark', label: '备注' }
                ],
                formFields: [
                    { key: 'status', label: '状态', type: 'orderStatusSelect', required: true }
                ],
                emptyTemplate: () => ({ status: 'pending' })
            }
        ];

        const currentTabObj = computed(() => tabsConfig.find(t => t.id === currentTab.value));
        watch(currentTab, () => { selectedItems.value = []; dragIndex.value = null; });

        const loadAllData = async () => {
            try {
                const results = await Promise.all([
                    fetch('data/dishes.json').then(r => r.json()), fetch('data/inventory.json').then(r => r.json()),
                    fetch('data/ingredients.json').then(r => r.json()), fetch('data/categories.json').then(r => r.json()),
                    fetch('data/flavorOptionsMapping.json').then(r => r.json()), fetch('data/ingredientMapping.json').then(r => r.json()),
                    fetch('data/orders.json').then(r => r.json()).catch(() => ({ orders: [] }))
                ]);
                db.value.dishes = results[0].dishes || []; db.value.inventory = results[1].inventory || [];
                db.value.ingredients = results[2].ingredients || []; db.value.categories = results[3].categories || [];
                db.value.flavorOptions = results[4].flavorOptions || []; db.value.ingredientMapping = results[5].ingredientMappings || [];
                db.value.orders = results[6].orders || [];
                setTimeout(() => { isDirty.value = false; }, 100);
            } catch (err) { alert("读取失败，请确保服务正常！\n" + err.message); }
        };

        onMounted(() => {
            initTheme();
            window.addEventListener('resize', updateDeviceType);
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('nanshanTheme')) {
                    isDarkMode.value = e.matches; document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light');
                }
            });
            loadAllData();
            window.onbeforeunload = () => isDirty.value ? "确定要离开吗？" : null;
        });

        onUnmounted(() => { window.removeEventListener('resize', updateDeviceType); });

        watch(db, () => { isDirty.value = true; }, { deep: true });

        const saveToServer = async () => {
            const filesToSave = [
                { file: 'dishes.json', key: 'dishes' }, { file: 'inventory.json', key: 'inventory' }, { file: 'ingredients.json', key: 'ingredients' },
                { file: 'categories.json', key: 'categories' }, { file: 'flavorOptionsMapping.json', key: 'flavorOptions' }, { file: 'ingredientMapping.json', key: 'ingredientMapping', exportKey: 'ingredientMappings' },
                { file: 'orders.json', key: 'orders' }
            ];
            let successCount = 0;
            for (let item of filesToSave) {
                try {
                    const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: item.file, data: { [item.exportKey || item.key]: db.value[item.key] } }) });
                    if (res.ok) successCount++;
                } catch (e) {}
            }
            if (successCount === filesToSave.length) { isDirty.value = false; alert("✅ 保存成功！"); } 
            else alert("❌ 部分保存失败。");
        };

        const ingredientTags = computed(() => Array.from(new Set(db.value.ingredients.map(i => i.tag).filter(Boolean))));
        const getIngredientDisplayName = (name) => (db.value.ingredients.find(i => i.name === name) || {}).displayName || name;
        const getInventoryStatus = (item) => {
            if (item.quantity <= 0) return { key: 'danger', text: '已售罄', class: 'danger' };
            if (item.quantity <= item.threshold) return { key: 'warn', text: '需补货', class: 'warn' };
            return { key: 'good', text: '充足', class: 'good' };
        };

        const getOrderItemsSummary = (items) => {
            if (!items || items.length === 0) return '无';
            return items.map(i => `${i.displayName || '?'} x${i.quantity || 1}`).join('、');
        };
        const getOrderStatusInfo = (status) => {
            const map = { pending: { text: '待处理', class: 'warn' }, completed: { text: '已完成', class: 'good' }, cancelled: { text: '已取消', class: 'danger' } };
            return map[status] || { text: status, class: '' };
        };

        const isListFiltered = computed(() => Object.values(filters.value[currentTab.value] || {}).some(val => val !== ''));

        const filteredData = computed(() => {
            let list = db.value[currentTab.value] || [];
            const f = filters.value[currentTab.value];
            if (f.search) { const q = f.search.toLowerCase(); list = list.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(q))); }
            if (currentTab.value === 'dishes') {
                if (f.category) list = list.filter(d => d.categoryName === f.category);
                if (f.ingredient) list = list.filter(d => d.ingredients && d.ingredients.includes(f.ingredient));
            } else if (currentTab.value === 'inventory') {
                if (f.tag) list = list.filter(inv => (db.value.ingredients.find(i => i.name === inv.name) || {}).tag === f.tag);
                if (f.status) list = list.filter(inv => getInventoryStatus(inv).key === f.status);
            } else if (currentTab.value === 'ingredients') {
                if (f.tag) list = list.filter(ing => ing.tag === f.tag);
            }
            return list;
        });

        const isAllSelected = computed(() => filteredData.value.length > 0 && selectedItems.value.length === filteredData.value.length);
        const toggleSelectAll = (e) => { selectedItems.value = e.target.checked ? filteredData.value.map(i => i) : []; };
        const batchDelete = () => {
            if (!confirm(`确定删除这 ${selectedItems.value.length} 项吗？`)) return;
            const list = db.value[currentTab.value];
            selectedItems.value.forEach(item => { const idx = list.indexOf(item); if (idx !== -1) list.splice(idx, 1); });
            selectedItems.value = [];
        };

        const dragIndex = ref(null); const dragOverIndex = ref(null);
        const onDragStart = (index) => { if (isListFiltered.value) return; dragIndex.value = index; };
        const onDragOver = (index) => { if (isListFiltered.value) return; dragOverIndex.value = index; };
        const onDrop = (index) => {
            if (isListFiltered.value) return; dragOverIndex.value = null;
            if (dragIndex.value === null || dragIndex.value === index) return;
            const list = db.value[currentTab.value];
            const draggedItem = list.splice(dragIndex.value, 1)[0];
            list.splice(index, 0, draggedItem);
            dragIndex.value = null;
        };

        const exportAllJSON = () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                dishes: db.value.dishes, inventory: db.value.inventory, ingredients: db.value.ingredients,
                categories: db.value.categories, flavorOptions: db.value.flavorOptions, ingredientMappings: db.value.ingredientMapping,
                orders: db.value.orders
            }, null, 2));
            const a = document.createElement('a'); a.href = dataStr; a.download = `backup_${new Date().getTime()}.json`; a.click();
        };

        const importJSON = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const imported = JSON.parse(evt.target.result);
                    if(imported.dishes) db.value.dishes = imported.dishes; if(imported.inventory) db.value.inventory = imported.inventory;
                    if(imported.ingredients) db.value.ingredients = imported.ingredients; if(imported.categories) db.value.categories = imported.categories;
                    if(imported.flavorOptions) db.value.flavorOptions = imported.flavorOptions; if(imported.ingredientMappings) db.value.ingredientMapping = imported.ingredientMappings;
                    if(imported.orders) db.value.orders = imported.orders;
                    alert("✅ 导入成功！"); isDirty.value = true;
                } catch(err) { alert("❌ 格式不合法"); }
            };
            reader.readAsText(file); e.target.value = '';
        };

        const isModalOpen = ref(false); const editingItem = ref({}); let editingOriginalRef = null;
        const openEditModal = (item) => {
            if (item) { editingItem.value = JSON.parse(JSON.stringify(item)); editingOriginalRef = item; } 
            else { editingItem.value = currentTabObj.value.emptyTemplate(); editingItem.value._isNew = true; editingOriginalRef = null; }
            isModalOpen.value = true;
        };
        const closeEditModal = () => { isModalOpen.value = false; editingItem.value = {}; };
        const saveModalItem = () => {
            const list = db.value[currentTab.value];
            const reqFields = currentTabObj.value.formFields.filter(f => f.required);
            for(let f of reqFields) if (editingItem.value[f.key] === '' || editingItem.value[f.key] === undefined) return alert(`[${f.label}] 必填！`);
            if (editingItem.value._isNew) { delete editingItem.value._isNew; list.unshift(editingItem.value); } 
            else { const idx = list.indexOf(editingOriginalRef); if (idx !== -1) list.splice(idx, 1, editingItem.value); }
            closeEditModal();
        };
        const handleJsonInput = (key, val) => { try { editingItem.value[key] = JSON.parse(val); } catch (e) {} };

        return {
            isDarkMode, toggleTheme, isMobile,
            tabs: tabsConfig, currentTab, currentTabObj, db, filters, isListFiltered,
            isDirty, filteredData, ingredientTags, saveToServer, exportAllJSON, importJSON,
            getInventoryStatus, getIngredientDisplayName, getOrderItemsSummary, getOrderStatusInfo, selectedItems, isAllSelected, toggleSelectAll, batchDelete,
            dragOverIndex, onDragStart, onDragOver, onDrop, isModalOpen, editingItem, openEditModal, closeEditModal, saveModalItem, handleJsonInput
        };
    }
}).mount('#admin-app');