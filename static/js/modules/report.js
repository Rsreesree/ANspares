/* ═══════════════════════════════════════════════════════
   SALE DETAIL REPORT MODULE
   ═══════════════════════════════════════════════════════ */

const ReportModule = {
    async render() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="animate-in">
                <div class="page-header">
                    <h1 class="page-title"><i class="ri-bar-chart-grouped-fill"></i> Sale Detail Report</h1>
                </div>

                <div class="filter-panel" style="display:flex;align-items:center;gap:15px;margin-bottom:15px">
                    <div style="width:20px;height:20px;background:var(--success)"></div> <span style="font-weight:bold">OPEN</span>
                    <div style="width:20px;height:20px;background:var(--danger)"></div> <span style="font-weight:bold">CLOSE</span>
                    
                    <div style="margin-left:auto;display:flex;align-items:center;gap:10px">
                        <label>From Date</label><input type="date" class="form-control" id="repFrom" value="${App.today()}">
                        <label>To Date</label><input type="date" class="form-control" id="repTo" value="${App.today()}">
                        <button class="btn btn-success" onclick="ReportModule.loadReport()"><i class="ri-check-line"></i> OK</button>
                    </div>
                    <div style="font-size:1.4rem;font-weight:bold;color:var(--accent);margin-left:20px">
                        Total Amount : <span id="repTotalAmt">₹0.00</span>
                    </div>
                </div>

                <div id="reportTable">Loading...</div>
            </div>
        `;
        this.loadReport();
    },

    async loadReport() {
        const fromDate = document.getElementById('repFrom')?.value || App.today();
        const toDate = document.getElementById('repTo')?.value || App.today();
        
        const params = new URLSearchParams({ from_date: fromDate, to_date: toDate });
        document.getElementById('reportTable').innerHTML = '<div class="empty-state"><p>Loading report...</p></div>';

        try {
            const data = await App.api(`/reports/sales?${params.toString()}`);
            if (document.getElementById('repTotalAmt')) {
                document.getElementById('repTotalAmt').textContent = App.formatCurrency(data.summary.total_amount);
            }

            const headers = [
                { label: 'No' }, { label: 'Counter Name' }, { label: 'Cashier Name' }, 
                { label: 'S(hift)' }, { label: 'No.Of Bills', class:'text-right' }, 
                { label: 'Cash', class:'text-right' }, { label: 'CARD', class:'text-right' }, 
                { label: 'PAYTM', class:'text-right' }, { label: 'GPAY', class:'text-right' }, 
                { label: 'UPI', class:'text-right' }, { label: 'Credit', class:'text-right' }
            ];

            // In KASSAPOS this rolls up by counter/cashier. We'll group them.
            const groups = {};
            data.bills.forEach(b => {
                const key = `${b.counter || 'MAIN'}_${b.cashier || 'ADMIN'}`;
                if(!groups[key]) groups[key] = { counter: b.counter||'MAIN', cashier: b.cashier||'ADMIN', bills:0, cash:0, card:0, paytm:0, gpay:0, upi:0, credit:0 };
                groups[key].bills++;
                groups[key].cash += parseFloat(b.cash||0);
                groups[key].card += parseFloat(b.card||0);
                groups[key].paytm += parseFloat(b.paytm||0);
                groups[key].gpay += parseFloat(b.gpay||0);
                groups[key].upi += parseFloat(b.upi||0);
                groups[key].credit += parseFloat(b.credit||0);
            });

            const rows = Object.values(groups).map((g, i) => `
                <td>${i + 1}</td>
                <td><span style="color:#d97706">${g.counter}</span></td>
                <td>${g.cashier}</td>
                <td>1</td>
                <td class="text-right">${g.bills}</td>
                <td class="text-right">${App.formatCurrency(g.cash)}</td>
                <td class="text-right">${App.formatCurrency(g.card)}</td>
                <td class="text-right">${App.formatCurrency(g.paytm)}</td>
                <td class="text-right">${App.formatCurrency(g.gpay)}</td>
                <td class="text-right">${App.formatCurrency(g.upi)}</td>
                <td class="text-right">${App.formatCurrency(g.credit)}</td>
            `);

            document.getElementById('reportTable').innerHTML = App.renderTable(headers, rows, 'No sales data for selected date range');
        } catch (e) {
            document.getElementById('reportTable').innerHTML = '<div class="empty-state"><p>Failed to load repor</p></div>';
        }
    }
};

App.registerModule('report', ReportModule);
