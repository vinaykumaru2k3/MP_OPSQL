-- =============================================================================
-- V2: Tables — full Oracle DDL with PK, FK, UNIQUE, CHECK constraints
-- Showcases: VARCHAR2, NUMBER, DATE, TIMESTAMP, CLOB, BLOB, NUMBER(1) boolean
-- =============================================================================

-- ── CUSTOMERS ────────────────────────────────────────────────────────────────
CREATE TABLE customers (
    customer_id    NUMBER(10)     NOT NULL,
    email          VARCHAR2(255)  NOT NULL,
    first_name     VARCHAR2(100)  NOT NULL,
    last_name      VARCHAR2(100)  NOT NULL,
    phone          VARCHAR2(20),
    date_of_birth  DATE,
    created_at     TIMESTAMP      DEFAULT SYSDATE NOT NULL,
    updated_at     TIMESTAMP,
    status         VARCHAR2(20)   DEFAULT 'ACTIVE' NOT NULL,
    loyalty_points NUMBER(10)     DEFAULT 0,
    notes          CLOB,
    CONSTRAINT pk_customers        PRIMARY KEY (customer_id),
    CONSTRAINT uq_customers_email  UNIQUE (email),
    CONSTRAINT chk_customers_status
        CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED'))
);

-- ── CATEGORIES ───────────────────────────────────────────────────────────────
-- Self-referencing FK for hierarchical categories
CREATE TABLE categories (
    category_id    NUMBER(5)      NOT NULL,
    name           VARCHAR2(100)  NOT NULL,
    description    VARCHAR2(500),
    parent_id      NUMBER(5),
    sort_order     NUMBER(3)      DEFAULT 0,
    is_active      NUMBER(1)      DEFAULT 1 NOT NULL,
    CONSTRAINT pk_categories       PRIMARY KEY (category_id),
    CONSTRAINT uq_categories_name  UNIQUE (name),
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id) REFERENCES categories(category_id),
    CONSTRAINT chk_categories_active
        CHECK (is_active IN (0, 1))
);

-- ── PRODUCTS ─────────────────────────────────────────────────────────────────
CREATE TABLE products (
    product_id     NUMBER(10)     NOT NULL,
    sku            VARCHAR2(50)   NOT NULL,
    name           VARCHAR2(200)  NOT NULL,
    description    CLOB,
    price          NUMBER(12, 2)  NOT NULL,
    cost_price     NUMBER(12, 2),
    stock_qty      NUMBER(10)     DEFAULT 0 NOT NULL,
    reorder_level  NUMBER(10)     DEFAULT 10,
    category_id    NUMBER(5),
    image_data     BLOB,
    weight_kg      NUMBER(8, 3),
    created_at     TIMESTAMP      DEFAULT SYSDATE NOT NULL,
    is_active      NUMBER(1)      DEFAULT 1 NOT NULL,
    CONSTRAINT pk_products          PRIMARY KEY (product_id),
    CONSTRAINT uq_products_sku      UNIQUE (sku),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id),
    CONSTRAINT chk_products_price   CHECK (price >= 0),
    CONSTRAINT chk_products_stock   CHECK (stock_qty >= 0),
    CONSTRAINT chk_products_active  CHECK (is_active IN (0, 1))
);

-- ── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TABLE orders (
    order_id       NUMBER(10)     NOT NULL,
    customer_id    NUMBER(10)     NOT NULL,
    order_date     TIMESTAMP      DEFAULT SYSDATE NOT NULL,
    status         VARCHAR2(20)   DEFAULT 'PENDING' NOT NULL,
    total_amount   NUMBER(14, 2)  DEFAULT 0,
    discount_amt   NUMBER(12, 2)  DEFAULT 0,
    shipping_addr  VARCHAR2(500),
    shipped_at     TIMESTAMP,
    delivered_at   TIMESTAMP,
    notes          CLOB,
    CONSTRAINT pk_orders           PRIMARY KEY (order_id),
    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT chk_orders_status
        CHECK (status IN ('PENDING','CONFIRMED','PICKING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'))
);

-- ── ORDER_ITEMS ───────────────────────────────────────────────────────────────
CREATE TABLE order_items (
    item_id        NUMBER(10)     NOT NULL,
    order_id       NUMBER(10)     NOT NULL,
    product_id     NUMBER(10)     NOT NULL,
    quantity       NUMBER(5)      NOT NULL,
    unit_price     NUMBER(12, 2)  NOT NULL,
    discount_pct   NUMBER(5, 2)   DEFAULT 0,
    CONSTRAINT pk_order_items       PRIMARY KEY (item_id),
    CONSTRAINT uq_order_product     UNIQUE (order_id, product_id),
    CONSTRAINT fk_items_order
        FOREIGN KEY (order_id)   REFERENCES orders(order_id),
    CONSTRAINT fk_items_product
        FOREIGN KEY (product_id) REFERENCES products(product_id),
    CONSTRAINT chk_items_qty        CHECK (quantity > 0),
    CONSTRAINT chk_items_discount   CHECK (discount_pct BETWEEN 0 AND 100)
);

-- ── AUDIT_LOG ─────────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
    audit_id       NUMBER(15)     NOT NULL,
    table_name     VARCHAR2(100)  NOT NULL,
    operation      VARCHAR2(10)   NOT NULL,
    row_id         VARCHAR2(50),
    changed_by     VARCHAR2(100)  DEFAULT USER,
    changed_at     TIMESTAMP      DEFAULT SYSDATE NOT NULL,
    old_value      CLOB,
    new_value      CLOB,
    CONSTRAINT pk_audit_log         PRIMARY KEY (audit_id),
    CONSTRAINT chk_audit_operation
        CHECK (operation IN ('INSERT','UPDATE','DELETE'))
);
