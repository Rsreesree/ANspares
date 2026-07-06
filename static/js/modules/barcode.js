/* ═══════════════════════════════════════════════════════
   BARCODE LABEL PRINT MODULE
   ═══════════════════════════════════════════════════════ */

const BarcodeModule = {
    purchases: [],
    items: [],

    async render() {
        // Load Libre Barcode font just for this module
        if (!document.getElementById('barcodeFont')) {
            const link = document.createElement('link');
            link.id = 'barcodeFont';
            link.href = 'https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        try { this.purchases = await App.api('/purchases'); } catch(e) {}
        
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-barcode-fill"></i> Barcode Label Print</h1>
                    <button class="btn btn-success" onclick="BarcodeModule.print()"><i class="ri-printer-line"></i> Print Selected</button>
                </div>

                <div class="card mb-2" style="padding:16px">
                    <div class="form-inline">
                        <label>Select Purchase No:</label>
                        <select class="form-control" style="width:250px" onchange="BarcodeModule.loadItems(this.value)">
                            <option value="">-- Select --</option>
                            ${this.purchases.map(p => `<option value="${p.id}">${p.purchase_no} (${App.formatDate(p.date)})</option>`).join('')}
                        </select>
                        
                        <label style="margin-left:20px">Model Name:</label>
                        <select class="form-control" style="width:120px"><option>50X40</option><option>38X25</option></select>
                        
                        <button class="btn btn-outline" style="margin-left:auto" onclick="BarcodeModule.selectAll(true)">Select All</button>
                        <button class="btn btn-outline" onclick="BarcodeModule.selectAll(false)">Deselect All</button>
                    </div>
                </div>

                <div id="barcodeTableArea">
                    <div class="empty-state"><i class="ri-barcode-box-line"></i><p>Select a purchase to load items</p></div>
                </div>

                <div class="card mt-2 hidden" id="previewArea" style="background:#fff;color:#000">
                    <h3 style="margin-bottom:15px;text-align:center;color:#333;font-family:var(--font)">Print Preview</h3>
                    <div class="barcode-grid" id="barcodeGrid"></div>
                </div>
            </div>
        `;
    },

    async loadItems(purchaseId) {
        if (!purchaseId) {
            document.getElementById('barcodeTableArea').innerHTML = '<div class="empty-state"><p>Select a purchase to load items</p></div>';
            document.getElementById('previewArea').classList.add('hidden');
            return;
        }

        try {
            const res = await App.api(`/barcode/purchase/${purchaseId}`);
            this.items = res.map(r => ({
                id: r.id, 
                code: r.products?.code,
                desc: r.products?.name, 
                rate: r.products?.sale_rate,
                barcode: r.products?.barcode || r.products?.code, // Fallback to code
                qty: parseFloat(r.qty),
                selected: true
            }));
            this.renderTable();
            this.renderPreview();
        } catch (e) {
            document.getElementById('barcodeTableArea').innerHTML = '<div class="empty-state"><p>Failed to load items</p></div>';
        }
    },

    renderTable() {
        let totalQty = this.items.filter(i => i.selected).reduce((sum, i) => sum + i.qty, 0);
        const headers = [
            { label: 'S.No' }, { label: 'Code' }, { label: 'Description' }, 
            { label: 'Sale Rate' }, { label: 'Print' }, { label: 'No Of Qty' }
        ];
        const rows = this.items.map((it, i) => `
            <td>${i + 1}</td>
            <td><span class="badge badge-info">${it.code}</span></td>
            <td>${it.desc}</td>
            <td>${App.formatCurrency(it.rate)}</td>
            <td><input type="checkbox" ${it.selected ? 'checked' : ''} onchange="BarcodeModule.toggleSel(${i}, this.checked)"></td>
            <td><input type="number" class="form-control" style="width:80px;height:28px" value="${it.qty}" onchange="BarcodeModule.updateQty(${i}, this.value)"></td>
        `);
        document.getElementById('barcodeTableArea').innerHTML = App.renderTable(headers, rows) + 
            `<div style="text-align:right;margin-top:10px;font-weight:bold">Total Print Qty: ${totalQty}</div>`;
    },

    toggleSel(idx, val) { this.items[idx].selected = val; this.renderTable(); this.renderPreview(); },
    updateQty(idx, val) { this.items[idx].qty = parseInt(val) || 0; this.renderTable(); this.renderPreview(); },
    selectAll(val) { this.items.forEach(i => i.selected = val); this.renderTable(); this.renderPreview(); },

    renderPreview() {
        const grid = document.getElementById('barcodeGrid');
        const preview = document.getElementById('previewArea');
        if (this.items.length === 0) { preview.classList.add('hidden'); return; }
        
        let html = '';
        this.items.filter(i => i.selected).forEach(it => {
            for(let j=0; j<it.qty; j++) {
                html += `
                    <div class="barcode-label" style="background:#fff;border-color:#ccc">
                        <div style="font-size:0.75rem;font-weight:bold;margin-bottom:4px;color:#333">${it.desc.substring(0,20)}</div>
                        <div class="barcode-text" style="color:#000">*${it.barcode}*</div>
                        <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-top:4px;color:#333">
                            <span>Code: ${it.code}</span>
                            <span style="font-weight:bold">MRP: ₹${it.rate}</span>
                        </div>
                    </div>
                `;
            }
        });
        grid.innerHTML = html;
        preview.classList.remove('hidden');
    },

    print() {
        const totalQty = this.items.filter(i => i.selected).reduce((sum, i) => sum + i.qty, 0);
        if (totalQty === 0) { App.showNotification('No labels selected for printing', 'warning'); return; }
        App.showNotification(`Printing ${totalQty} labels successfully`, 'success');
        // Simulated print prompt
    }
};

App.registerModule('barcode', BarcodeModule);
