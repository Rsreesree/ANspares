-- ============================================
-- BIKE SPARE PARTS SHOP - DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Products / Item Master
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    department VARCHAR(100) DEFAULT '',
    uom VARCHAR(50) DEFAULT 'PCS',
    location VARCHAR(100) DEFAULT '',
    keyword VARCHAR(255) DEFAULT '',
    description TEXT DEFAULT '',
    hsn VARCHAR(20) DEFAULT '',
    barcode VARCHAR(100) DEFAULT '',
    mrp DECIMAL(12,2) DEFAULT 0,
    sale_rate DECIMAL(12,2) DEFAULT 0,
    landing_cost DECIMAL(12,2) DEFAULT 0,
    stock_qty DECIMAL(12,2) DEFAULT 0,
    min_stock DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    address TEXT DEFAULT '',
    gstin VARCHAR(20) DEFAULT '',
    credit_limit DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    address TEXT DEFAULT '',
    gstin VARCHAR(20) DEFAULT '',
    balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Purchases
CREATE TABLE IF NOT EXISTS purchases (
    id BIGSERIAL PRIMARY KEY,
    purchase_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_id BIGINT REFERENCES suppliers(id),
    date DATE DEFAULT CURRENT_DATE,
    total DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT REFERENCES purchases(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    qty DECIMAL(12,2) DEFAULT 0,
    rate DECIMAL(12,2) DEFAULT 0,
    amount DECIMAL(12,2) DEFAULT 0
);

-- 6. Bills
CREATE TABLE IF NOT EXISTS bills (
    id BIGSERIAL PRIMARY KEY,
    bill_no VARCHAR(50) UNIQUE NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    customer_id BIGINT REFERENCES customers(id),
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    cash DECIMAL(12,2) DEFAULT 0,
    card DECIMAL(12,2) DEFAULT 0,
    upi DECIMAL(12,2) DEFAULT 0,
    paytm DECIMAL(12,2) DEFAULT 0,
    gpay DECIMAL(12,2) DEFAULT 0,
    credit DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed',
    cashier VARCHAR(100) DEFAULT '',
    counter VARCHAR(100) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Bill Items
CREATE TABLE IF NOT EXISTS bill_items (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT REFERENCES bills(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    product_name VARCHAR(255) DEFAULT '',
    product_code VARCHAR(50) DEFAULT '',
    qty DECIMAL(12,2) DEFAULT 0,
    rate DECIMAL(12,2) DEFAULT 0,
    amount DECIMAL(12,2) DEFAULT 0
);

-- 8. Supplier Payments
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    supplier_id BIGINT REFERENCES suppliers(id),
    cash DECIMAL(12,2) DEFAULT 0,
    rtgs DECIMAL(12,2) DEFAULT 0,
    chq_amount DECIMAL(12,2) DEFAULT 0,
    chq_no VARCHAR(50) DEFAULT '',
    chq_date DATE,
    bank VARCHAR(100) DEFAULT '',
    cleared BOOLEAN DEFAULT FALSE,
    discount DECIMAL(12,2) DEFAULT 0,
    narration TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Customer Receipts
CREATE TABLE IF NOT EXISTS receipts (
    id BIGSERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    customer_id BIGINT REFERENCES customers(id),
    amount DECIMAL(12,2) DEFAULT 0,
    mode VARCHAR(50) DEFAULT 'Cash',
    reference VARCHAR(100) DEFAULT '',
    narration TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
CREATE INDEX IF NOT EXISTS idx_bills_bill_no ON bills(bill_no);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_no ON purchases(purchase_no);

-- Enable Row Level Security (optional - disable for local dev)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
