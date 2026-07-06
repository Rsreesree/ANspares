/* ═══════════════════════════════════════════════════════
   FLASH ACCESSORIES - Core App
   SPA Router, API Client, Utilities
   ═══════════════════════════════════════════════════════ */

const App = {
    currentModule: 'dashboard',
    modules: {},

    // ─── INITIALIZATION ────────────────────────────────
    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        this.navigate('dashboard');
    },

    // ─── NAVIGATION ────────────────────────────────────
    navigate(module) {
        this.currentModule = module;
        // Update toolbar
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.module === module);
        });
        // Load module
        const content = document.getElementById('mainContent');
        content.innerHTML = '<div class="loading" style="text-align:center;padding:60px;color:var(--text-muted)"><i class="ri-loader-4-line" style="font-size:2rem"></i><p>Loading...</p></div>';

        if (this.modules[module] && typeof this.modules[module].render === 'function') {
            setTimeout(() => {
                this.modules[module].render();
            }, 100);
        } else {
            content.innerHTML = `<div class="empty-state"><i class="ri-error-warning-line"></i><p>Module "${module}" not found</p></div>`;
        }
    },

    // ─── REGISTER MODULE ───────────────────────────────
    registerModule(name, moduleObj) {
        this.modules[name] = moduleObj;
    },

    // ─── API CLIENT ────────────────────────────────────
    async api(endpoint, options = {}) {
        try {
            const config = {
                headers: { 'Content-Type': 'application/json' },
                ...options
            };
            if (config.body && typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }
            const res = await fetch(`/api${endpoint}`, config);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'API Error');
            return data;
        } catch (err) {
            console.error('API Error:', err);
            this.showNotification(err.message, 'error');
            throw err;
        }
    },

    // ─── NOTIFICATIONS ─────────────────────────────────
    showNotification(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = {
            success: 'ri-checkbox-circle-fill',
            error: 'ri-error-warning-fill',
            warning: 'ri-alert-fill',
            info: 'ri-information-fill'
        };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ─── MODAL ─────────────────────────────────────────
    openModal(title, bodyHtml) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHtml;
        document.getElementById('modalOverlay').classList.add('active');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    },

    // ─── CONFIRM DIALOG ────────────────────────────────
    confirm(message) {
        return new Promise(resolve => {
            const html = `
                <p style="margin-bottom:20px;color:var(--text-secondary)">${message}</p>
                <div class="modal-footer" style="padding:0;border:0;justify-content:flex-end">
                    <button class="btn btn-outline" onclick="App.closeModal();App._confirmResolve(false)">Cancel</button>
                    <button class="btn btn-danger" onclick="App.closeModal();App._confirmResolve(true)">Delete</button>
                </div>
            `;
            this._confirmResolve = resolve;
            this.openModal('⚠️ Confirm', html);
        });
    },

    // ─── CLOCK ─────────────────────────────────────────
    updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }) + ' ' + now.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const el = document.getElementById('statusTime');
        if (el) el.textContent = `Time : ${timeStr}`;
    },

    // ─── FORMAT CURRENCY ───────────────────────────────
    formatCurrency(amount) {
        return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    // ─── FORMAT DATE ───────────────────────────────────
    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    },

    // ─── TODAY STRING ──────────────────────────────────
    today() {
        return new Date().toISOString().split('T')[0];
    },

    // ─── RENDER TABLE ──────────────────────────────────
    renderTable(headers, rows, emptyMsg = 'No records found') {
        if (!rows || rows.length === 0) {
            return `<div class="empty-state"><i class="ri-inbox-line"></i><p>${emptyMsg}</p></div>`;
        }
        const ths = headers.map(h => `<th class="${h.class || ''}">${h.label}</th>`).join('');
        const trs = rows.map(r => `<tr>${r}</tr>`).join('');
        return `
            <div class="table-container">
                <table class="data-table">
                    <thead><tr>${ths}</tr></thead>
                    <tbody>${trs}</tbody>
                </table>
            </div>
        `;
    }
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
