-- =============================================================================
-- V7: Seed Data — realistic rows to make the extracted schema meaningful
-- =============================================================================

-- Categories (self-referencing, parent first)
INSERT INTO categories (category_id, name, description, parent_id, sort_order)
VALUES (seq_category_id.NEXTVAL, 'Electronics', 'Electronic devices and accessories', NULL, 1);

INSERT INTO categories (category_id, name, description, parent_id, sort_order)
VALUES (seq_category_id.NEXTVAL, 'Clothing', 'Apparel and fashion items', NULL, 2);

INSERT INTO categories (category_id, name, description, parent_id, sort_order)
VALUES (seq_category_id.NEXTVAL, 'Laptops', 'Portable computers', 1, 1);

INSERT INTO categories (category_id, name, description, parent_id, sort_order)
VALUES (seq_category_id.NEXTVAL, 'Smartphones', 'Mobile phones', 1, 2);

INSERT INTO categories (category_id, name, description, parent_id, sort_order)
VALUES (seq_category_id.NEXTVAL, 'T-Shirts', 'Casual t-shirts', 2, 1);

-- Customers
INSERT INTO customers (customer_id, email, first_name, last_name, phone, status, loyalty_points)
VALUES (seq_customer_id.NEXTVAL, 'alice@example.com', 'Alice', 'Smith',   '+1-555-0101', 'ACTIVE', 250);

INSERT INTO customers (customer_id, email, first_name, last_name, phone, status, loyalty_points)
VALUES (seq_customer_id.NEXTVAL, 'bob@example.com',   'Bob',   'Johnson', '+1-555-0102', 'ACTIVE', 100);

INSERT INTO customers (customer_id, email, first_name, last_name, phone, status, loyalty_points)
VALUES (seq_customer_id.NEXTVAL, 'carol@example.com', 'Carol', 'Williams','+1-555-0103', 'INACTIVE', 0);

-- Products
INSERT INTO products (product_id, sku, name, price, cost_price, stock_qty, reorder_level, category_id, is_active)
VALUES (seq_product_id.NEXTVAL, 'LAP-001', 'ProBook 15 Laptop',    899.99, 650.00, 45, 10, 3, 1);

INSERT INTO products (product_id, sku, name, price, cost_price, stock_qty, reorder_level, category_id, is_active)
VALUES (seq_product_id.NEXTVAL, 'LAP-002', 'UltraSlim 13 Laptop', 1249.00, 900.00, 8,  10, 3, 1);

INSERT INTO products (product_id, sku, name, price, cost_price, stock_qty, reorder_level, category_id, is_active)
VALUES (seq_product_id.NEXTVAL, 'PHN-001', 'NexPhone X12',         699.00, 450.00, 120, 20, 4, 1);

INSERT INTO products (product_id, sku, name, price, cost_price, stock_qty, reorder_level, category_id, is_active)
VALUES (seq_product_id.NEXTVAL, 'TSH-001', 'Classic White Tee',     19.99,   8.00,  200, 50, 5, 1);

-- Orders
INSERT INTO orders (order_id, customer_id, status, total_amount, shipping_addr)
VALUES (seq_order_id.NEXTVAL, 1, 'DELIVERED', 919.98, '123 Main St, Springfield, IL 62701');

INSERT INTO orders (order_id, customer_id, status, total_amount, shipping_addr)
VALUES (seq_order_id.NEXTVAL, 1, 'SHIPPED',   699.00, '123 Main St, Springfield, IL 62701');

INSERT INTO orders (order_id, customer_id, status, total_amount, shipping_addr)
VALUES (seq_order_id.NEXTVAL, 2, 'PENDING',   1268.99, '456 Oak Ave, Portland, OR 97201');

-- Order Items
INSERT INTO order_items (item_id, order_id, product_id, quantity, unit_price)
VALUES (seq_order_item_id.NEXTVAL, 1000, 1, 1, 899.99);

INSERT INTO order_items (item_id, order_id, product_id, quantity, unit_price)
VALUES (seq_order_item_id.NEXTVAL, 1000, 4, 1,  19.99);

INSERT INTO order_items (item_id, order_id, product_id, quantity, unit_price)
VALUES (seq_order_item_id.NEXTVAL, 1001, 3, 1, 699.00);

INSERT INTO order_items (item_id, order_id, product_id, quantity, unit_price)
VALUES (seq_order_item_id.NEXTVAL, 1002, 1, 1, 899.99);

INSERT INTO order_items (item_id, order_id, product_id, quantity, unit_price)
VALUES (seq_order_item_id.NEXTVAL, 1002, 2, 1, 369.00);

COMMIT;
