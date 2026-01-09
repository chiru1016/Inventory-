
// State Management
const appState = {
    inventory: [],
    // cart removed
    currentPage: 1,
    rowsPerPage: 8,
    filters: {
        category: 'All',
        stock: 'All',
        search: ''
    }
};

// Initial data placeholder (will be overwritten if empty)
const categories = ['Fruits', 'Vegetables', 'Dairy', 'Snacks', 'Beverages'];
const productNames = {
    'Fruits': ['Apple', 'Banana', 'Orange', 'Grape', 'Strawberry', 'Mango', 'Pineapple', 'Watermelon', 'Kiwi', 'Peach', 'Pear', 'Cherry'],
    'Vegetables': ['Carrot', 'Potato', 'Tomato', 'Onion', 'Broccoli', 'Spinach', 'Cucumber', 'Pepper', 'Garlic', 'Ginger', 'Lettuce', 'Cabbage'],
    'Dairy': ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Cream', 'Ice Cream', 'Paneer', 'Curd'],
    'Snacks': ['Chips', 'Cookies', 'Nuts', 'Popcorn', 'Pretzels', 'Crackers', 'Chocolate', 'Candy'],
    'Beverages': ['Juice', 'Soda', 'Water', 'Tea', 'Coffee', 'Energy Drink', 'Smoothie', 'Milkshake']
};
const categoryImages = {
    'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200',
    'Vegetables': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=200',
    'Dairy': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200',
    'Beverages': 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=200',
    'Snacks': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200'
};

// Charts
let salesChartInstance = null;
let categoryChartInstance = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();

    // Check if we need to auto-generate data (if < 100 items for robust testing)
    if (appState.inventory.length < 100) {
        generateBulkData();
    }

    // Cleanup and Init
    mergeDuplicates();
    populateSuggestions();

    // Final Renders
    renderDashboard();
    renderInventory();
    renderNotifications();
    animateCounters();
});

function loadData() {
    const stored = localStorage.getItem('freshstock_inventory');
    if (stored) {
        try {
            appState.inventory = JSON.parse(stored);

            // Data Migration/Cleanup logic if needed
            appState.inventory = appState.inventory.map(item => ({
                ...item,
                img: item.img || categoryImages[item.category] || 'https://via.placeholder.com/200'
            }));
        } catch (e) {
            console.error("Error parsing local storage", e);
            appState.inventory = [];
        }
    } else {
        appState.inventory = [];
    }
}

function generateBulkData() {
    // Fill up to 100 items
    const currentCount = appState.inventory.length;
    const targetCount = 100;

    if (currentCount >= targetCount) return;

    for (let i = currentCount; i < targetCount; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const nameList = productNames[cat];
        const baseName = nameList[Math.floor(Math.random() * nameList.length)];
        const name = `${baseName} ${Math.floor(Math.random() * 1000)}`; // Ensure uniqueness roughly

        const newItem = {
            id: Date.now() + i,
            name: name,
            category: cat,
            price: +(Math.random() * 10 + 0.5).toFixed(2),
            stock: Math.floor(Math.random() * 200), // 0 to 200
            added: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
            img: categoryImages[cat]
        };
        appState.inventory.push(newItem);
    }
    saveData();
}

function saveData() {
    localStorage.setItem('freshstock_inventory', JSON.stringify(appState.inventory));
}

function setupEventListeners() {
    // Navigation
    // We attach click events to ALL nav items now
    ['dashboard', 'inventory', 'analytics', 'sales-overview'].forEach(view => {
        const el = document.getElementById(`nav-${view}`);
        if (el) {
            el.addEventListener('click', (e) => switchView(e, `view-${view}`));
        }
    });

    // Add Item Form
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);

    // Filters & Search
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        appState.filters.category = e.target.value;
        appState.currentPage = 1;
        renderInventory();
    });

    document.getElementById('stockFilter').addEventListener('change', (e) => {
        appState.filters.stock = e.target.value;
        appState.currentPage = 1;
        renderInventory();
    });

    document.getElementById('globalSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        appState.filters.search = term;
        appState.currentPage = 1;

        // Auto-redirect to inventory view
        if (term.length > 0) {
            const inventoryView = document.getElementById('view-inventory');
            if (inventoryView.classList.contains('d-none')) {
                // Manually trigger switch but without clicking a link event
                document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active-nav-link'));
                const navLink = document.getElementById('nav-inventory');
                if (navLink) navLink.classList.add('active-nav-link');

                document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('d-none'));
                inventoryView.classList.remove('d-none');

                renderInventory();
            }
        }

        renderInventory();
    });

    // Modal Events
    const transactionModal = document.getElementById('transactionsModal');
    if (transactionModal) {
        transactionModal.addEventListener('show.bs.modal', renderTransactionHistory);
    }

    // Admin Profile Form
    const adminForm = document.getElementById('adminProfileForm');
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Settings saved successfully!');
        });
    }

    // Edit Item Form
    const editForm = document.getElementById('editItemForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditItem);
    }

    // Analytics Time Range
    const timeRangeSelect = document.getElementById('analyticsTimeRange');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', () => {
            renderAnalytics();
        });
    }

    // Category Time Range
    const catTimeRangeSelect = document.getElementById('categoryTimeRange');
    if (catTimeRangeSelect) {
        catTimeRangeSelect.addEventListener('change', () => {
            renderAnalytics();
        });
    }
}

