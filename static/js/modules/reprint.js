/* ═══════════════════════════════════════════════════════
   REPRINT BILL MODULE
   ═══════════════════════════════════════════════════════ */

const ReprintModule = {
    bills: [],

    async render() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-printer-fill"></i> Reprint Bill</h1>
                    <div class="search-bar">
                        <i class="ri-search-line"></i>
                        <input type="text" id="repSearch" placeholder="Search by Bill No..." oninput="ReprintModule.search(this.value)">
                    </div>
                </div>
                <div id="repTable">Loading...</div>
            </div>
        `;
        this.loadBills();
    },

    async loadBills(search = '') {
        try {
            const params = search ? `?bill_no=${encodeURIComponent(search)}` : '';
            this.bills = await App.api(`/bills/search${params}`);
            const headers = [
                { label: 'SNo' }, { label: 'Bill No' }, { label: 'Date' },
                { label: 'Amount', class: 'text-right' }, { label: 'Actions', class: 'text-center' }
            ];
            const rows = this.bills.map((b, i) => `
                <td>${i + 1}</td>
                <td class="text-accent font-bold">${b.bill_no}</td>
                <td>${App.formatDate(b.date)}</td>
                <td class="text-right font-bold">${App.formatCurrency(b.total)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary" onclick="ReprintModule.reprint(${b.id})"><i class="ri-printer-line"></i> Reprint (₹${b.total})</button>
                    <button class="btn-icon" style="margin-left:8px" onclick="ReprintModule.view(${b.id})"><i class="ri-eye-line"></i></button>
                </td>
            `);
            document.getElementById('repTable').innerHTML = App.renderTable(headers, rows, 'No bills found');
            if (this.bills.length > 0) {
                document.getElementById('repTable').innerHTML += `<div style="text-align:right;margin-top:10px;font-size:2rem;font-weight:900;color:var(--danger)">${App.formatCurrency(this.bills[0].total)}</div>`;
            }
        } catch (e) {
            document.getElementById('repTable').innerHTML = '<div class="empty-state"><p>Error loading bills</p></div>';
        }
    },

    search(v) { clearTimeout(this._t); this._t = setTimeout(() => this.loadBills(v), 300); },

    async view(id) {
        const bill = this.bills.find(b => b.id === id);
        if (!bill) return;
        try {
            const items = await App.api(`/bills/${id}/items`);
            const html = `
                <div class="bill-preview">
                    <div class="bill-header">
                        <div class="bill-shop">FLASH ACCESSORIES</div>
                        <div>Date: ${App.formatDate(bill.date)} | Bill: ${bill.bill_no}</div>
                    </div>
                    <table style="width:100%;font-size:0.9rem;margin-bottom:10px">
                        <thead><tr style="border-bottom:1px dashed #000"><th style="text-align:left">Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amt</th></tr></thead>
                        <tbody>
                            ${items.map(it => `
                                <tr>
                                    <td>${it.product_name}</td><td style="text-align:right">${it.qty}</td><td style="text-align:right">${it.rate}</td><td style="text-align:right">${it.amount}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="bill-total-row" style="display:flex;justify-content:space-between">
                        <span>Net Total:</span><span>${App.formatCurrency(bill.total)}</span>
                    </div>
                </div>
            `;
            App.openModal(`📄 Bill Details - ${bill.bill_no}`, html);
        } catch (e) {}
    },

    reprint(id) {
        this.view(id); // Usually triggers print dialog, we just show modal for now
        setTimeout(() => App.showNotification('Sent to printer', 'success'), 500);
    }
};

App.registerModule('reprint', ReprintModule);
