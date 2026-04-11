-- sample_01_basic_ddl.sql
-- Basic Oracle DDL with common types and constraints
CREATE TABLE departments (
  dept_id    NUMBER(5)       NOT NULL,
  dept_name  VARCHAR2(100)   NOT NULL,
  created_at DATE            DEFAULT SYSDATE,
  is_active  NUMBER(1)       DEFAULT 1,
  CONSTRAINT pk_dept PRIMARY KEY (dept_id)
);
CREATE TABLE employees (
  emp_id     NUMBER(10)      NOT NULL,
  first_name VARCHAR2(50)    NOT NULL,
  last_name  VARCHAR2(50)    NOT NULL,
  salary     NUMBER(12,2),
  dept_id    NUMBER(5),
  hire_date  DATE,
  notes      CLOB,
  CONSTRAINT pk_emp   PRIMARY KEY (emp_id),
  CONSTRAINT fk_dept  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);
CREATE TABLE audit_log (
  log_id     NUMBER(15)      NOT NULL,
  table_name VARCHAR2(100)   NOT NULL,
  action     VARCHAR2(10)    NOT NULL,
  action_at  DATE            DEFAULT SYSDATE,
  CONSTRAINT pk_log   PRIMARY KEY (log_id)
);
