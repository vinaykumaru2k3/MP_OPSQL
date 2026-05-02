-- =============================================================================
-- V4: Views — uses Oracle-specific join and subquery constructs
-- =============================================================================

CREATE OR REPLACE VIEW vw_order_summary AS
SELECT
    o.order_id,
    o.order_date,
    o.status,
    o.total_amount,
    o.discount_amt,
    c.customer_id,
    c.email,
    c.first_name || ' ' || c.last_name        AS customer_name,
    (SELECT COUNT(*)
     FROM   order_items oi
     WHERE  oi.order_id = o.order_id)         AS item_count
FROM   orders    o
JOIN   customers c ON c.customer_id = o.customer_id;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW vw_product_catalog AS
SELECT
    p.product_id,
    p.sku,
    p.name           AS product_name,
    p.description,
    p.price,
    p.cost_price,
    p.stock_qty,
    p.reorder_level,
    p.is_active,
    c.category_id,
    c.name           AS category_name
FROM  products   p
LEFT JOIN categories c ON c.category_id = p.category_id;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW vw_low_stock_alert AS
SELECT
    p.product_id,
    p.sku,
    p.name,
    p.stock_qty,
    p.reorder_level,
    c.name          AS category_name
FROM  products   p
LEFT JOIN categories c ON c.category_id = p.category_id
WHERE p.stock_qty <= p.reorder_level
  AND p.is_active = 1
ORDER BY p.stock_qty ASC;
