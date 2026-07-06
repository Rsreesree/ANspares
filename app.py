import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, date

load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase client
SUPABASE_URL = "https://mistraafogfaogdjxwqj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pc3RyYWFmb2dmYW9nZGp4d3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMTExOTYsImV4cCI6MjA5ODg4NzE5Nn0.hKagNnl5yGSvtei2PKwL17exizmXBGL-GTqHw24nvfE"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ─── PAGES ────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


# ─── DASHBOARD ────────────────────────────────────────
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    try:
        today = date.today().isoformat()
        # Today's sales
        bills_res = supabase.table('bills').select('*').eq('date', today).execute()
        total_sales = sum(float(b.get('total', 0)) for b in bills_res.data)
        total_bills = len(bills_res.data)
        cash_total = sum(float(b.get('cash', 0)) for b in bills_res.data)
        card_total = sum(float(b.get('card', 0)) for b in bills_res.data)
        upi_total = sum(float(b.get('upi', 0)) for b in bills_res.data)

        # Low stock items
        low_stock = supabase.table('products').select('id,code,name,stock_qty,min_stock').execute()
        low_items = [p for p in low_stock.data if float(p.get('stock_qty', 0)) <= float(p.get('min_stock', 0))]

        # Counts
        products_count = supabase.table('products').select('id', count='exact').execute()
        customers_count = supabase.table('customers').select('id', count='exact').execute()
        suppliers_count = supabase.table('suppliers').select('id', count='exact').execute()

        return jsonify({
            'today_sales': total_sales,
            'today_bills': total_bills,
            'cash_total': cash_total,
            'card_total': card_total,
            'upi_total': upi_total,
            'low_stock_items': low_items[:10],
            'products_count': products_count.count or 0,
            'customers_count': customers_count.count or 0,
            'suppliers_count': suppliers_count.count or 0
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── PRODUCTS ─────────────────────────────────────────
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        search = request.args.get('search', '')
        brand = request.args.get('brand', '')
        category = request.args.get('category', '')

        query = supabase.table('products').select('*')
        if search:
            query = query.or_(f"name.ilike.%{search}%,code.ilike.%{search}%,barcode.ilike.%{search}%")
        if brand:
            query = query.eq('brand', brand)
        if category:
            query = query.eq('category', category)

        res = query.order('name').execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products', methods=['POST'])
def add_product():
    try:
        data = request.json
        res = supabase.table('products').insert(data).execute()
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/<int:id>', methods=['PUT'])
def update_product(id):
    try:
        data = request.json
        data['updated_at'] = datetime.now().isoformat()
        res = supabase.table('products').update(data).eq('id', id).execute()
        return jsonify(res.data[0] if res.data else {})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    try:
        supabase.table('products').delete().eq('id', id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/filters', methods=['GET'])
def get_product_filters():
    try:
        products = supabase.table('products').select('brand,category,department,uom,location').execute()
        brands = sorted(set(p['brand'] for p in products.data if p.get('brand')))
        categories = sorted(set(p['category'] for p in products.data if p.get('category')))
        departments = sorted(set(p['department'] for p in products.data if p.get('department')))
        uoms = sorted(set(p['uom'] for p in products.data if p.get('uom')))
        locations = sorted(set(p['location'] for p in products.data if p.get('location')))
        return jsonify({
            'brands': brands, 'categories': categories,
            'departments': departments, 'uoms': uoms, 'locations': locations
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── CUSTOMERS ────────────────────────────────────────
@app.route('/api/customers', methods=['GET'])
def get_customers():
    try:
        search = request.args.get('search', '')
        query = supabase.table('customers').select('*')
        if search:
            query = query.or_(f"name.ilike.%{search}%,phone.ilike.%{search}%")
        res = query.order('name').execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/customers', methods=['POST'])
def add_customer():
    try:
        res = supabase.table('customers').insert(request.json).execute()
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/customers/<int:id>', methods=['PUT'])
def update_customer(id):
    try:
        res = supabase.table('customers').update(request.json).eq('id', id).execute()
        return jsonify(res.data[0] if res.data else {})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    try:
        supabase.table('customers').delete().eq('id', id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── SUPPLIERS ────────────────────────────────────────
@app.route('/api/suppliers', methods=['GET'])
def get_suppliers():
    try:
        search = request.args.get('search', '')
        query = supabase.table('suppliers').select('*')
        if search:
            query = query.or_(f"name.ilike.%{search}%,phone.ilike.%{search}%")
        res = query.order('name').execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/suppliers', methods=['POST'])
def add_supplier():
    try:
        res = supabase.table('suppliers').insert(request.json).execute()
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/suppliers/<int:id>', methods=['PUT'])
def update_supplier(id):
    try:
        res = supabase.table('suppliers').update(request.json).eq('id', id).execute()
        return jsonify(res.data[0] if res.data else {})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/suppliers/<int:id>', methods=['DELETE'])
def delete_supplier(id):
    try:
        supabase.table('suppliers').delete().eq('id', id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── PURCHASES ────────────────────────────────────────
@app.route('/api/purchases', methods=['GET'])
def get_purchases():
    try:
        res = supabase.table('purchases').select('*, suppliers(name)').order('created_at', desc=True).execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/purchases', methods=['POST'])
def add_purchase():
    try:
        data = request.json
        items = data.pop('items', [])

        # Generate purchase number
        count = supabase.table('purchases').select('id', count='exact').execute()
        purchase_no = f"PUR-{(count.count or 0) + 1:06d}"
        data['purchase_no'] = purchase_no
        data['total'] = sum(float(i.get('amount', 0)) for i in items)
        data['net_amount'] = data['total'] - float(data.get('discount', 0))

        res = supabase.table('purchases').insert(data).execute()
        purchase_id = res.data[0]['id']

        # Insert items and update stock
        for item in items:
            item['purchase_id'] = purchase_id
            supabase.table('purchase_items').insert(item).execute()
            # Update product stock
            product = supabase.table('products').select('stock_qty').eq('id', item['product_id']).execute()
            if product.data:
                new_qty = float(product.data[0]['stock_qty']) + float(item['qty'])
                supabase.table('products').update({
                    'stock_qty': new_qty,
                    'landing_cost': float(item['rate']),
                    'updated_at': datetime.now().isoformat()
                }).eq('id', item['product_id']).execute()

        return jsonify(res.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/purchases/<int:id>/items', methods=['GET'])
def get_purchase_items(id):
    try:
        res = supabase.table('purchase_items').select('*, products(code, name)').eq('purchase_id', id).execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── BILLING ─────────────────────────────────────────
@app.route('/api/bills', methods=['GET'])
def get_bills():
    try:
        from_date = request.args.get('from_date', '')
        to_date = request.args.get('to_date', '')
        query = supabase.table('bills').select('*')
        if from_date:
            query = query.gte('date', from_date)
        if to_date:
            query = query.lte('date', to_date)
        res = query.order('created_at', desc=True).execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/bills', methods=['POST'])
def add_bill():
    try:
        data = request.json
        items = data.pop('items', [])

        # Generate bill number
        count = supabase.table('bills').select('id', count='exact').execute()
        bill_no = f"BILL-{(count.count or 0) + 1:06d}"
        data['bill_no'] = bill_no
        data['date'] = date.today().isoformat()

        res = supabase.table('bills').insert(data).execute()
        bill_id = res.data[0]['id']

        # Insert items and update stock
        for item in items:
            item['bill_id'] = bill_id
            supabase.table('bill_items').insert(item).execute()
            # Decrease stock
            product = supabase.table('products').select('stock_qty').eq('id', item['product_id']).execute()
            if product.data:
                new_qty = float(product.data[0]['stock_qty']) - float(item['qty'])
                supabase.table('products').update({
                    'stock_qty': max(0, new_qty),
                    'updated_at': datetime.now().isoformat()
                }).eq('id', item['product_id']).execute()

        # If credit sale, update customer balance
        credit_amount = float(data.get('credit', 0))
        if credit_amount > 0 and data.get('customer_id'):
            customer = supabase.table('customers').select('balance').eq('id', data['customer_id']).execute()
            if customer.data:
                new_balance = float(customer.data[0].get('balance', 0)) + credit_amount
                supabase.table('customers').update({'balance': new_balance}).eq('id', data['customer_id']).execute()

        return jsonify({**res.data[0], 'bill_no': bill_no}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/bills/<int:id>/items', methods=['GET'])
def get_bill_items(id):
    try:
        res = supabase.table('bill_items').select('*').eq('bill_id', id).execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── PAYMENTS (Supplier) ─────────────────────────────
@app.route('/api/payments', methods=['GET'])
def get_payments():
    try:
        date_val = request.args.get('date', '')
        query = supabase.table('payments').select('*, suppliers(name)')
        if date_val:
            query = query.eq('date', date_val)
        res = query.order('created_at', desc=True).execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/payments', methods=['POST'])
def add_payment():
    try:
        data = request.json
        res = supabase.table('payments').insert(data).execute()
        # Update supplier balance
        total_paid = float(data.get('cash', 0)) + float(data.get('rtgs', 0)) + float(data.get('chq_amount', 0))
        if data.get('supplier_id') and total_paid > 0:
            supplier = supabase.table('suppliers').select('balance').eq('id', data['supplier_id']).execute()
            if supplier.data:
                new_balance = float(supplier.data[0].get('balance', 0)) - total_paid
                supabase.table('suppliers').update({'balance': new_balance}).eq('id', data['supplier_id']).execute()
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── RECEIPTS (Customer) ─────────────────────────────
@app.route('/api/receipts', methods=['GET'])
def get_receipts():
    try:
        res = supabase.table('receipts').select('*, customers(name)').order('created_at', desc=True).execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/receipts', methods=['POST'])
def add_receipt():
    try:
        data = request.json
        res = supabase.table('receipts').insert(data).execute()
        # Update customer balance
        amount = float(data.get('amount', 0))
        if data.get('customer_id') and amount > 0:
            customer = supabase.table('customers').select('balance').eq('id', data['customer_id']).execute()
            if customer.data:
                new_balance = float(customer.data[0].get('balance', 0)) - amount
                supabase.table('customers').update({'balance': new_balance}).eq('id', data['customer_id']).execute()
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── STOCK REPORT ─────────────────────────────────────
@app.route('/api/stock/report', methods=['GET'])
def get_stock_report():
    try:
        query = supabase.table('products').select('*')

        brand = request.args.get('brand', '')
        category = request.args.get('category', '')
        department = request.args.get('department', '')
        supplier = request.args.get('supplier', '')
        uom = request.args.get('uom', '')
        location = request.args.get('location', '')
        keyword = request.args.get('keyword', '')
        code = request.args.get('code', '')
        stock_filter = request.args.get('stock_filter', 'all')

        if brand:
            query = query.eq('brand', brand)
        if category:
            query = query.eq('category', category)
        if department:
            query = query.eq('department', department)
        if uom:
            query = query.eq('uom', uom)
        if location:
            query = query.eq('location', location)
        if keyword:
            query = query.ilike('keyword', f'%{keyword}%')
        if code:
            query = query.ilike('code', f'%{code}%')

        res = query.order('name').execute()
        data = res.data

        # Apply stock filters
        if stock_filter == 'zero':
            data = [p for p in data if float(p.get('stock_qty', 0)) == 0]
        elif stock_filter == 'with':
            data = [p for p in data if float(p.get('stock_qty', 0)) > 0]
        elif stock_filter == 'without':
            data = [p for p in data if float(p.get('stock_qty', 0)) <= 0]

        # Calculate stock value
        rate_type = request.args.get('rate_type', 'landing_cost')
        for p in data:
            qty = float(p.get('stock_qty', 0))
            if rate_type == 'landing_cost':
                p['stock_value'] = qty * float(p.get('landing_cost', 0))
            elif rate_type == 'sale_rate':
                p['stock_value'] = qty * float(p.get('sale_rate', 0))
            elif rate_type == 'mrp':
                p['stock_value'] = qty * float(p.get('mrp', 0))
            else:
                p['stock_value'] = 0

        total_value = sum(p.get('stock_value', 0) for p in data)
        return jsonify({'items': data, 'total_value': total_value, 'total_items': len(data)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── SALE DETAIL REPORT ──────────────────────────────
@app.route('/api/reports/sales', methods=['GET'])
def get_sales_report():
    try:
        from_date = request.args.get('from_date', date.today().isoformat())
        to_date = request.args.get('to_date', date.today().isoformat())

        res = supabase.table('bills').select('*').gte('date', from_date).lte('date', to_date).execute()
        bills = res.data

        total_amount = sum(float(b.get('total', 0)) for b in bills)
        total_cash = sum(float(b.get('cash', 0)) for b in bills)
        total_card = sum(float(b.get('card', 0)) for b in bills)
        total_upi = sum(float(b.get('upi', 0)) for b in bills)
        total_paytm = sum(float(b.get('paytm', 0)) for b in bills)
        total_gpay = sum(float(b.get('gpay', 0)) for b in bills)
        total_credit = sum(float(b.get('credit', 0)) for b in bills)

        return jsonify({
            'bills': bills,
            'summary': {
                'total_amount': total_amount,
                'total_bills': len(bills),
                'cash': total_cash,
                'card': total_card,
                'upi': total_upi,
                'paytm': total_paytm,
                'gpay': total_gpay,
                'credit': total_credit
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── REPRINT BILL ─────────────────────────────────────
@app.route('/api/bills/search', methods=['GET'])
def search_bills():
    try:
        bill_no = request.args.get('bill_no', '')
        query = supabase.table('bills').select('*')
        if bill_no:
            query = query.ilike('bill_no', f'%{bill_no}%')
        res = query.order('created_at', desc=True).limit(50).execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── BARCODE ──────────────────────────────────────────
@app.route('/api/barcode/purchase/<int:id>', methods=['GET'])
def get_barcode_items(id):
    try:
        res = supabase.table('purchase_items').select('*, products(code, name, sale_rate, barcode)').eq('purchase_id', id).execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
