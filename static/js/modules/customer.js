/* ═══════════════════════════════════════════════════════
   CUSTOMER MODULE
   ═══════════════════════════════════════════════════════ */

const CustomerModule = {
    customers: [],

    async render() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-group-fill"></i> Customer Management</h1>
                    <div class="btn-group">
                        <div class="search-bar">
                            <i class="ri-search-line"></i>
                            <input type="text" id="custSearch" placeholder="Search by name or phone..." oninput="CustomerModule.search(this.value)">
                        </div>
                        <button class="btn btn-primary" onclick="CustomerModule.showForm()">
                            <i class="ri-add-line"></i> Add Customer
                        </button>
                    </div>
                </div>
                <div id="custTable">Loading...</div>
            </div>
        `;
        this.loadCustomers();
    },

    async loadCustomers(search = '') {
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            this.customers = await App.api(`/customers${params}`);
            this.renderTable();
        } catch (e) {
            document.getElementById('custTable').innerHTML = '<div class="empty-state"><i class="ri-error-warning-line"></i><p>Failed to load customers</p></div>';
        }
    },

    renderTable() {
        const headers = [
            { label: '#' }, { label: 'Name' }, { label: 'Phone' }, { label: 'Email' },
            { label: 'GSTIN' }, { label: 'Balance', class: 'text-right' }, { label: 'Actions', class: 'text-center' }
        ];
        const rows = this.customers.map((c, i) => `
            <td>${i + 1}</td>
            <td style="font-weight:600">${c.name}</td>
            <td>${c.phone || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.gstin || '-'}</td>
            <td class="text-right">
                <span class="${parseFloat(c.balance) > 0 ? 'text-danger font-bold' : ''}">${App.formatCurrency(c.balance)}</span>
            </td>
            <td class="text-center">
                <div class="table-actions" style="justify-content:center">
                    <button class="btn-icon edit" onclick="CustomerModule.showForm(${c.id})"><i class="ri-edit-line"></i></button>
                    <button class="btn-icon delete" onclick="CustomerModule.delete(${c.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </td>
        `);
        document.getElementById('custTable').innerHTML = App.renderTable(headers, rows, 'No customers yet');
    },

    search(value) {
        clearTimeout(this._t);
        this._t = setTimeout(() => this.loadCustomers(value), 300);
    },

    showForm(id = null) {
        const c = id ? this.customers.find(x => x.id === id) : null;
        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Name *</label><input class="form-control" id="fc_name" value="${c?.name || ''}"></div>
                <div class="form-group"><label>Phone</label><input class="form-control" id="fc_phone" value="${c?.phone || ''}"></div>
                <div class="form-group"><label>Email</label><input class="form-control" id="fc_email" value="${c?.email || ''}"></div>
                <div class="form-group"><label>GSTIN</label><input class="form-control" id="fc_gstin" value="${c?.gstin || ''}"></div>
                <div class="form-group"><label>Credit Limit (₹)</label><input type="number" class="form-control" id="fc_credit" value="${c?.credit_limit || 0}"></div>
                <div class="form-group" style="grid-column:1/-1"><label>Address</label><textarea class="form-control" id="fc_address">${c?.address || ''}</textarea></div>
            </div>
            <div class="modal-footer" style="border:0;padding:20px 0 0">
                <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="CustomerModule.save(${id || 'null'})"><i class="ri-save-line"></i> ${id ? 'Update' : 'Save'}</button>
            </div>
        `;
        App.openModal(id ? '✏️ Edit Customer' : '➕ Add Customer', html);
    },

    async save(id) {
        const data = {
            name: document.getElementById('fc_name').value.trim(),
            phone: document.getElementById('fc_phone').value.trim(),
            email: document.getElementById('fc_email').value.trim(),
            gstin: document.getElementById('fc_gstin').value.trim(),
            credit_limit: parseFloat(document.getElementById('fc_credit').value) || 0,
            address: document.getElementById('fc_address').value.trim()
        };
        if (!data.name) { App.showNotification('Name is required', 'warning'); return; }
        try {
            if (id) { await App.api(`/customers/${id}`, { method: 'PUT', body: data }); }
            else { await App.api('/customers', { method: 'POST', body: data }); }
            App.showNotification(id ? 'Customer updated' : 'Customer added', 'success');
            App.closeModal();
            this.loadCustomers();
        } catch (e) {}
    },

    async delete(id) {
        if (await App.confirm('Delete this customer?')) {
            try { await App.api(`/customers/${id}`, { method: 'DELETE' }); App.showNotification('Deleted', 'success'); this.loadCustomers(); } catch (e) {}
        }
    }
};

App.registerModule('customer', CustomerModule);