function switchView(e, viewId) {
    if (e) e.preventDefault();

    // Update Nav
    document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active-nav-link'));
    if (e && e.target) {
        const link = e.target.closest('.list-group-item');
        if (link) link.classList.add('active-nav-link');
    }

    // Update View visibility
    document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('d-none'));
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('d-none');
        target.classList.add('fade-in');

        if (viewId === 'view-analytics' || viewId === 'view-sales-overview') {
            renderAnalytics();
        }
    }
}

// Refresh App Logic
function refreshApp() {
    location.reload();
    // Kept the reload behavior as requested, but now it will load from localStorage
}

function handleAddItem(e) {
    e.preventDefault();

    const nameInput = document.getElementById('productName');
    const categoryInput = document.getElementById('productCategory');
    const priceInput = document.getElementById('productPrice');
    const stockInput = document.getElementById('productStock');

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const price = parseFloat(priceInput.value);
    const stock = parseInt(stockInput.value);

    // Check if item exists (Updating Stock)
    const existingItem = appState.inventory.find(item =>
        item.name.toLowerCase() === name.toLowerCase()
    );

    if (existingItem) {
        if (confirm(`"${name}" already exists in inventory (Current Stock: ${existingItem.stock}). \n\nClick OK to add ${stock} to the existing stock (Total will be ${existingItem.stock + stock}).\nClick Cancel to modify your entry.`)) {
            existingItem.stock += stock;
            existingItem.price = price; // Update to latest price
            existingItem.category = category; // Update category if changed
            saveData();
            alert(`Stock updated! New stock for ${existingItem.name}: ${existingItem.stock}`);

            mergeDuplicates();
        } else {
            return;
        }
    } else {
        const newItem = {
            id: Date.now(),
            name,
            category,
            price,
            stock,
            added: new Date().toISOString().split('T')[0],
            img: categoryImages[category] || 'https://via.placeholder.com/200'
        };

        appState.inventory.unshift(newItem);
        saveData();
        mergeDuplicates();
        alert('Item added successfully!');
    }

    // Close Modal
    const modalEl = document.getElementById('addItemModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    e.target.reset();

    populateSuggestions();
    location.reload(); // Refresh to update view
}

function mergeDuplicates() {
    const uniqueInventory = [];
    const nameMap = new Map();

    appState.inventory.forEach(item => {
        const normalizedName = item.name.toLowerCase().trim();
        if (nameMap.has(normalizedName)) {
            // Merge
            const existing = nameMap.get(normalizedName);
            existing.stock += item.stock;
            // Keep recent price
            existing.price = item.price;
        } else {
            nameMap.set(normalizedName, item);
            uniqueInventory.push(item);
        }
    });

    appState.inventory = uniqueInventory;
    saveData();
}

function populateSuggestions() {
    const dataList = document.getElementById('productSuggestions');
    if (!dataList) return;

    dataList.innerHTML = '';
    const uniqueNames = new Set(appState.inventory.map(i => i.name));

    // Also add default names
    Object.values(productNames).flat().forEach(n => uniqueNames.add(n));

    uniqueNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

function getFilteredInventory() {
    return appState.inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(appState.filters.search) ||
            item.category.toLowerCase().includes(appState.filters.search);

        const matchesCategory = appState.filters.category === 'All' || item.category === appState.filters.category;

        let matchesStock = true;
        if (appState.filters.stock === 'In Stock') matchesStock = item.stock > 10;
        if (appState.filters.stock === 'Low Stock') matchesStock = item.stock > 0 && item.stock <= 10;
        if (appState.filters.stock === 'Out of Stock') matchesStock = item.stock === 0;

        return matchesSearch && matchesCategory && matchesStock;
    });
}

