-- =============================================================================
-- V3: Indexes — performance and lookup indexes beyond PK/UNIQUE constraints
-- =============================================================================

-- Customers
-- NOTE: idx_customers_email and idx_products_sku are implicitly created by UNIQUE constraints
-- and are intentionally omitted here to avoid ORA-01408.
CREATE INDEX idx_customers_status   ON customers  (status);
CREATE INDEX idx_customers_lastname ON customers  (last_name, first_name);

-- Products
CREATE INDEX idx_products_category  ON products   (category_id);
CREATE INDEX idx_products_price     ON products   (price);
CREATE INDEX idx_products_active    ON products   (is_active, stock_qty);
-- idx_products_sku omitted — covered by UNIQUE constraint

-- Orders
CREATE INDEX idx_orders_customer    ON orders     (customer_id);
CREATE INDEX idx_orders_date        ON orders     (order_date);
CREATE INDEX idx_orders_status      ON orders     (status);

-- Order Items
CREATE INDEX idx_items_order        ON order_items (order_id);
CREATE INDEX idx_items_product      ON order_items (product_id);

-- Audit
CREATE INDEX idx_audit_table_date   ON audit_log  (table_name, changed_at);
