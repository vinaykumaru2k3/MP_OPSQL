-- =============================================================================
-- V5: Stored Procedures — PL/SQL with EXCEPTION handling, cursors, COMMIT
-- =============================================================================

CREATE OR REPLACE PROCEDURE sp_create_order(
    p_customer_id   IN  NUMBER,
    p_shipping_addr IN  VARCHAR2,
    p_order_id      OUT NUMBER
) AS
BEGIN
    SELECT seq_order_id.NEXTVAL INTO p_order_id FROM DUAL;

    INSERT INTO orders (order_id, customer_id, status, shipping_addr)
    VALUES (p_order_id, p_customer_id, 'PENDING', p_shipping_addr);

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END sp_create_order;
/

-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE PROCEDURE sp_add_order_item(
    p_order_id   IN NUMBER,
    p_product_id IN NUMBER,
    p_quantity   IN NUMBER
) AS
    v_price     NUMBER(12, 2);
    v_stock     NUMBER(10);
    v_item_id   NUMBER(10);
BEGIN
    -- lock row and verify stock
    SELECT price, stock_qty
    INTO   v_price, v_stock
    FROM   products
    WHERE  product_id = p_product_id
    FOR UPDATE;

    IF v_stock < p_quantity THEN
        RAISE_APPLICATION_ERROR(-20001, 'Insufficient stock for product ' || p_product_id);
    END IF;

    SELECT seq_order_item_id.NEXTVAL INTO v_item_id FROM DUAL;

    INSERT INTO order_items (item_id, order_id, product_id, quantity, unit_price)
    VALUES (v_item_id, p_order_id, p_product_id, p_quantity, v_price);

    -- decrement stock
    UPDATE products
    SET    stock_qty = stock_qty - p_quantity
    WHERE  product_id = p_product_id;

    -- recalculate order total
    UPDATE orders
    SET    total_amount = (
               SELECT SUM(quantity * unit_price * (1 - discount_pct / 100))
               FROM   order_items
               WHERE  order_id = p_order_id
           )
    WHERE  order_id = p_order_id;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END sp_add_order_item;
/

-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE PROCEDURE sp_cancel_order(
    p_order_id IN NUMBER
) AS
    v_status   VARCHAR2(20);
    CURSOR c_items IS
        SELECT product_id, quantity
        FROM   order_items
        WHERE  order_id = p_order_id;
BEGIN
    SELECT status INTO v_status FROM orders WHERE order_id = p_order_id FOR UPDATE;

    IF v_status NOT IN ('PENDING', 'CONFIRMED') THEN
        RAISE_APPLICATION_ERROR(-20002, 'Order ' || p_order_id || ' cannot be cancelled in status: ' || v_status);
    END IF;

    -- restore stock for each item
    FOR rec IN c_items LOOP
        UPDATE products
        SET    stock_qty = stock_qty + rec.quantity
        WHERE  product_id = rec.product_id;
    END LOOP;

    UPDATE orders SET status = 'CANCELLED' WHERE order_id = p_order_id;
    COMMIT;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20003, 'Order ' || p_order_id || ' not found');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END sp_cancel_order;
/
