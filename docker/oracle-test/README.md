# SchemaForge — Phase 3.5 Oracle Test Environment

Live Oracle Free 23c database for end-to-end testing of the Live DB extraction feature.

## Quick Start

```bash
# From this directory:
cd docker/oracle-test

docker compose up -d
```

> **First boot takes 3–5 minutes.** Oracle Free needs to fully initialize before the init scripts run. Watch progress with:
> ```bash
> docker logs -f schemaforge-oracle
> ```
> Wait until you see: `DATABASE IS READY TO USE!`

---

## Connection Details (SchemaForge "Live Database" page)

| Field | Value |
|---|---|
| **Host** | `localhost` |
| **Port** | `1521` |
| **Service Name** | `FREEPDB1` |
| **Username** | `schemaforge` |
| **Password** | `SchemaForge1!` |
| **Schema** | `SCHEMAFORGE` |

---

## What's in the Schema

### Tables (6)

| Table | Purpose | Key Constraints |
|---|---|---|
| `CUSTOMERS` | Customer accounts | PK, UNIQUE(email), CHECK(status) |
| `CATEGORIES` | Self-referencing product categories | PK, UNIQUE(name), FK(parent_id→self) |
| `PRODUCTS` | Product catalog | PK, UNIQUE(sku), FK(category_id), CHECK(price≥0) |
| `ORDERS` | Customer orders | PK, FK(customer_id), CHECK(status enum) |
| `ORDER_ITEMS` | Line items on orders | PK, UNIQUE(order_id,product_id), FK(order_id), FK(product_id) |
| `AUDIT_LOG` | Change trail | PK, CHECK(operation enum) |

### Sequences (6)
`seq_customer_id`, `seq_category_id`, `seq_product_id`, `seq_order_id`, `seq_order_item_id`, `seq_audit_id`

### Indexes (13)
Beyond PK/UNIQUE: email, status, name lookups, FK columns, composite indexes on `audit_log`.

### Views (3)
- `vw_order_summary` — joins orders + customers with scalar subquery item count
- `vw_product_catalog` — products LEFT JOIN categories
- `vw_low_stock_alert` — products where `stock_qty <= reorder_level`

### Stored Procedures (3)
- `sp_create_order` — inserts order, COMMIT/ROLLBACK
- `sp_add_order_item` — FOR UPDATE stock check, decrements stock, recalculates total
- `sp_cancel_order` — cursor loop to restore stock, validates cancellable status

### Triggers (5)
- `trg_customers_bir` — BEFORE INSERT, auto-populates `customer_id`
- `trg_categories_bir` — BEFORE INSERT, auto-populates `category_id`
- `trg_products_bir` — BEFORE INSERT, auto-populates `product_id`
- `trg_orders_aud_upd` — AFTER UPDATE on orders, writes to `audit_log`
- `trg_order_items_aud_del` — AFTER DELETE on order_items, writes to `audit_log`

---

## Teardown

```bash
# Stop and remove containers + volumes (wipes all data)
docker compose down -v

# Stop only (keeps data volume)
docker compose down
```
