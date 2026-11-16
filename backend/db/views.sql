-- Derived attributes from the E-R diagram.
--
-- orders.total() is a derived attribute: it is computed from the order's
-- items instead of being stored, so it can never fall out of sync.
-- NOT yet created in the shared Neon database; run this file once the
-- team agrees (it only adds a view and changes no data).

CREATE OR REPLACE VIEW order_total AS
SELECT o.order_id,
       COALESCE(SUM(oi.quantity * oi.unit_price), 0)::NUMERIC(10,2) AS total
FROM orders o
LEFT JOIN order_item oi ON oi.order_id = o.order_id
GROUP BY o.order_id;
