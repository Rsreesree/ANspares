/* ═══════════════════════════════════════════════════════
   BILLING / POS MODULE
   ═══════════════════════════════════════════════════════ */

const BillingModule = {
    items: [],
    products: [],
    customers: [],

    async render() {
        try {
            this.products = await App.api('/products');
            this.customers = await App.api('/customers');
        } catch (e) {}
        this.items = [];

        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="billing-layout">
                    <!-- LEFT: Items Area -->
                    <div class="billing-items">
                        <div class="card mb-1" style="padding:12px">
                            <div class="form-inline">
                                <div class="search-bar" style="flex:1;max-width:100%">
                                    <i class="ri-search-line"></i>
                                    <input type="text" id="bill_search" placeholder="Search product by name, code or barcode..." oninput="BillingModule.searchProduct(this.value)" autocomplete="off">
                                </div>
                            </div>
                            <div id="bill_suggestions" class="hidden" style="position:relative"></div>
                        </div>

                        <div class="card flex-1" style="display:flex;flex-direction:column;padding:0;overflow:hidden">
                            <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                                <span class="card-title" style="margin:0"><i class="ri-list-check"></i> Bill Items</span>
                                <span class="text-muted" id="bill_item_count">0 items</span>
                            </div>
                            <div class="table-container" style="flex:1;border:0;border-radius:0" id="bill_items_area">
                                <div class="empty-state"><i class="ri-scan-line"></i><p>Search and add products to start billing</p></div>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT: Payment Summary -->
                    <div class="billing-summary">
                        <div class="card mb-1" style="padding:14px">
                            <div class="form-group mb-1">
                                <label>Customer (Optional)</label>
                                <select class="form-control" id="bill_customer">
                                    <option value="">Walk-in Customer</option>
                                    ${this.customers.map(c => `<option value="${c.id}">${c.name} - ${c.phone}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="card flex-1" style="display:flex;flex-direction:column;justify-content:space-between">
                            <div>
                                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
                                    <span class="text-muted">Subtotal</span>
                                    <span class="font-bold" id="bill_subtotal">₹0.00</span>
                                </div>
                                <div class="form-inline mt-1 mb-1">
                                    <label style="font-size:0.78rem;font-weight:600;color:var(--text-secondary)">Discount ₹</label>
                                    <input type="number" class="form-control" id="bill_discount" value="0" style="width:100px" oninput="BillingModule.calcTotals()">
                                </div>
                                <div class="total-display mb-2">
                                    <div class="total-label">Total Amount</div>
                                    <div class="total-amount" id="bill_total">₹0.00</div>
                                </div>

                                <div class="payment-grid">
                                    <div class="form-group"><label>Cash ₹</label><input type="number" class="form-control" id="pay_cash" value="0" oninput="BillingModule.calcBalance()"></div>
                                    <div class="form-group"><label>Card ₹</label><input type="number" class="form-control" id="pay_card" value="0" oninput="BillingModule.calcBalance()"></div>
                                    <div class="form-group"><label>UPI ₹</label><input type="number" class="form-control" id="pay_upi" value="0" oninput="BillingModule.calcBalance()"></div>
                                    <div class="form-group"><label>Paytm ₹</label><input type="number" class="form-control" id="pay_paytm" value="0" oninput="BillingModule.calcBalance()"></div>
                                    <div class="form-group"><label>GPay ₹</label><input type="number" class="form-control" id="pay_gpay" value="0" oninput="BillingModule.calcBalance()"></div>
                                    <div class="form-group"><label>Credit ₹</label><input type="number" class="form-control" id="pay_credit" value="0" oninput="BillingModule.calcBalance()"></div>
                                </div>

                                <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:10px;border-top:1px solid var(--border)">
                                    <span class="font-bold">Balance</span>
                                    <span class="font-bold" id="bill_balance" style="font-size:1.1rem">₹0.00</span>
                                </div>
                            </div>

                            <div class="btn-group mt-2">
                                <button class="btn btn-outline w-full" onclick="BillingModule.clearBill()">
                                    <i class="ri-delete-bin-line"></i> Clear
                                </button>
                                <button class="btn btn-success w-full" onclick="BillingModule.saveBill()" style="flex:2">
                                    <i class="ri-check-double-line"></i> Save & Print
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    searchProduct(value) {
        clearTimeout(this._st);
        this._st = setTimeout(() => {
            const suggestions = document.getElementById('bill_suggestions');
            if (!value) { suggestions.classList.add('hidden'); return; }
            const q = value.toLowerCase();
            const matches = this.products.filter(p =>
                p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q))
            ).slice(0, 8);

            if (matches.length === 0) { suggestions.classList.add('hidden'); return; }

            // If exact barcode match, auto-add
            if (matches.length === 1 && matches[0].barcode === value) {
                this.addProduct(matches[0]);
                document.getElementById('bill_search').value = '';
                suggestions.classList.add('hidden');
                return;
            }

            suggestions.classList.remove('hidden');
            suggestions.innerHTML = `
                <div style="position:absolute;top:0;left:0;right:0;z-index:50;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);max-height:250px;overflow-y:auto">
                    ${matches.map(p => `
                        <div style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;transition:background 0.15s"
                             onmouseover="this.style.background='var(--bg-card-hover)'" onmouseout="this.style.background=''"
                             onclick="BillingModule.addProduct(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                            <div>
                                <div style="font-weight:600;font-size:0.85rem">${p.name}</div>
                                <div class="text-muted" style="font-size:0.75rem">${p.code} | Stock: ${p.stock_qty}</div>
                            </div>
                            <span class="font-bold text-accent">${App.formatCurrency(p.sale_rate)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }, 150);
    },

    addProduct(product) {
        const existing = this.items.find(i => i.product_id === product.id);
        if (existing) {
            existing.qty += 1;
            existing.amount = existing.qty * existing.rate;
        } else {
            this.items.push({
                product_id: product.id,
                product_name: product.name,
                product_code: product.code,
                qty: 1,
                rate: parseFloat(product.sale_rate) || 0,
                amount: parseFloat(product.sale_rate) || 0
            });
        }
        document.getElementById('bill_search').value = '';
        document.getElementById('bill_suggestions').classList.add('hidden');
        this.renderItems();
    },

    renderItems() {
        const area = document.getElementById('bill_items_area');
        document.getElementById('bill_item_count').textContent = `${this.items.length} items`;

        if (this.items.length === 0) {
            area.innerHTML = '<div class="empty-state"><i class="ri-scan-line"></i><p>Search and add products</p></div>';
            this.calcTotals();
            return;
        }

        area.innerHTML = `
            <table class="data-table">
                <thead><tr><th>#</th><th>Code</th><th>Product</th><th class="text-center">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount</th><th></th></tr></thead>
                <tbody>${this.items.map((item, i) => `
                    <tr>
                        <td>${i + 1}</td><td>${item.product_code}</td><td style="font-weight:600">${item.product_name}</td>
                        <td class="text-center">
                            <div style="display:flex;align-items:center;justify-content:center;gap:4px">
                                <button class="btn-icon" style="width:24px;height:24px;font-size:0.9rem" onclick="BillingModule.changeQty(${i},-1)"><i class="ri-subtract-line"></i></button>
                                <input type="number" value="${item.qty}" style="width:45px;text-align:center;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;color:var(--text-primary);padding:3px;font-size:0.85rem"
                                    onchange="BillingModule.setQty(${i}, this.value)">
                                <button class="btn-icon" style="width:24px;height:24px;font-size:0.9rem" onclick="BillingModule.changeQty(${i},1)"><i class="ri-add-line"></i></button>
                            </div>
                        </td>
                        <td class="text-right">${App.formatCurrency(item.rate)}</td>
                        <td class="text-right font-bold">${App.formatCurrency(item.amount)}</td>
                        <td><button class="btn-icon delete" onclick="BillingModule.removeItem(${i})"><i class="ri-close-line"></i></button></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        `;
        this.calcTotals();
    },

    changeQty(idx, delta) {
        this.items[idx].qty = Math.max(1, this.items[idx].qty + delta);
        this.items[idx].amount = this.items[idx].qty * this.items[idx].rate;
        this.renderItems();
    },

    setQty(idx, val) {
        this.items[idx].qty = Math.max(1, parseInt(val) || 1);
        this.items[idx].amount = this.items[idx].qty * this.items[idx].rate;
        this.renderItems();
    },

    removeItem(idx) {
        this.items.splice(idx, 1);
        this.renderItems();
    },

    calcTotals() {
        const subtotal = this.items.reduce((s, i) => s + i.amount, 0);
        const discount = parseFloat(document.getElementById('bill_discount')?.value) || 0;
        const total = subtotal - discount;

        const stEl = document.getElementById('bill_subtotal');
        const ttEl = document.getElementById('bill_total');
        if (stEl) stEl.textContent = App.formatCurrency(subtotal);
        if (ttEl) ttEl.textContent = App.formatCurrency(total);

        this.calcBalance();
    },

    calcBalance() {
        const subtotal = this.items.reduce((s, i) => s + i.amount, 0);
        const discount = parseFloat(document.getElementById('bill_discount')?.value) || 0;
        const total = subtotal - discount;

        const paid = ['pay_cash', 'pay_card', 'pay_upi', 'pay_paytm', 'pay_gpay', 'pay_credit']
            .reduce((s, id) => s + (parseFloat(document.getElementById(id)?.value) || 0), 0);

        const balance = total - paid;
        const el = document.getElementById('bill_balance');
        if (el) {
            el.textContent = App.formatCurrency(balance);
            el.style.color = balance > 0 ? 'var(--danger)' : 'var(--success)';
        }
    },

    clearBill() {
        this.items = [];
        this.renderItems();
        ['pay_cash', 'pay_card', 'pay_upi', 'pay_paytm', 'pay_gpay', 'pay_credit', 'bill_discount'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = 0;
        });
        if (document.getElementById('bill_customer')) document.getElementById('bill_customer').value = '';
    },

    async saveBill() {
        if (this.items.length === 0) { App.showNotification('Add items first', 'warning'); return; }

        const subtotal = this.items.reduce((s, i) => s + i.amount, 0);
        const discount = parseFloat(document.getElementById('bill_discount').value) || 0;
        const total = subtotal - discount;
        const cash = parseFloat(document.getElementById('pay_cash').value) || 0;
        const card = parseFloat(document.getElementById('pay_card').value) || 0;
        const upi = parseFloat(document.getElementById('pay_upi').value) || 0;
        const paytm = parseFloat(document.getElementById('pay_paytm').value) || 0;
        const gpay = parseFloat(document.getElementById('pay_gpay').value) || 0;
        const credit = parseFloat(document.getElementById('pay_credit').value) || 0;
        const paid = cash + card + upi + paytm + gpay + credit;

        if (paid < total) { App.showNotification('Payment is less than total amount', 'warning'); return; }

        const customerId = document.getElementById('bill_customer').value || null;

        const data = {
            customer_id: customerId ? parseInt(customerId) : null,
            subtotal, discount, tax: 0, total,
            cash, card, upi, paytm, gpay, credit,
            cashier: 'ADMIN', counter: 'Counter-1',
            items: this.items.map(i => ({
                product_id: i.product_id,
                product_name: i.product_name,
                product_code: i.product_code,
                qty: i.qty, rate: i.rate, amount: i.amount
            }))
        };

        try {
            const res = await App.api('/bills', { method: 'POST', body: data });
            App.showNotification(`Bill ${res.bill_no} saved successfully!`, 'success');
            this.clearBill();
        } catch (e) {}
    }
};

App.registerModule('billing', BillingModule);
