/* ═══════════════════════════════════════════════════════
   CUSTOMER RECEIPT MODULE
   ═══════════════════════════════════════════════════════ */

const ReceiptModule = {
    receipts: [],
    customers: [],

    async render() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-file-text-fill"></i> Customer Receipt</h1>
                    <button class="btn btn-primary" onclick="ReceiptModule.showForm()">
                        <i class="ri-add-line"></i> New Receipt
                    </button>
                </div>
                <div id="receiptTable">Loading...</div>
            </div>
        `;
        this.loadReceipts();
    },

    async loadReceipts() {
        try {
            this.receipts = await App.api('/receipts');
            const headers = [
                { label: 'S.No' }, { label: 'Date' }, { label: 'Customer' },
                { label: 'Amount', class: 'text-right' }, { label: 'Mode' },
                { label: 'Reference' }, { label: 'Narration' }
            ];
            const rows = this.receipts.map((r, i) => `
                <td>${i + 1}</td>
                <td>${App.formatDate(r.date)}</td>
                <td style="font-weight:600">${r.customers?.name || '-'}</td>
                <td class="text-right font-bold text-success">${App.formatCurrency(r.amount)}</td>
                <td><span class="badge ${r.mode === 'Cash' ? 'badge-success' : 'badge-info'}">${r.mode}</span></td>
                <td>${r.reference || '-'}</td>
                <td>${r.narration || '-'}</td>
            `);
            document.getElementById('receiptTable').innerHTML = App.renderTable(headers, rows, 'No receipts found');
        } catch (e) {
            document.getElementById('receiptTable').innerHTML = '<div class="empty-state"><p>Failed to load receipts</p></div>';
        }
    },

    async showForm() {
        try { this.customers = await App.api('/customers'); } catch(e) {}
        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Date</label><input type="date" class="form-control" id="fr_date" value="${App.today()}"></div>
                <div class="form-group">
                    <label>Customer *</label>
                    <select class="form-control" id="fr_customer">
                        <option value="">Select Customer</option>
                        ${this.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Amount (₹) *</label><input type="number" class="form-control" id="fr_amount" value="0"></div>
                <div class="form-group">
                    <label>Payment Mode</label>
                    <select class="form-control" id="fr_mode">
                        <option value="Cash">Cash</option><option value="Card">Card</option>
                        <option value="UPI">UPI</option><option value="Bank">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column:1/-1"><label>Reference (Transaction ID / Chq No)</label><input class="form-control" id="fr_reference"></div>
                <div class="form-group" style="grid-column:1/-1"><label>Narration</label><textarea class="form-control" id="fr_narration"></textarea></div>
            </div>
            <div class="modal-footer" style="border:0;padding:20px 0 0">
                <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="ReceiptModule.save()"><i class="ri-save-line"></i> Save Receipt</button>
            </div>
        `;
        App.openModal('📝 New Receipt Entry', html);
    },

    async save() {
        const custId = parseInt(document.getElementById('fr_customer').value);
        if (!custId) { App.showNotification('Select a customer', 'warning'); return; }
        const amt = parseFloat(document.getElementById('fr_amount').value) || 0;
        if (amt <= 0) { App.showNotification('Enter a valid amount', 'warning'); return; }

        const data = {
            date: document.getElementById('fr_date').value,
            customer_id: custId, amount: amt,
            mode: document.getElementById('fr_mode').value,
            reference: document.getElementById('fr_reference').value.trim(),
            narration: document.getElementById('fr_narration').value.trim()
        };

        try {
            await App.api('/receipts', { method: 'POST', body: data });
            App.showNotification('Receipt saved', 'success');
            App.closeModal();
            this.loadReceipts();
        } catch (e) {}
    }
};

App.registerModule('receipt', ReceiptModule);
