/* ═══════════════════════════════════════════════════════
   DASHBOARD MODULE
   ═══════════════════════════════════════════════════════ */

const DashboardModule = {
    async render() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-dashboard-fill"></i> Dashboard</h1>
                    <span class="text-muted">Welcome back! Here's your business overview</span>
                </div>

                <div class="stats-grid" id="dashStats">
                    <div class="stat-card"><div class="stat-label">Loading...</div><div class="stat-value loading">--</div></div>
                    <div class="stat-card"><div class="stat-label">Loading...</div><div class="stat-value loading">--</div></div>
                    <div class="stat-card"><div class="stat-label">Loading...</div><div class="stat-value loading">--</div></div>
                    <div class="stat-card"><div class="stat-label">Loading...</div><div class="stat-value loading">--</div></div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title"><i class="ri-money-rupee-circle-fill"></i> Payment Breakdown</span>
                        </div>
                        <div id="paymentBreakdown">Loading...</div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title"><i class="ri-alert-fill"></i> Low Stock Alerts</span>
                        </div>
                        <div id="lowStockList" style="max-height:300px;overflow-y:auto">Loading...</div>
                    </div>
                </div>

                <div class="mt-2" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
                    <div class="stat-card" style="cursor:pointer" onclick="App.navigate('product')">
                        <div class="stat-label">Total Products</div>
                        <div class="stat-value" id="dashProducts">--</div>
                        <i class="ri-shopping-bag-fill stat-icon"></i>
                    </div>
                    <div class="stat-card success" style="cursor:pointer" onclick="App.navigate('customer')">
                        <div class="stat-label">Total Customers</div>
                        <div class="stat-value" id="dashCustomers">--</div>
                        <i class="ri-group-fill stat-icon"></i>
                    </div>
                    <div class="stat-card warning" style="cursor:pointer" onclick="App.navigate('supplier')">
                        <div class="stat-label">Total Suppliers</div>
                        <div class="stat-value" id="dashSuppliers">--</div>
                        <i class="ri-truck-fill stat-icon"></i>
                    </div>
                </div>
            </div>
        `;

        this.loadData();
    },

    async loadData() {
        try {
            const data = await App.api('/dashboard');

            document.getElementById('dashStats').innerHTML = `
                <div class="stat-card">
                    <div class="stat-label">Today's Sales</div>
                    <div class="stat-value">${App.formatCurrency(data.today_sales)}</div>
                    <i class="ri-line-chart-fill stat-icon"></i>
                </div>
                <div class="stat-card success">
                    <div class="stat-label">Bills Today</div>
                    <div class="stat-value">${data.today_bills}</div>
                    <i class="ri-bill-fill stat-icon"></i>
                </div>
                <div class="stat-card warning">
                    <div class="stat-label">Cash Collection</div>
                    <div class="stat-value">${App.formatCurrency(data.cash_total)}</div>
                    <i class="ri-money-rupee-circle-fill stat-icon"></i>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Digital Payments</div>
                    <div class="stat-value">${App.formatCurrency(data.card_total + data.upi_total)}</div>
                    <i class="ri-bank-card-fill stat-icon"></i>
                </div>
            `;

            document.getElementById('paymentBreakdown').innerHTML = `
                <div style="display:flex;flex-direction:column;gap:10px">
                    ${this.paymentBar('Cash', data.cash_total, data.today_sales, 'var(--success)')}
                    ${this.paymentBar('Card', data.card_total, data.today_sales, 'var(--accent)')}
                    ${this.paymentBar('UPI', data.upi_total, data.today_sales, 'var(--info)')}
                </div>
            `;

            const lowItems = data.low_stock_items || [];
            document.getElementById('lowStockList').innerHTML = lowItems.length === 0
                ? '<p class="text-muted" style="text-align:center;padding:30px">No low stock items 🎉</p>'
                : lowItems.map(item => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
                        <div>
                            <div style="font-weight:600;font-size:0.85rem">${item.name}</div>
                            <div class="text-muted" style="font-size:0.75rem">${item.code}</div>
                        </div>
                        <span class="badge badge-danger">${item.stock_qty} left</span>
                    </div>
                `).join('');

            document.getElementById('dashProducts').textContent = data.products_count;
            document.getElementById('dashCustomers').textContent = data.customers_count;
            document.getElementById('dashSuppliers').textContent = data.suppliers_count;

        } catch (e) {
            document.getElementById('dashStats').innerHTML = `
                <div class="stat-card"><div class="stat-label">Today's Sales</div><div class="stat-value">₹0.00</div></div>
                <div class="stat-card success"><div class="stat-label">Bills Today</div><div class="stat-value">0</div></div>
                <div class="stat-card warning"><div class="stat-label">Cash</div><div class="stat-value">₹0.00</div></div>
                <div class="stat-card"><div class="stat-label">Digital</div><div class="stat-value">₹0.00</div></div>
            `;
        }
    },

    paymentBar(label, amount, total, color) {
        const pct = total > 0 ? (amount / total * 100) : 0;
        return `
            <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="font-size:0.82rem;font-weight:600">${label}</span>
                    <span style="font-size:0.82rem;color:var(--text-muted)">${App.formatCurrency(amount)}</span>
                </div>
                <div style="width:100%;height:6px;background:var(--bg-input);border-radius:3px;overflow:hidden">
                    <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;transition:width 0.5s ease"></div>
                </div>
            </div>
        `;
    }
};

App.registerModule('dashboard', DashboardModule);
