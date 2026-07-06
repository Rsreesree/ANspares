/* ═══════════════════════════════════════════════════════
   STOCK REPORT MODULE
   ═══════════════════════════════════════════════════════ */

const StockModule = {
    filters: {},

    async render() {
        try { this.filters = await App.api('/products/filters'); } catch (e) {}
        const f = this.filters;

        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-archive-fill"></i> Closing Stock Report</h1>
                    <button class="btn btn-success" onclick="StockModule.exportExcel()">
                        <i class="ri-file-excel-line"></i> Export Excel
                    </button>
                </div>

                <div class="filter-panel">
                    <div class="form-group">
                        <label>Brand</label>
                        <select class="form-control" id="stk_brand"><option value="">All Brands</option>
                            ${(f.brands || []).map(x => `<option value="${x}">${x}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select class="form-control" id="stk_category"><option value="">All Categories</option>
                            ${(f.categories || []).map(x => `<option value="${x}">${x}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Department</label>
                        <select class="form-control" id="stk_department"><option value="">All Depts</option>
                            ${(f.departments || []).map(x => `<option value="${x}">${x}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <select class="form-control" id="stk_location"><option value="">All Locations</option>
                            ${(f.locations || []).map(x => `<option value="${x}">${x}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Search Keyword</label>
                        <input type="text" class="form-control" id="stk_keyword" placeholder="Name or keyword">
                    </div>
                    <div class="form-group">
                        <label>Code Range</label>
                        <input type="text" class="form-control" id="stk_code" placeholder="Product code">
                    </div>
                </div>

                <div class="card mb-2" style="padding:16px">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                        <div>
                            <label style="font-weight:600;font-size:0.8rem;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:10px">Stock Rate</label>
                            <div class="radio-group">
                                <label><input type="radio" name="stk_type" value="all" checked> All</label>
                                <label><input type="radio" name="stk_type" value="zero"> Zero Stock</label>
                                <label><input type="radio" name="stk_type" value="with"> With Stock</label>
                                <label><input type="radio" name="stk_type" value="without"> Negative Stock</label>
                            </div>
                        </div>
                        <div>
                            <label style="font-weight:600;font-size:0.8rem;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:10px">Rate Type</label>
                            <div class="radio-group">
                                <label><input type="radio" name="stk_rate_type" value="landing_cost" checked> Landing Cost</label>
                                <label><input type="radio" name="stk_rate_type" value="sale_rate"> Sales Rate</label>
                                <label><input type="radio" name="stk_rate_type" value="mrp"> MRP</label>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top:16px;text-align:right">
                        <button class="btn btn-primary" onclick="StockModule.loadReport()"><i class="ri-search-line"></i> View Report</button>
                    </div>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:0 10px">
                    <span class="font-bold">Total Items: <span id="stk_count" class="text-accent">0</span></span>
                    <span class="font-bold">Total Stock Value: <span id="stk_val_total" class="text-success" style="font-size:1.2rem">₹0.00</span></span>
                </div>
                <div id="stockTable">
                    <div class="empty-state"><i class="ri-archive-line"></i><p>Apply filters and click View Report</p></div>
                </div>
            </div>
        `;
    },

    async loadReport() {
        const params = new URLSearchParams({
            brand: document.getElementById('stk_brand').value,
            category: document.getElementById('stk_category').value,
            department: document.getElementById('stk_department').value,
            location: document.getElementById('stk_location').value,
            keyword: document.getElementById('stk_keyword').value,
            code: document.getElementById('stk_code').value,
            stock_filter: document.querySelector('input[name="stk_type"]:checked').value,
            rate_type: document.querySelector('input[name="stk_rate_type"]:checked').value
        });
        
        document.getElementById('stockTable').innerHTML = '<div class="empty-state"><p>Loading...</p></div>';

        try {
            const data = await App.api(`/stock/report?${params.toString()}`);
            document.getElementById('stk_count').textContent = data.total_items;
            document.getElementById('stk_val_total').textContent = App.formatCurrency(data.total_value);

            const headers = [
                { label: 'Code' }, { label: 'Product Name' }, { label: 'Brand' },
                { label: 'Category' }, { label: 'Location' }, { label: 'Qty', class: 'text-right' },
                { label: 'Rate', class: 'text-right' }, { label: 'Value', class: 'text-right' }
            ];
            const rows = data.items.map(p => `
                <td><span class="badge badge-info">${p.code}</span></td>
                <td style="font-weight:600">${p.name}</td>
                <td>${p.brand || '-'}</td>
                <td>${p.category || '-'}</td>
                <td>${p.location || '-'}</td>
                <td class="text-right">
                    <span class="badge ${parseFloat(p.stock_qty) <= 0 ? 'badge-danger' : 'badge-success'}">${p.stock_qty}</span>
                </td>
                <td class="text-right">${App.formatCurrency(p.stock_value / (parseFloat(p.stock_qty) || 1))}</td>
                <td class="text-right font-bold">${App.formatCurrency(p.stock_value)}</td>
            `);
            document.getElementById('stockTable').innerHTML = App.renderTable(headers, rows, 'No items matching filters');
        } catch (e) {
            document.getElementById('stockTable').innerHTML = '<div class="empty-state"><p>Error loading report</p></div>';
        }
    },

    exportExcel() {
        App.showNotification('Exporting to Excel (simulation)', 'info');
    }
};

App.registerModule('stock', StockModule);
