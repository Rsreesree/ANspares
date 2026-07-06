/* ═══════════════════════════════════════════════════════
   PRODUCT / ITEM MASTER MODULE
   ═══════════════════════════════════════════════════════ */

const ProductModule = {
    products: [],

    async render() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-shopping-bag-fill"></i> Product Master</h1>
                    <div class="btn-group">
                        <div class="search-bar">
                            <i class="ri-search-line"></i>
                            <input type="text" id="productSearch" placeholder="Search by name, code or barcode..." oninput="ProductModule.search(this.value)">
                        </div>
                        <button class="btn btn-primary" onclick="ProductModule.showForm()">
                            <i class="ri-add-line"></i> Add Product
                        </button>
                    </div>
                </div>
                <div id="productTable">Loading...</div>
            </div>
        `;
        this.loadProducts();
    },

    async loadProducts(search = '') {
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            this.products = await App.api(`/products${params}`);
            this.renderTable();
        } catch (e) {
            document.getElementById('productTable').innerHTML = '<div class="empty-state"><i class="ri-error-warning-line"></i><p>Failed to load products</p></div>';
        }
    },

    renderTable() {
        const headers = [
            { label: '#' }, { label: 'Code' }, { label: 'Name' }, { label: 'Brand' },
            { label: 'Category' }, { label: 'UOM' }, { label: 'MRP', class: 'text-right' },
            { label: 'Sale Rate', class: 'text-right' }, { label: 'Stock', class: 'text-right' },
            { label: 'Actions', class: 'text-center' }
        ];

        const rows = this.products.map((p, i) => `
            <td>${i + 1}</td>
            <td><span class="badge badge-info">${p.code}</span></td>
            <td style="font-weight:600">${p.name}</td>
            <td>${p.brand || '-'}</td>
            <td>${p.category || '-'}</td>
            <td>${p.uom || 'PCS'}</td>
            <td class="text-right">${App.formatCurrency(p.mrp)}</td>
            <td class="text-right">${App.formatCurrency(p.sale_rate)}</td>
            <td class="text-right">
                <span class="badge ${parseFloat(p.stock_qty) <= parseFloat(p.min_stock || 0) ? 'badge-danger' : 'badge-success'}">${p.stock_qty}</span>
            </td>
            <td class="text-center">
                <div class="table-actions" style="justify-content:center">
                    <button class="btn-icon edit" title="Edit" onclick="ProductModule.showForm(${p.id})"><i class="ri-edit-line"></i></button>
                    <button class="btn-icon delete" title="Delete" onclick="ProductModule.delete(${p.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </td>
        `);

        document.getElementById('productTable').innerHTML = App.renderTable(headers, rows, 'No products found. Add your first product!');
    },

    search(value) {
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => this.loadProducts(value), 300);
    },

    showForm(id = null) {
        const product = id ? this.products.find(p => p.id === id) : null;
        const html = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Product Code *</label>
                    <input class="form-control" id="f_code" value="${product?.code || ''}" placeholder="e.g. SP001" ${product ? 'readonly' : ''}>
                </div>
                <div class="form-group">
                    <label>Product Name *</label>
                    <input class="form-control" id="f_name" value="${product?.name || ''}" placeholder="e.g. Chain Set">
                </div>
                <div class="form-group">
                    <label>Brand</label>
                    <input class="form-control" id="f_brand" value="${product?.brand || ''}" placeholder="e.g. Rolon">
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <input class="form-control" id="f_category" value="${product?.category || ''}" placeholder="e.g. Engine Parts">
                </div>
                <div class="form-group">
                    <label>Department</label>
                    <input class="form-control" id="f_department" value="${product?.department || ''}" placeholder="e.g. Spare Parts">
                </div>
                <div class="form-group">
                    <label>UOM</label>
                    <input class="form-control" id="f_uom" value="${product?.uom || 'PCS'}" placeholder="PCS, SET, LTR">
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input class="form-control" id="f_location" value="${product?.location || ''}" placeholder="e.g. Rack A-1">
                </div>
                <div class="form-group">
                    <label>Barcode</label>
                    <input class="form-control" id="f_barcode" value="${product?.barcode || ''}" placeholder="Scan or enter barcode">
                </div>
                <div class="form-group">
                    <label>HSN Code</label>
                    <input class="form-control" id="f_hsn" value="${product?.hsn || ''}" placeholder="HSN Code">
                </div>
                <div class="form-group">
                    <label>MRP (₹)</label>
                    <input type="number" class="form-control" id="f_mrp" value="${product?.mrp || 0}" step="0.01">
                </div>
                <div class="form-group">
                    <label>Sale Rate (₹)</label>
                    <input type="number" class="form-control" id="f_sale_rate" value="${product?.sale_rate || 0}" step="0.01">
                </div>
                <div class="form-group">
                    <label>Landing Cost (₹)</label>
                    <input type="number" class="form-control" id="f_landing_cost" value="${product?.landing_cost || 0}" step="0.01">
                </div>
                <div class="form-group">
                    <label>Stock Qty</label>
                    <input type="number" class="form-control" id="f_stock_qty" value="${product?.stock_qty || 0}" step="0.01">
                </div>
                <div class="form-group">
                    <label>Min Stock (Alert)</label>
                    <input type="number" class="form-control" id="f_min_stock" value="${product?.min_stock || 0}" step="0.01">
                </div>
                <div class="form-group" style="grid-column:1/-1">
                    <label>Keyword / Description</label>
                    <input class="form-control" id="f_keyword" value="${product?.keyword || ''}" placeholder="Search keywords">
                </div>
            </div>
            <div class="modal-footer" style="border:0;padding:20px 0 0">
                <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="ProductModule.save(${id || 'null'})">
                    <i class="ri-save-line"></i> ${id ? 'Update' : 'Save'} Product
                </button>
            </div>
        `;
        App.openModal(id ? '✏️ Edit Product' : '➕ Add Product', html);
    },

    async save(id) {
        const data = {
            code: document.getElementById('f_code').value.trim(),
            name: document.getElementById('f_name').value.trim(),
            brand: document.getElementById('f_brand').value.trim(),
            category: document.getElementById('f_category').value.trim(),
            department: document.getElementById('f_department').value.trim(),
            uom: document.getElementById('f_uom').value.trim() || 'PCS',
            location: document.getElementById('f_location').value.trim(),
            barcode: document.getElementById('f_barcode').value.trim(),
            hsn: document.getElementById('f_hsn').value.trim(),
            mrp: parseFloat(document.getElementById('f_mrp').value) || 0,
            sale_rate: parseFloat(document.getElementById('f_sale_rate').value) || 0,
            landing_cost: parseFloat(document.getElementById('f_landing_cost').value) || 0,
            stock_qty: parseFloat(document.getElementById('f_stock_qty').value) || 0,
            min_stock: parseFloat(document.getElementById('f_min_stock').value) || 0,
            keyword: document.getElementById('f_keyword').value.trim()
        };

        if (!data.code || !data.name) {
            App.showNotification('Code and Name are required', 'warning');
            return;
        }

        try {
            if (id) {
                await App.api(`/products/${id}`, { method: 'PUT', body: data });
                App.showNotification('Product updated successfully', 'success');
            } else {
                await App.api('/products', { method: 'POST', body: data });
                App.showNotification('Product added successfully', 'success');
            }
            App.closeModal();
            this.loadProducts();
        } catch (e) { /* handled by api */ }
    },

    async delete(id) {
        const ok = await App.confirm('Are you sure you want to delete this product?');
        if (!ok) return;
        try {
            await App.api(`/products/${id}`, { method: 'DELETE' });
            App.showNotification('Product deleted', 'success');
            this.loadProducts();
        } catch (e) { /* handled by api */ }
    }
};

App.registerModule('product', ProductModule);
