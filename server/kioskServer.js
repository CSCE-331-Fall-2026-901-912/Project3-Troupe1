const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js');

const router = express.Router();

const topDrinksSQL = fs.readFileSync(path.join(__dirname, 'queries', 'top_drinks.sql'), 'utf8');

router.get('/top-drinks', async (req, res) => {
    try {
        const result = await pool.query(topDrinksSQL);
        res.json(result.rows);
    } catch (error) {
        console.error('Top Drinks Error:', error);
        res.status(500).json({
            error: 'Failed to load top drinks'
        });
    }
});

router.post('/orders', async (req, res) => {
    const items = req.body && req.body.items;

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
        return res.status(400).json({ error: 'Order must contain items' });
    }

    const drinks = [];

    for (const item of items) {
        const menuId = Number(item.id);
        const qty = Number(item.qty);
        const addOnIds = Array.isArray(item.addOnIds) ? item.addOnIds.map(Number) : [];

        if (!Number.isInteger(menuId) || !Number.isInteger(qty) || qty < 1 || qty > 50 ||
            !addOnIds.every(Number.isInteger)) {
            return res.status(400).json({ error: 'Invalid order item' });
        }

        for (let i = 0; i < qty; i++) {
            drinks.push({ menuId, addOnIds: [...new Set(addOnIds)] });
        }
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('LOCK TABLE OrderHistory, OrderItems IN EXCLUSIVE MODE');

        const menuIds = [...new Set(drinks.map(drink => drink.menuId))];
        const addOnIds = [...new Set(drinks.flatMap(drink => drink.addOnIds))];

        const menuResult = await client.query(
            'SELECT MenuItemID, Price FROM MenuItem WHERE MenuItemID = ANY($1::int[])',
            [menuIds]
        );
        const addOnResult = await client.query(
            'SELECT AddOnsID, Price FROM AddOn WHERE AddOnsID = ANY($1::int[])',
            [addOnIds]
        );

        const menuPrices = new Map(menuResult.rows.map(row => [row.menuitemid, Number(row.price)]));
        const addOnPrices = new Map(addOnResult.rows.map(row => [row.addonsid, Number(row.price)]));

        let total = 0;
        for (const drink of drinks) {
            total += menuPrices.get(drink.menuId);
            for (const addOnId of drink.addOnIds) {
                total += addOnPrices.get(addOnId);
            }
        }
        total = Math.round(total * 100) / 100;

        const ids = await client.query(
            'SELECT COALESCE(MAX(OrderID), 0) + 1 AS orderid, ' +
            '(SELECT COALESCE(MAX(ItemID), 0) FROM OrderItems) AS lastitemid FROM OrderHistory'
        );
        const orderId = ids.rows[0].orderid;
        let itemId = ids.rows[0].lastitemid;

        await client.query(
            "INSERT INTO OrderHistory (OrderID, EmployeeID, CustomerName, Total, Date, Time) " +
            "VALUES ($1, NULL, 'Kiosk', $2, (NOW() AT TIME ZONE 'America/Chicago')::date, " +
            "(NOW() AT TIME ZONE 'America/Chicago')::time(0))",
            [orderId, total]
        );

        for (const drink of drinks) {
            itemId += 1;
            await client.query(
                'INSERT INTO OrderItems (ItemID, OrderID, MenuID) VALUES ($1, $2, $3)',
                [itemId, orderId, drink.menuId]
            );
            for (const addOnId of drink.addOnIds) {
                await client.query(
                    'INSERT INTO OrderItemAddOns (OrderItemID, AddOnID) VALUES ($1, $2)',
                    [itemId, addOnId]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ orderId, total });
    } finally {
        client.release();
    }
});

module.exports = router;