function renderInventory() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = getFilteredInventory();

    // Pagination Logic
    const start = (appState.currentPage - 1) * appState.rowsPerPage;
    const paginated = filtered.slice(start, start + appState.rowsPerPage);

    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No items found matching your criteria</td></tr>';
        renderPagination(0);
        return;
    }

    paginated.forEach(item => {
        let statusBadge = '';
        if (item.stock === 0) statusBadge = '<span class="badge bg-danger-subtle text-danger">Out of Stock</span>';
        else if (item.stock <= 10) statusBadge = '<span class="badge bg-warning-subtle text-warning">Low Stock</span>';
        else statusBadge = '<span class="badge bg-success-subtle text-success">In Stock</span>';

        // Fix image URL if broken or missing
        const imgUrl = item.img || 'https://via.placeholder.com/200?text=Product';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-4">
                <div class="d-flex align-items-center">
                    <img src="${imgUrl}" class="table-img me-3" alt="${item.name}">
                    <span class="fw-medium">${item.name}</span>
                </div>
            </td>
            <td>${item.category}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>${item.stock}</td>
            <td>${statusBadge}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-light text-primary me-1" onclick="editItem(${item.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-light text-danger" onclick="deleteItem(${item.id})"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination(filtered.length);
}

function renderPagination(totalItems) {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;
    paginationEl.innerHTML = '';

    const totalPages = Math.ceil(totalItems / appState.rowsPerPage);
    if (totalPages <= 1) return;

    // Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${appState.currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
    prevLi.onclick = (e) => { e.preventDefault(); if (appState.currentPage > 1) { appState.currentPage--; renderInventory(); } };
    paginationEl.appendChild(prevLi);

    // Page Numbers (Limit to 5 to avoid overflow)
    let startPage = Math.max(1, appState.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === appState.currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            appState.currentPage = i;
            renderInventory();
        });
        paginationEl.appendChild(li);
    }

    // Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${appState.currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
    nextLi.onclick = (e) => { e.preventDefault(); if (appState.currentPage < totalPages) { appState.currentPage++; renderInventory(); } };
    paginationEl.appendChild(nextLi);
}

function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        appState.inventory = appState.inventory.filter(item => item.id !== id);
        saveData();
        renderInventory();
        renderDashboard();
        renderNotifications();
    }
}

// Analytics Logic
function renderAnalytics() {
    const ctxSales = document.getElementById('salesChart');
    const ctxCat = document.getElementById('categoryChart');

    // Only render if elements exist and are visible (simple check)
    // Only render if needed. Since we split views, we might render them independently.
    // However, the original code relied on both existing. We will now check independently.

    // Prepare Data
    // 1. Category Distribution
    const catCounts = {};
    appState.inventory.forEach(i => {
        catCounts[i.category] = (catCounts[i.category] || 0) + i.stock;
    });

    // 2. Sales Data based on Time Range
    const timeRangeEl = document.getElementById('analyticsTimeRange');
    const rangeSales = timeRangeEl ? timeRangeEl.value : '15days';
    const { labels, data } = getChartData(rangeSales);

    // 3. Category Data based on Time Range
    const catTimeRangeEl = document.getElementById('categoryTimeRange');
    const rangeCategory = catTimeRangeEl ? catTimeRangeEl.value : '15days';
    const { categorySales } = getChartData(rangeCategory);

    // Sales Chart
    if (ctxSales) {
        if (salesChartInstance) salesChartInstance.destroy();
        salesChartInstance = new Chart(ctxSales, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales (₹)',
                    data: data,
                    borderColor: '#11998e',
                    backgroundColor: 'rgba(17, 153, 142, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: labels.length > 30 ? 2 : 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { borderDash: [2, 4], color: '#f0f0f0' },
                        ticks: {
                            callback: function (value, index, values) {
                                return '₹' + value;
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxTicksLimit: 10
                        }
                    }
                }
            }
        });
    }

    // Category Chart - Top Selling
    if (ctxCat) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(ctxCat, {
            type: 'bar',
            data: {
                labels: Object.keys(categorySales),
                datasets: [{
                    label: 'Total Sales (₹)',
                    data: Object.values(categorySales),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal bars
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.x !== null) {
                                    label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.x);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { grid: { display: false } }
                }
            }
        });
    }
}

