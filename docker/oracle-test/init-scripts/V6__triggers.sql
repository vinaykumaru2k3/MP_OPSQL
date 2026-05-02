-- =============================================================================
-- V6: Triggers — BEFORE INSERT auto-ID, AFTER UPDATE/DELETE audit capture
-- =============================================================================

-- Auto-populate customer_id from sequence (BEFORE INSERT)
CREATE OR REPLACE TRIGGER trg_customers_bir
BEFORE INSERT ON customers
FOR EACH ROW
WHEN (NEW.customer_id IS NULL)
BEGIN
    SELECT seq_customer_id.NEXTVAL INTO :NEW.customer_id FROM DUAL;
END trg_customers_bir;
/

-- Auto-populate category_id from sequence (BEFORE INSERT)
CREATE OR REPLACE TRIGGER trg_categories_bir
BEFORE INSERT ON categories
FOR EACH ROW
WHEN (NEW.category_id IS NULL)
BEGIN
    SELECT seq_category_id.NEXTVAL INTO :NEW.category_id FROM DUAL;
END trg_categories_bir;
/

-- Auto-populate product_id from sequence (BEFORE INSERT)
CREATE OR REPLACE TRIGGER trg_products_bir
BEFORE INSERT ON products
FOR EACH ROW
WHEN (NEW.product_id IS NULL)
BEGIN
    SELECT seq_product_id.NEXTVAL INTO :NEW.product_id FROM DUAL;
END trg_products_bir;
/

-- Audit trigger: capture ORDERS status changes (AFTER UPDATE)
CREATE OR REPLACE TRIGGER trg_orders_aud_upd
AFTER UPDATE OF status, total_amount ON orders
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (
        audit_id, table_name, operation, row_id,
        old_value, new_value
    ) VALUES (
        seq_audit_id.NEXTVAL,
        'ORDERS',
        'UPDATE',
        TO_CHAR(:OLD.order_id),
        'status=' || :OLD.status || ',total=' || TO_CHAR(:OLD.total_amount),
        'status=' || :NEW.status || ',total=' || TO_CHAR(:NEW.total_amount)
    );
END trg_orders_aud_upd;
/

-- Audit trigger: capture ORDER_ITEMS deletions (AFTER DELETE)
CREATE OR REPLACE TRIGGER trg_order_items_aud_del
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (
        audit_id, table_name, operation, row_id, old_value
    ) VALUES (
        seq_audit_id.NEXTVAL,
        'ORDER_ITEMS',
        'DELETE',
        TO_CHAR(:OLD.item_id),
        'order_id=' || :OLD.order_id ||
        ',product_id=' || :OLD.product_id ||
        ',qty=' || :OLD.quantity
    );
END trg_order_items_aud_del;
/
