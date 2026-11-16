-- AutoParts store database schema (PostgreSQL / Neon)
--
-- Mirrors the tables currently in our Neon database, which follow the
-- E-R and schema diagrams. Run it on an EMPTY database, for example a new
-- Neon branch (`npm run db:setup` in backend/ does this safely).
--
-- store and employee reference each other (store.manager_id and
-- employee.store_number), so store is created first and its manager
-- foreign key is added after employee exists.

CREATE TABLE store (
    store_number  INTEGER       PRIMARY KEY,
    street        VARCHAR(255)  NOT NULL,
    city          VARCHAR(255)  NOT NULL,
    state         CHAR(2)       NOT NULL,
    zip           VARCHAR(10)   NOT NULL,
    phone_number  VARCHAR(10)   NOT NULL,
    manager_id    INTEGER
);

CREATE TABLE employee (
    employee_id    INTEGER       PRIMARY KEY,
    username       VARCHAR(32)   NOT NULL UNIQUE,
    password_hash  VARCHAR(255)  NOT NULL,
    first_name     VARCHAR(32)   NOT NULL,
    last_name      VARCHAR(32)   NOT NULL,
    work_email     VARCHAR(255)  NOT NULL UNIQUE,
    phone_number   VARCHAR(10)   NOT NULL,
    store_number   INTEGER,
    CONSTRAINT employee_store FOREIGN KEY (store_number)
        REFERENCES store (store_number) ON DELETE SET NULL
);

ALTER TABLE store
    ADD CONSTRAINT manager_id FOREIGN KEY (manager_id)
        REFERENCES employee (employee_id) ON DELETE SET NULL;

CREATE TABLE customer (
    username       VARCHAR(32)   PRIMARY KEY,
    password_hash  VARCHAR(255)  NOT NULL,
    first_name     VARCHAR(32)   NOT NULL,
    last_name      VARCHAR(32)   NOT NULL,
    email          VARCHAR(255)  NOT NULL UNIQUE,
    phone_number   CHAR(10)      UNIQUE,
    street         VARCHAR(255),
    city           VARCHAR(255),
    state          CHAR(2),
    zip            VARCHAR(10)
);

CREATE TABLE part (
    part_id         INTEGER        PRIMARY KEY,
    name            VARCHAR(255)   NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2)  NOT NULL,
    part_condition  VARCHAR(32)    NOT NULL,
    CONSTRAINT chk_price_zero_plus CHECK (price >= 0),
    CONSTRAINT chk_condition CHECK (part_condition IN ('new', 'rebuilt'))
);

-- Stock of each part at each store (the "inventory" relationship).
CREATE TABLE inventory (
    store_number  INTEGER  NOT NULL,
    part_id       INTEGER  NOT NULL,
    quantity      INTEGER  NOT NULL DEFAULT 0,
    CONSTRAINT store_and_part PRIMARY KEY (store_number, part_id),
    CONSTRAINT part_id FOREIGN KEY (part_id) REFERENCES part (part_id),
    CONSTRAINT chk_quanity_zero_plus CHECK (quantity >= 0)
);

CREATE TABLE orders (
    order_id           VARCHAR(32)  PRIMARY KEY,
    reorder_of         VARCHAR(32)  DEFAULT NULL,
    customer_username  VARCHAR(32)  NOT NULL,
    store_number       INTEGER      NOT NULL,
    order_date         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_online          BOOLEAN      NOT NULL DEFAULT false,
    status             VARCHAR(32)  NOT NULL DEFAULT 'pending',
    employee_id        INTEGER      NOT NULL,
    CONSTRAINT reorder_of FOREIGN KEY (reorder_of) REFERENCES orders (order_id),
    CONSTRAINT customer_username FOREIGN KEY (customer_username) REFERENCES customer (username),
    CONSTRAINT store_number FOREIGN KEY (store_number) REFERENCES store (store_number),
    CONSTRAINT employee_id FOREIGN KEY (employee_id) REFERENCES employee (employee_id),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'paid', 'processing', 'shipped',
        'completed', 'cancelled', 'partially_returned', 'returned'))
);

CREATE TABLE order_item (
    order_id    VARCHAR(32)    NOT NULL,
    part_id     INTEGER        NOT NULL,
    quantity    INTEGER        NOT NULL,
    unit_price  NUMERIC(10,2)  NOT NULL,
    CONSTRAINT order_id_part_id PRIMARY KEY (order_id, part_id),
    CONSTRAINT order_id FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT part_id FOREIGN KEY (part_id) REFERENCES part (part_id),
    CONSTRAINT chk_quantity_more_than_zero CHECK (quantity > 0),
    CONSTRAINT price_zero_plus CHECK (unit_price >= 0)
);

CREATE TABLE payment (
    payment_id  VARCHAR(32)    PRIMARY KEY,
    order_id    VARCHAR(32)    NOT NULL,
    method      VARCHAR(32)    NOT NULL,
    amount      NUMERIC(10,2)  NOT NULL,
    card_num    VARCHAR(12),
    status      VARCHAR(32)    NOT NULL DEFAULT 'pending',
    paid_at     TIMESTAMP,
    CONSTRAINT order_id FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT chk_amount_zero_plus CHECK (amount >= 0),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'paid', 'processing', 'shipped',
        'completed', 'cancelled', 'partially_returned', 'returned'))
);

CREATE TABLE delivery (
    delivery_id      VARCHAR(32)   PRIMARY KEY,
    order_id         VARCHAR(32)   NOT NULL,
    ship_street      VARCHAR(255)  NOT NULL,
    ship_city        VARCHAR(255)  NOT NULL,
    ship_state       CHAR(2)       NOT NULL,
    ship_zip         VARCHAR(10)   NOT NULL,
    tracking_number  VARCHAR(32),
    date_shipped     TIMESTAMP,
    date_arrived     TIMESTAMP,
    CONSTRAINT order_id FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT chk_ship_dates CHECK (date_arrived IS NULL OR date_shipped IS NULL
        OR date_arrived >= date_shipped)
);
