const { createApp, ref, computed, onMounted, watch, onUnmounted } = Vue;

createApp({
    setup() {
        const isCartOpen = ref(false);
        const isSettingsOpen = ref(false);
        const isDarkMode = ref(false);
        const isMobile = ref(window.innerWidth <= 768); 
        
        const dishes = ref([]);
        const categories = ref([]);
        const ingredients = ref([]);
        const inventory = ref([]);
        const flavorOptions = ref([]);
        const ingredientMappings = ref([]);

        const selectedCategory = ref('');
        const cart = ref([]);
        const cartRemark = ref('');
        const selectedDish = ref(null);
        const currentDishFlavors = ref({});

        const settings = ref({ allowOutOfStock: true, allowFlavorConflict: false, dislikedTags: [] });

        const toastMsg = ref('');
        const toastVisible = ref(false);
        let toastTimer = null;
        const showToast = (msg, duration = 2500) => {
            toastMsg.value = msg;
            toastVisible.value = true;
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(() => { toastVisible.value = false; }, duration);
        };

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

        const loadData = async () => {
            try {
                const [dRes, cRes, iRes, invRes, fRes, mRes] = await Promise.all([
                    fetch('data/dishes.json').then(r => r.json()), fetch('data/categories.json').then(r => r.json()),
                    fetch('data/ingredients.json').then(r => r.json()), fetch('data/inventory.json').then(r => r.json()),
                    fetch('data/flavorOptionsMapping.json').then(r => r.json()), fetch('data/ingredientMapping.json').then(r => r.json())
                ]);

                dishes.value = dRes.dishes; categories.value = cRes.categories; 
                ingredients.value = iRes.ingredients; inventory.value = invRes.inventory;
                flavorOptions.value = fRes.flavorOptions; ingredientMappings.value = mRes.ingredientMappings;

                if (categories.value.length > 0) selectedCategory.value = categories.value[0].name;

                const localSettings = localStorage.getItem('nanshanSettings');
                if (localSettings) settings.value = JSON.parse(localSettings);
                const localCart = localStorage.getItem('nanshanCart');
                if (localCart) cart.value = JSON.parse(localCart);
                const localRemark = localStorage.getItem('nanshanCartRemark');
                if (localRemark) cartRemark.value = localRemark;
            } catch (error) { console.error("加载数据失败", error); }
        };

        onMounted(() => {
            initTheme();
            window.addEventListener('resize', updateDeviceType);
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('nanshanTheme')) {
                    isDarkMode.value = e.matches;
                    document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light');
                }
            });
            loadData();
        });
        
        onUnmounted(() => { window.removeEventListener('resize', updateDeviceType); });

        watch(settings, (newVal) => localStorage.setItem('nanshanSettings', JSON.stringify(newVal)), { deep: true });
        watch(cart, (newVal) => localStorage.setItem('nanshanCart', JSON.stringify(newVal)), { deep: true });
        watch(cartRemark, (newVal) => localStorage.setItem('nanshanCartRemark', newVal));

        const getCategoryIcon = catName => (categories.value.find(c => c.name === catName) || {}).icon || '🍽️';
        const getIngredientDisplayName = ingName => (ingredients.value.find(i => i.name === ingName) || {}).displayName || ingName;
        const getFlavorDisplayName = fName => (flavorOptions.value.find(o => o.name === fName) || {}).displayName || fName;
        const getFlavorOptionsList = fName => (flavorOptions.value.find(o => o.name === fName) || {}).options || [];
        const getFlavorType = fName => (flavorOptions.value.find(o => o.name === fName) || {}).type || 'single';

        const isDishAvailable = (dish) => {
            return !dish.ingredients.some(ingName => {
                const invItem = inventory.value.find(i => i.name === ingName);
                return invItem && invItem.quantity <= 0;
            });
        };

        const getDislikedIngredients = computed(() => {
            let forbidden = new Set();
            settings.value.dislikedTags.forEach(tag => {
                const mapping = ingredientMappings.value.find(m => m.tag === tag);
                if (mapping) mapping.relatedIngredients.forEach(i => forbidden.add(i));
            });
            return forbidden;
        });

        const hasConflict = dish => dish.ingredients.some(ing => getDislikedIngredients.value.has(ing));

        const filteredDishes = computed(() => {
            return dishes.value.filter(dish => {
                if (dish.categoryName !== selectedCategory.value) return false;
                if (!settings.value.allowFlavorConflict && hasConflict(dish)) return false;
                return true;
            });
        });

        const cartHasConflict = computed(() => cart.value.some(item => hasConflict(item.dish)));

        const toggleSettings = () => isSettingsOpen.value = !isSettingsOpen.value;
        const saveSettings = () => {
            isSettingsOpen.value = false;
            if (cartHasConflict.value && !settings.value.allowFlavorConflict) isCartOpen.value = true;
        };

        const toggleTwoOption = flavorKey => {
            const opts = getFlavorOptionsList(flavorKey);
            currentDishFlavors.value[flavorKey] = currentDishFlavors.value[flavorKey] === opts[0] ? opts[1] : opts[0];
        };

        const toggleMultiple = (flavorKey, opt) => {
            if (!Array.isArray(currentDishFlavors.value[flavorKey])) currentDishFlavors.value[flavorKey] = [];
            const arr = currentDishFlavors.value[flavorKey];
            const idx = arr.indexOf(opt);
            if (idx > -1) arr.splice(idx, 1);
            else arr.push(opt);
        };

        const formatFlavor = val => Array.isArray(val) ? (val.length === 0 ? '无' : val.join('、')) : val;

        const openDishDetail = (dish) => {
            if (hasConflict(dish) && !settings.value.allowFlavorConflict) {
                if(!confirm("该菜品包含您的忌口食材，是否仍要查看？")) return;
            }
            selectedDish.value = dish;
            let defaultFlavors = {};
            for (let key in dish.flavorOptions) {
                const fType = getFlavorType(key);
                const mappingDefault = dish.flavorOptions[key].default;
                defaultFlavors[key] = fType === 'multiple' ? (Array.isArray(mappingDefault) ? [...mappingDefault] : []) : mappingDefault;
            }
            currentDishFlavors.value = defaultFlavors;
        };

        const confirmAddToCart = () => {
            cart.value.push({ dish: selectedDish.value, flavors: { ...currentDishFlavors.value }, quantity: 1 });
            selectedDish.value = null;
        };

        const toggleCart = () => isCartOpen.value = !isCartOpen.value;

        const updateCartQuantity = (index, delta) => {
            cart.value[index].quantity += delta;
            if (cart.value[index].quantity <= 0) cart.value.splice(index, 1);
        };

        const cartTotalItems = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));
        const cartTotalPrice = computed(() => cart.value.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0));

        const checkout = () => {
            if (cart.value.length === 0) return showToast("购物车是空的");
            if (cartHasConflict.value && !settings.value.allowFlavorConflict) return showToast("购物车中存在忌口菜品，无法提交");

            let orderText = `--- 家庭点单 ---\n`;
            if (cartRemark.value.trim()) orderText += `【备注】：${cartRemark.value.trim()}\n---\n`;

            cart.value.forEach(item => {
                let flavorText = Object.entries(item.flavors).map(([k, v]) => `${getFlavorDisplayName(k)}:${formatFlavor(v)}`).join(' | ');
                orderText += `${item.dish.displayName} x${item.quantity} ( ${flavorText} )\n`;
            });
            orderText += `---\n总计：¥${cartTotalPrice.value}`;

            const orderSnapshot = [...cart.value.map(item => ({
                dishId: item.dish.id,
                displayName: item.dish.displayName,
                price: item.dish.price,
                quantity: item.quantity,
                flavors: item.flavors
            }))];
            const orderTotal = cartTotalPrice.value;
            const orderRemark = cartRemark.value.trim();

            cart.value = [];
            cartRemark.value = '';
            isCartOpen.value = false;

            fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: orderSnapshot, totalPrice: orderTotal, remark: orderRemark })
            }).catch(() => {});

            if (navigator.clipboard) {
                navigator.clipboard.writeText(orderText).then(() => {
                    showToast('已复制到剪贴板 ✓');
                }).catch(() => {
                    showToast('已提交订单');
                });
            } else {
                showToast('已提交订单');
            }
        };

        const handleImageError = e => { e.target.style.display = 'none'; e.target.outerHTML = '<div class="dish-img-placeholder">🍽️</div>'; };

        return {
            isDarkMode, toggleTheme, isMobile,
            categories, ingredientMappings, settings, selectedCategory, filteredDishes,
            getCategoryIcon, getIngredientDisplayName, getFlavorDisplayName, getFlavorOptionsList, getFlavorType, formatFlavor,
            toggleTwoOption, toggleMultiple, isDishAvailable, hasConflict, cartHasConflict,
            isSettingsOpen, toggleSettings, saveSettings, cart, cartRemark, isCartOpen, toggleCart, updateCartQuantity, cartTotalItems, cartTotalPrice,
            selectedDish, currentDishFlavors, openDishDetail, confirmAddToCart, checkout, handleImageError,
            toastMsg, toastVisible
        };
    }
}).mount('#app');