function getChartData(range) {
    let labels = [];
    let data = [];
    const today = new Date();

    // Mock Category Sales Data
    // Base it on existing categories but randomized magnitude based on range
    const categories = ['Fruits', 'Vegetables', 'Dairy', 'Snacks', 'Beverages'];
    const categorySales = {};

    // Multiplier based on range length (approx days)
    let multiplier = 1;
    if (range === '7days') multiplier = 7;
    if (range === '15days') multiplier = 15;
    if (range === '30days') multiplier = 30;
    if (range === '6months') multiplier = 180;
    if (range === '1year') multiplier = 365;

    categories.forEach(cat => {
        // Random sales between $50 and $200 per day avg
        categorySales[cat] = Math.floor(Math.random() * 150 * multiplier) + (50 * multiplier);
    });

    // Helper to format date
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatMonth = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    if (range === '7days') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            labels.push(formatDate(d));
            data.push(Math.floor(Math.random() * 2000) + 500);
        }
    } else if (range === '15days') {
        for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            labels.push(formatDate(d));
            data.push(Math.floor(Math.random() * 2500) + 800);
        }
    } else if (range === '30days') {
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            labels.push(formatDate(d));
            data.push(Math.floor(Math.random() * 3000) + 1000);
        }
    } else if (range === '6months') {
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(today.getMonth() - i);
            labels.push(formatMonth(d));
            data.push(Math.floor(Math.random() * 15000) + 5000);
        }
    } else if (range === '1year') {
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(today.getMonth() - i);
            labels.push(formatMonth(d));
            data.push(Math.floor(Math.random() * 18000) + 7000);
        }
    }

    return { labels, data, categorySales };
}

function renderDashboard() {
    const totalProducts = appState.inventory.length;
    const totalValue = appState.inventory.reduce((sum, item) => sum + (item.price * item.stock), 0);
    const lowStock = appState.inventory.filter(item => item.stock > 0 && item.stock <= 10).length;
    // Categories count is hardcoded to 5 main categories usually, or count unique
    const categoriesCount = new Set(appState.inventory.map(i => i.category)).size;

    // Update DOM
    const totalProdEl = document.querySelector('[data-target="1240"]');
    if (totalProdEl) {
        // Update data-target for animation (optional) or just text
        totalProdEl.setAttribute('data-target', totalProducts);
        totalProdEl.textContent = totalProducts.toLocaleString();
    }

    const totalValueEl = document.querySelector('[data-target="45230"]');
    if (totalValueEl) {
        const roundedValue = Math.round(totalValue);
        totalValueEl.setAttribute('data-target', roundedValue);
        totalValueEl.textContent = roundedValue.toLocaleString();
    }

    // Update Low Stock counter
    const lowStockEl = document.querySelector('[data-target="15"]');
    if (lowStockEl) {
        lowStockEl.setAttribute('data-target', lowStock);
        lowStockEl.textContent = lowStock.toString();
    }

    // Update Categories counter
    const categoriesEl = document.querySelector('[data-target="8"]');
    if (categoriesEl) {
        categoriesEl.setAttribute('data-target', categoriesCount);
        categoriesEl.textContent = categoriesCount.toString();
    }

    // Recent Transactions (Using top 5 added items as proxy)
    const recentTable = document.getElementById('recent-transactions-body');
    if (!recentTable) return;
    recentTable.innerHTML = '';
    const recentItems = [...appState.inventory].sort((a, b) => new Date(b.added) - new Date(a.added)).slice(0, 5);

    recentItems.forEach(item => {
        let statusColor = item.stock > 0 ? 'text-success' : 'text-danger';
        let statusIcon = item.stock > 0 ? 'bi-check-circle-fill' : 'bi-x-circle-fill';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-4">
                <div class="d-flex align-items-center">
                    <div class="bg-light rounded p-1 me-2"><i class="bi bi-box"></i></div>
                    <span class="fw-medium">${item.name}</span>
                </div>
            </td>
            <td><span class="${statusColor}"><i class="bi ${statusIcon} me-1"></i> ${item.stock > 0 ? 'Restocked' : 'Out'}</span></td>
            <td class="fw-bold">₹${(item.price * 10).toFixed(2)}</td>
            <td class="text-muted small">${item.added}</td>
            <td class="text-end"><button class="btn btn-sm btn-link text-muted"><i class="bi bi-three-dots-vertical"></i></button></td>
        `;
        recentTable.appendChild(tr);
    });
}

function renderTransactionHistory() {
    const tbody = document.getElementById('all-transactions-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Show all items as transactions
    const allItems = [...appState.inventory].sort((a, b) => new Date(b.added) - new Date(a.added));

    allItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name} <small class="text-muted d-block">${item.category}</small></td>
            <td><span class="badge ${item.stock > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}">${item.stock > 0 ? 'In Stock' : 'Out'}</span></td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>${item.added}</td>
        `;
        tbody.appendChild(tr);
    });
}

