-- Example data, copied from our Neon database on 2026-11-16.
--
-- One change: every password_hash is a real bcrypt hash of the test
-- password "password123", so the login routes can check passwords.
-- (In Neon these are currently plain-text placeholders.)

-- Stores first without managers, because store and employee reference each other.
INSERT INTO store (store_number, street, city, state, zip, phone_number, manager_id) VALUES
    (1, '808 Industry Loop',     'Denton', 'TX', '76201', '1352467980', NULL),
    (2, '1548 University Drive', 'Denton', 'TX', '76203', '9405651234', NULL);

INSERT INTO employee (employee_id, username, password_hash, first_name, last_name, work_email, phone_number, store_number) VALUES
    (1, 'MannyGer246', '$2b$10$sCcgJvB60T.sh6Oq6P6G3eVdvXut/SNHxfpv2cKMI7f5Rh0uRtPkO', 'Manny',     'Ger',       'MannyGer@AutoParts.com',           '5552461298', 1),
    (2, 'SquidTen11',  '$2b$10$3TLoyFaX6WoFOEPhqol6H.AOidiArp5l/mo3IWy24BHB09g9qqxa2', 'Squidward', 'Tentacles', 'SquidwardTentacles@AutoParts.com', '3435658888', 2);

UPDATE store SET manager_id = 1 WHERE store_number = 1;

INSERT INTO customer (username, password_hash, first_name, last_name, email, phone_number, street, city, state, zip) VALUES
    ('JohnSmith123', '$2b$10$jc44YUm2oJlmW0IXQZYWZuNfQxbl7fMm.Xwx6sNizQA7g4PGrRSv6', 'John', 'Smith', 'JohnSmith@gmail.com',    '1234567890', '123 Street St',     'Denton', 'TX', '76201'),
    ('Jane-Doe-456', '$2b$10$i/z/pamjJ6eLAHmp/gA77um5MaokijCgVK.KCSgnXWwbXNAlvXuce', 'Jane', 'Doe',   'crazycatlady@yahoo.com', '5551947656', '1101 Union Circle', 'Denton', 'TX', '76203');

INSERT INTO part (part_id, name, description, price, part_condition) VALUES
    (1, 'Spark Plug',    'It plugs the sparks',                 13.49,  'new'),
    (2, 'American Tire', NULL,                                  204.99, 'new'),
    (3, 'Bus wheel',     'Goes round and round',                399.95, 'new'),
    (4, 'Car battery',   'Provides electricity to car systems', 127.89, 'new');

INSERT INTO inventory (store_number, part_id, quantity) VALUES
    (1, 1, 3),
    (1, 2, 4),
    (1, 3, 8),
    (1, 4, 4),
    (2, 2, 20);

INSERT INTO orders (order_id, reorder_of, customer_username, store_number, order_date, is_online, status, employee_id) VALUES
    ('1', NULL, 'JohnSmith123', 1, '2026-10-21 19:07:01', true, 'completed', 1);

INSERT INTO order_item (order_id, part_id, quantity, unit_price) VALUES
    ('1', 1, 1, 13.49),
    ('1', 2, 4, 204.99);

INSERT INTO payment (payment_id, order_id, method, amount, card_num, status, paid_at) VALUES
    ('1', '1', 'card', 833.45, '123456781011', 'completed', '2026-10-21 19:07:01');

INSERT INTO delivery (delivery_id, order_id, ship_street, ship_city, ship_state, ship_zip, tracking_number, date_shipped, date_arrived) VALUES
    ('1', '1', '123 Street St', 'Denton', 'TX', '76201', 'A1B2C3D4', '2026-10-22 14:00:00', '2026-10-22 14:30:07');
