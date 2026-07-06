/* ═══════════════════════════════════════════════════════
   PURCHASE MODULE
   ═══════════════════════════════════════════════════════ */

const PurchaseModule = {
    purchases: [],
    suppliers: [],
    products: [],
    items: [],

    async render() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-shopping-cart-fill"></i> Purchase Entry</h1>
                    <button class="btn btn-primary" onclick="PurchaseModule.newPurchase()">
                        <i class="ri-add-line"></i> New Purchase
                    </button>
                </div>
                <div id="purchaseList">Loading...</div>
            </div>
        `;
        this.loadPurchases();
    },

    async loadPurchases() {
        try {
            this.purchases = await App.api('/purchases');
            const headers = [
                { label: '#' }, { label: 'Purchase No' }, { label: 'Date' }, { label: 'Supplier' },
                { label: 'Total', class: 'text-right' }, { label: 'Status' }, { label: 'Actions', class: 'text-center' }
            ];
            const rows = this.purchases.map((p, i) => `
                <td>${i + 1}</td>
                <td><span class="badge badge-info">${p.purchase_no}</span></td>
                <td>${App.formatDate(p.date)}</td>
                <td>${p.suppliers?.name || '-'}</td>
                <td class="text-right font-bold">${App.formatCurrency(p.net_amount)}</td>
                <td><span class="badge badge-success">${p.status}</span></td>
                <td class="text-center">
                    <button class="btn-icon edit" title="View Items" onclick="PurchaseModule.viewItems(${p.id})"><i class="ri-eye-line"></i></button>
                </td>
            `);
            document.getElementById('purchaseList').innerHTML = App.renderTable(headers, rows, 'No purchases yet');
        } catch (e) {
            document.getElementById('purchaseList').innerHTML = '<div class="empty-state"><p>Failed to load purchases</p></div>';
        }
    },

    async newPurchase() {
        this.items = [];
        try {
            this.suppliers = await App.api('/suppliers');
            this.products = await App.api('/products');
        } catch (e) {}

        const html = `
            <div class="form-grid mb-2">
                <div class="form-group">
                    <label>Supplier *</label>
                    <select class="form-control" id="pur_supplier">
                        <option value="">Select Supplier</option>
                        ${this.suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" class="form-control" id="pur_date" value="${App.today()}">
                </div>
                <div class="form-group">
                    <label>Discount (₹)</label>
                    <input type="number" class="form-control" id="pur_discount" value="0" oninput="PurchaseModule.calcTotal()">
                </div>
            </div>

            <div class="card mb-2">
                <div class="card-header">
                    <span class="card-title"><i class="ri-list-check"></i> Add Items</span>
                </div>
                <div class="form-inline mb-1">
                    <select class="form-control" id="pur_product" style="flex:2">
                        <option value="">Select Product</option>
                        ${this.products.map(p => `<option value="${p.id}" data-rate="${p.landing_cost}">${p.code} - ${p.name}</option>`).join('')}
                    </select>
                    <input type="number" class="form-control" id="pur_qty" placeholder="Qty" style="width:80px" value="1">
                    <input type="number" class="form-control" id="pur_rate" placeholder="Rate" style="width:100px">
                    <button class="btn btn-primary btn-sm" onclick="PurchaseModule.addItem()"><i class="ri-add-line"></i> Add</button>
                </div>
                <div id="pur_items_table"></div>
            </div>

            <div class="total-display mb-2">
                <div class="total-label">Net Amount</div>
                <div class="total-amount" id="pur_total">₹0.00</div>
            </div>

            <div class="modal-footer" style="border:0;padding:0">
                <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-success" onclick="PurchaseModule.savePurchase()"><i class="ri-save-line"></i> Save Purchase</button>
            </div>
        `;
        App.openModal('🛒 New Purchase Entry', html);

        document.getElementById('pur_product').addEventListener('change', function() {
            const opt = this.options[this.selectedIndex];
            if (opt.dataset.rate) document.getElementById('pur_rate').value = opt.dataset.rate;
        });

        this.renderItems();
    },

    addItem() {
        const sel = document.getElementById('pur_product');
        const productId = parseInt(sel.value);
        if (!productId) { App.showNotification('Select a product', 'warning'); return; }
        const qty = parseFloat(document.getElementById('pur_qty').value) || 0;
        const rate = parseFloat(document.getElementById('pur_rate').value) || 0;
        if (qty <= 0 || rate <= 0) { App.showNotification('Enter valid qty and rate', 'warning'); return; }

        const product = this.products.find(p => p.id === productId);
        this.items.push({
            product_id: productId,
            product_name: product?.name || '',
            product_code: product?.code || '',
            qty, rate, amount: qty * rate
        });

        sel.value = '';
        document.getElementById('pur_qty').value = 1;
        document.getElementById('pur_rate').value = '';
        this.renderItems();
    },

    removeItem(idx) {
        this.items.splice(idx, 1);
        this.renderItems();
    },

    renderItems() {
        const container = document.getElementById('pur_items_table');
        if (!container) return;
        if (this.items.length === 0) {
            container.innerHTML = '<p class="text-muted text-center mt-1">No items added yet</p>';
            this.calcTotal();
            return;
        }
        container.innerHTML = `
            <table class="data-table" style="font-size:0.82rem">
                <thead><tr><th>#</th><th>Code</th><th>Product</th><th class="text-right">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount</th><th></th></tr></thead>
                <tbody>${this.items.map((item, i) => `
                    <tr>
                        <td>${i + 1}</td><td>${item.product_code}</td><td>${item.product_name}</td>
                        <td class="text-right">${item.qty}</td><td class="text-right">${App.formatCurrency(item.rate)}</td>
                        <td class="text-right font-bold">${App.formatCurrency(item.amount)}</td>
                        <td><button class="btn-icon delete" onclick="PurchaseModule.removeItem(${i})"><i class="ri-close-line"></i></button></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        `;
        this.calcTotal();
    },

    calcTotal() {
        const subtotal = this.items.reduce((sum, i) => sum + i.amount, 0);
        const discount = parseFloat(document.getElementById('pur_discount')?.value) || 0;
        const net = subtotal - discount;
        const el = document.getElementById('pur_total');
        if (el) el.textContent = App.formatCurrency(net);
    },

    async savePurchase() {
        const supplierId = parseInt(document.getElementById('pur_supplier').value);
        if (!supplierId) { App.showNotification('Select a supplier', 'warning'); return; }
        if (this.items.length === 0) { App.showNotification('Add at least one item', 'warning'); return; }

        const data = {
            supplier_id: supplierId,
            date: document.getElementById('pur_date').value,
            discount: parseFloat(document.getElementById('pur_discount').value) || 0,
            items: this.items.map(i => ({ product_id: i.product_id, qty: i.qty, rate: i.rate, amount: i.amount }))
        };

        try {
            const res = await App.api('/purchases', { method: 'POST', body: data });
            App.showNotification(`Purchase ${res.purchase_no} saved!`, 'success');
            App.closeModal();
            this.loadPurchases();
        } catch (e) {}
    },

    async viewItems(purchaseId) {
        try {
            const items = await App.api(`/purchases/${purchaseId}/items`);
            const html = items.map((it, i) => `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
                    <div><strong>${it.products?.code || ''}</strong> — ${it.products?.name || ''}</div>
                    <div>${it.qty} × ${App.formatCurrency(it.rate)} = <strong>${App.formatCurrency(it.amount)}</strong></div>
                </div>
            `).join('');
            App.openModal('📦 Purchase Items', html || '<p class="text-muted">No items</p>');
        } catch (e) {}
    }
};

App.registerModule('purchase', PurchaseModule);