function generateReport() {
    // Generate simple CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Category,Price,Stock,Date Added,Status\n";

    appState.inventory.forEach(item => {
        const status = item.stock === 0 ? 'Out of Stock' : (item.stock < 10 ? 'Low Stock' : 'In Stock');
        const row = `${item.id},"${item.name}",${item.category},${item.price},${item.stock},${item.added},${status}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_report_freshstock.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateAnalyticsReport() {
    // Generate CSV using the current chart data logic (proxy for backend report)
    const timeRangeEl = document.getElementById('analyticsTimeRange');
    const range = timeRangeEl ? timeRangeEl.value : '15days';

    const { labels, data, categorySales } = getChartData(range);

    let csvContent = "data:text/csv;charset=utf-8,";

    // Header
    csvContent += `Analytics Report - Time Range: ${range}\n\n`;
    csvContent += "Date,Sales Amount (₹)\n";

    // Sales Data
    labels.forEach((label, index) => {
        csvContent += `"${label}",${data[index]}\n`;
    });

    csvContent += "\nCategory Performance\n";
    csvContent += "Category,Sales (₹)\n";
    Object.keys(categorySales).forEach(cat => {
        csvContent += `"${cat}",${categorySales[cat]}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_report_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateCategoryReport() {
    const timeRangeEl = document.getElementById('categoryTimeRange');
    const range = timeRangeEl ? timeRangeEl.value : '15days';

    const { categorySales } = getChartData(range);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Category Performance Report - Time Range: ${range}\n\n`;
    csvContent += "Category,Sales (₹)\n";

    Object.keys(categorySales).forEach(cat => {
        csvContent += `"${cat}",${categorySales[cat]}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `category_report_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function animateCounters() {
    // Basic counter animation
    const counters = document.querySelectorAll('.count-up');
    counters.forEach(counter => {
        const targetText = counter.getAttribute('data-target') || counter.innerText.replace(/,/g, '');
        const target = +targetText;
        if (isNaN(target)) return;

        let count = 0;
        const inc = target / 30;

        // Use a simple timer
        const timer = setInterval(() => {
            count += inc;
            if (count >= target) {
                counter.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                counter.textContent = Math.ceil(count).toLocaleString();
            }
        }, 30);
    });
}

function renderNotifications() {
    // Mock notifications
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;

    list.innerHTML = '';
    let alertCount = 0;

    appState.inventory.forEach(item => {
        if (item.stock <= 10) {
            alertCount++;
            const status = item.stock === 0 ? 'Out of Stock' : 'Low Stock';
            const color = item.stock === 0 ? 'danger' : 'warning';

            const itemHtml = `
            <li class="p-3 border-bottom bg-opacity-10 bg-${color}">
                <div class="d-flex justify-content-between">
                    <strong>${item.name}</strong>
                    <span class="badge bg-${color}">${status}</span>
                </div>
                <small class="text-muted">Stock: ${item.stock}</small>
            </li>
            `;
            list.innerHTML += itemHtml;
        }
    });

    if (alertCount === 0) {
        list.innerHTML = `<li class="p-4 text-center text-muted small">No new notifications</li>`;
        if (badge) badge.classList.add('d-none');
    } else {
        if (badge) {
            badge.classList.remove('d-none');
            // badge.textContent = alertCount; // Dots style
        }
    }
}

function editItem(id) {
    const item = appState.inventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById('editItemId').value = item.id;
    document.getElementById('editProductCategory').value = item.category;
    document.getElementById('editProductPrice').value = item.price;
    document.getElementById('editProductStock').value = item.stock;

    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    modal.show();
}

function handleEditItem(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editItemId').value);
    const category = document.getElementById('editProductCategory').value;
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const stock = parseInt(document.getElementById('editProductStock').value);

    // Find and update the item
    const item = appState.inventory.find(i => i.id === id);
    if (!item) {
        alert('Item not found!');
        return;
    }

    // Update the item properties
    item.category = category;
    item.price = price;
    item.stock = stock;

    // Update image if category changed
    if (item.img === categoryImages[item.category] || !item.img) {
        item.img = categoryImages[category];
    }

    // Save changes
    saveData();

    // Close modal
    const modalEl = document.getElementById('editItemModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    // Show success message
    alert(`${item.name} updated successfully!`);

    // Refresh views
    refreshApp();
}

// Global Exports
window.refreshApp = refreshApp;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.generateReport = generateReport;
window.generateAnalyticsReport = generateAnalyticsReport;
