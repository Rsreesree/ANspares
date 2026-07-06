/* ═══════════════════════════════════════════════════════
   SUPPLIER PAYMENT MODULE
   ═══════════════════════════════════════════════════════ */

const PaymentModule = {
    payments: [],
    suppliers: [],

    async render() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-money-rupee-circle-fill"></i> Supplier Payment Entry</h1>
                    <div class="btn-group">
                        <div class="form-inline">
                            <label class="text-muted" style="font-size:0.82rem">Date:</label>
                            <input type="date" class="form-control" id="payDate" value="${App.today()}" onchange="PaymentModule.loadPayments()">
                        </div>
                        <button class="btn btn-primary" onclick="PaymentModule.showForm()">
                            <i class="ri-add-line"></i> New Payment
                        </button>
                    </div>
                </div>
                <div class="mb-2">
                    <span class="text-muted">Cash Amount : </span>
                    <span class="font-bold text-accent" id="payCashTotal">₹0.00</span>
                </div>
                <div id="payTable">Loading...</div>
            </div>
        `;
        this.loadPayments();
    },

    async loadPayments() {
        try {
            const dt = document.getElementById('payDate')?.value || '';
            const params = dt ? `?date=${dt}` : '';
            this.payments = await App.api(`/payments${params}`);
            const cashTotal = this.payments.reduce((s, p) => s + parseFloat(p.cash || 0), 0);
            document.getElementById('payCashTotal').textContent = App.formatCurrency(cashTotal);

            const headers = [
                { label: 'S.No' }, { label: 'Supplier' }, { label: 'Cash', class: 'text-right' },
                { label: 'RTGS', class: 'text-right' }, { label: 'Chq.Amount', class: 'text-right' },
                { label: 'Chq.No' }, { label: 'Chq.Date' }, { label: 'Bank' },
                { label: 'Cleared' }, { label: 'Discount', class: 'text-right' }, { label: 'Narration' }
            ];
            const rows = this.payments.map((p, i) => `
                <td>${i + 1}</td>
                <td style="font-weight:600">${p.suppliers?.name || '-'}</td>
                <td class="text-right">${App.formatCurrency(p.cash)}</td>
                <td class="text-right">${App.formatCurrency(p.rtgs)}</td>
                <td class="text-right">${App.formatCurrency(p.chq_amount)}</td>
                <td>${p.chq_no || '-'}</td>
                <td>${p.chq_date ? App.formatDate(p.chq_date) : '-'}</td>
                <td>${p.bank || '-'}</td>
                <td><span class="badge ${p.cleared ? 'badge-success' : 'badge-warning'}">${p.cleared ? 'Yes' : 'No'}</span></td>
                <td class="text-right">${App.formatCurrency(p.discount)}</td>
                <td>${p.narration || '-'}</td>
            `);
            document.getElementById('payTable').innerHTML = App.renderTable(headers, rows, 'No payments for this date');
        } catch (e) {
            document.getElementById('payTable').innerHTML = '<div class="empty-state"><p>Failed to load</p></div>';
        }
    },

    async showForm() {
        try { this.suppliers = await App.api('/suppliers'); } catch (e) {}
        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Date</label><input type="date" class="form-control" id="fp_date" value="${App.today()}"></div>
                <div class="form-group">
                    <label>Supplier *</label>
                    <select class="form-control" id="fp_supplier">
                        <option value="">Select</option>
                        ${this.suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Cash (₹)</label><input type="number" class="form-control" id="fp_cash" value="0"></div>
                <div class="form-group"><label>RTGS (₹)</label><input type="number" class="form-control" id="fp_rtgs" value="0"></div>
                <div class="form-group"><label>Cheque Amount (₹)</label><input type="number" class="form-control" id="fp_chq_amount" value="0"></div>
                <div class="form-group"><label>Cheque No</label><input class="form-control" id="fp_chq_no"></div>
                <div class="form-group"><label>Cheque Date</label><input type="date" class="form-control" id="fp_chq_date"></div>
                <div class="form-group"><label>Bank</label><input class="form-control" id="fp_bank"></div>
                <div class="form-group"><label>Cleared</label><select class="form-control" id="fp_cleared"><option value="false">No</option><option value="true">Yes</option></select></div>
                <div class="form-group"><label>Discount (₹)</label><input type="number" class="form-control" id="fp_discount" value="0"></div>
                <div class="form-group" style="grid-column:1/-1"><label>Narration</label><textarea class="form-control" id="fp_narration"></textarea></div>
            </div>
            <div class="modal-footer" style="border:0;padding:20px 0 0">
                <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="PaymentModule.save()"><i class="ri-save-line"></i> Save Payment</button>
            </div>
        `;
        App.openModal('💰 Supplier Payment Entry', html);
    },

    async save() {
        const suppId = parseInt(document.getElementById('fp_supplier').value);
        if (!suppId) { App.showNotification('Select a supplier', 'warning'); return; }
        const data = {
            date: document.getElementById('fp_date').value,
            supplier_id: suppId,
            cash: parseFloat(document.getElementById('fp_cash').value) || 0,
            rtgs: parseFloat(document.getElementById('fp_rtgs').value) || 0,
            chq_amount: parseFloat(document.getElementById('fp_chq_amount').value) || 0,
            chq_no: document.getElementById('fp_chq_no').value.trim(),
            chq_date: document.getElementById('fp_chq_date').value || null,
            bank: document.getElementById('fp_bank').value.trim(),
            cleared: document.getElementById('fp_cleared').value === 'true',
            discount: parseFloat(document.getElementById('fp_discount').value) || 0,
            narration: document.getElementById('fp_narration').value.trim()
        };
        try {
            await App.api('/payments', { method: 'POST', body: data });
            App.showNotification('Payment saved', 'success');
            App.closeModal();
            this.loadPayments();
        } catch (e) {}
    }
};

App.registerModule('payment', PaymentModule);
