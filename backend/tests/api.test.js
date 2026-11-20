
import test from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = 'http://localhost:3001';

test('Health endpoint confirms database connection', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.database, 'connected');
});

test('Parts endpoint returns a catalog', async () => {
    const response = await fetch(`${baseUrl}/api/parts`);
    assert.equal(response.status, 200);

    const parts = await response.json();
    assert.ok(Array.isArray(parts));

    for (const part of parts) {
        assert.ok(part.part_id != null);
        assert.equal(typeof part.name, 'string');
        assert.ok(Number(part.price) >= 0);
        assert.ok(part.in_stock >= 0);
    }
});

test('Inventory totals match catalog stock', async () => {
    const [partsResponse, inventoryResponse] = await Promise.all([
        fetch(`${baseUrl}/api/parts`),
        fetch(`${baseUrl}/api/inventory`)
    ]);

    assert.equal(partsResponse.status, 200);
    assert.equal(inventoryResponse.status, 200);

    const parts = await partsResponse.json();
    const inventory = await inventoryResponse.json();

    const totals = new Map();

    for (const item of inventory) {
        totals.set(
            item.part_id,
            (totals.get(item.part_id) ?? 0) + item.quantity
        );
    }

    for (const part of parts) {
        assert.equal(
            part.in_stock,
            totals.get(part.part_id) ?? 0,
            `Stock mismatch for part ${part.part_id}`
        );
    }
});

test('Unknown order returns 404', async () => {
    const response = await fetch(
        `${baseUrl}/api/orders/DOES-NOT-EXIST`
    );

    assert.equal(response.status, 404);

    const data = await response.json();
    assert.equal(data.error, 'Order not found');
});

test('Invalid order IDs do not expose other orders', async () => {
    const ids = ['abc', '999999999', "1' OR '1'='1"];

    for (const id of ids) {
        const response = await fetch(
            `${baseUrl}/api/orders/${encodeURIComponent(id)}`
        );

        assert.equal(response.status, 404);
    }
});
