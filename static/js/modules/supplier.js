/* ═══════════════════════════════════════════════════════
   SUPPLIER MODULE
   ═══════════════════════════════════════════════════════ */

const SupplierModule = {
    suppliers: [],

    async render() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-truck-fill"></i> Supplier Management</h1>
                    <div class="btn-group">
                        <div class="search-bar">
                            <i class="ri-search-line"></i>
                            <input type="text" id="supSearch" placeholder="Search suppliers..." oninput="SupplierModule.search(this.value)">
                        </div>
                        <button class="btn btn-primary" onclick="SupplierModule.showForm()">
                            <i class="ri-add-line"></i> Add Supplier
                        </button>
                    </div>
                </div>
                <div id="supTable">Loading...</div>
            </div>
        `;
        this.loadSuppliers();
    },

    async loadSuppliers(search = '') {
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            this.suppliers = await App.api(`/suppliers${params}`);
            this.renderTable();
        } catch (e) {
            document.getElementById('supTable').innerHTML = '<div class="empty-state"><i class="ri-error-warning-line"></i><p>Failed to load</p></div>';
        }
    },

    renderTable() {
        const headers = [
            { label: '#' }, { label: 'Name' }, { label: 'Phone' }, { label: 'Email' },
            { label: 'GSTIN' }, { label: 'Balance', class: 'text-right' }, { label: 'Actions', class: 'text-center' }
        ];
        const rows = this.suppliers.map((s, i) => `
            <td>${i + 1}</td>
            <td style="font-weight:600">${s.name}</td>
            <td>${s.phone || '-'}</td>
            <td>${s.email || '-'}</td>
            <td>${s.gstin || '-'}</td>
            <td class="text-right">
                <span class="${parseFloat(s.balance) > 0 ? 'text-danger font-bold' : ''}">${App.formatCurrency(s.balance)}</span>
            </td>
            <td class="text-center">
                <div class="table-actions" style="justify-content:center">
                    <button class="btn-icon edit" onclick="SupplierModule.showForm(${s.id})"><i class="ri-edit-line"></i></button>
                    <button class="btn-icon delete" onclick="SupplierModule.delete(${s.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </td>
        `);
        document.getElementById('supTable').innerHTML = App.renderTable(headers, rows, 'No suppliers yet');
    },

    search(v) { clearTimeout(this._t); this._t = setTimeout(() => this.loadSuppliers(v), 300); },

    showForm(id = null) {
        const s = id ? this.suppliers.find(x => x.id === id) : null;
        const html = `
            <div class="form-grid">
                <div class="form-group"><label>Name *</label><input class="form-control" id="fs_name" value="${s?.name || ''}"></div>
                <div class="form-group"><label>Phone</label><input class="form-control" id="fs_phone" value="${s?.phone || ''}"></div>
                <div class="form-group"><label>Email</label><input class="form-control" id="fs_email" value="${s?.email || ''}"></div>
                <div class="form-group"><label>GSTIN</label><input class="form-control" id="fs_gstin" value="${s?.gstin || ''}"></div>
                <div class="form-group" style="grid-column:1/-1"><label>Address</label><textarea class="form-control" id="fs_address">${s?.address || ''}</textarea></div>
            </div>
            <div class="modal-footer" style="border:0;padding:20px 0 0">
                <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="SupplierModule.save(${id || 'null'})"><i class="ri-save-line"></i> ${id ? 'Update' : 'Save'}</button>
            </div>
        `;
        App.openModal(id ? '✏️ Edit Supplier' : '➕ Add Supplier', html);
    },

    async save(id) {
        const data = {
            name: document.getElementById('fs_name').value.trim(),
            phone: document.getElementById('fs_phone').value.trim(),
            email: document.getElementById('fs_email').value.trim(),
            gstin: document.getElementById('fs_gstin').value.trim(),
            address: document.getElementById('fs_address').value.trim()
        };
        if (!data.name) { App.showNotification('Name is required', 'warning'); return; }
        try {
            if (id) { await App.api(`/suppliers/${id}`, { method: 'PUT', body: data }); }
            else { await App.api('/suppliers', { method: 'POST', body: data }); }
            App.showNotification(id ? 'Supplier updated' : 'Supplier added', 'success');
            App.closeModal();
            this.loadSuppliers();
        } catch (e) {}
    },

    async delete(id) {
        if (await App.confirm('Delete this supplier?')) {
            try { await App.api(`/suppliers/${id}`, { method: 'DELETE' }); App.showNotification('Deleted', 'success'); this.loadSuppliers(); } catch (e) {}
        }
    }
};

App.registerModule('supplier', SupplierModule);
