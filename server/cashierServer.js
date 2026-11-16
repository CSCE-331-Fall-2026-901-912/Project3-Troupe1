
const express = require('express');
const pool = require('./db.js');

const router = express.Router();

// Load current menu items for the cashier
router.get('/menu', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT MenuItemID AS id, MenuItemName AS name, Category AS category, Price AS price ' +
            'FROM MenuItem ORDER BY MenuItemID'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Cashier Menu Error:', error);
        res.status(500).json({ error: 'Could not load cashier menu' });
    }
});

// Load available add-ons (100 is the database placeholder for no add-on)
router.get('/add-ons', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT AddOnsID AS id, Name AS name, Price AS price ' +
            'FROM AddOn WHERE AddOnsID <> 100 ORDER BY AddOnsID'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Cashier Add-Ons Error:', error);
        res.status(500).json({ error: 'Could not load cashier add-ons' });
    }
});

// Use actual order history for the three popular drink buttons
router.get('/popular', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT m.MenuItemID AS id FROM MenuItem m ' +
            'LEFT JOIN OrderItems oi ON oi.MenuID = m.MenuItemID ' +
            'GROUP BY m.MenuItemID ' +
            'ORDER BY COUNT(oi.ItemID) DESC, m.MenuItemID LIMIT 3'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Cashier Popular Drinks Error:', error);
        res.status(500).json({ error: 'Could not load popular drinks' });
    }
});

// Show today's cashier sales using orders already saved in PostgreSQL.
// This reads the totals; it does not create or modify any orders.
router.get('/sales-today', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*)::int AS orders, COALESCE(SUM(Total), 0) AS sales ' +
            'FROM OrderHistory ' +
            "WHERE CustomerName = 'Cashier' " +
            "AND Date = (NOW() AT TIME ZONE 'America/Chicago')::date"
        );

        res.json({
            orders: Number(result.rows[0].orders),
            sales: Number(result.rows[0].sales)
        });
    } catch (error) {
        console.error('Cashier Sales Error:', error);
        res.status(500).json({ error: 'Could not load cashier sales' });
    }
});

// Save an order submitted from the cashier screen
router.post('/orders', async (req, res) => {
    const items = req.body && req.body.items;

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
        return res.status(400).json({ error: 'Order must contain 1 to 100 drinks' });
    }

    // Each drink has its own menu ID and a list of selected add-on IDs.
    for (const item of items) {
        if (!item || !Number.isInteger(item.id) || item.id <= 0 ||
            !Array.isArray(item.addOnIds) || item.addOnIds.length > 8 ||
            !item.addOnIds.every(id => Number.isInteger(id) && id > 0 && id !== 100) ||
            new Set(item.addOnIds).size !== item.addOnIds.length) {
            return res.status(400).json({ error: 'Invalid drink or add-on selection' });
        }
    }

    let client;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // Match the kiosk's locking approach so new IDs do not overlap.
        await client.query('LOCK TABLE OrderHistory, OrderItems IN EXCLUSIVE MODE');

        const menuIds = [...new Set(items.map(item => item.id))];
        const selectedAddOnIds = [...new Set(items.flatMap(item => item.addOnIds))];
        const needsNoAddOn = items.some(item => item.addOnIds.length === 0);
        const lookupAddOnIds = needsNoAddOn
            ? [...selectedAddOnIds, 100]
            : selectedAddOnIds;

        // Get prices from the database, not the prices shown in the browser.
        const menuResult = await client.query(
            'SELECT MenuItemID, Price FROM MenuItem WHERE MenuItemID = ANY($1::int[])',
            [menuIds]
        );
        const addOnResult = await client.query(
            'SELECT AddOnsID, Price FROM AddOn WHERE AddOnsID = ANY($1::int[])',
            [lookupAddOnIds]
        );

        const menuPrices = new Map(
            menuResult.rows.map(row => [row.menuitemid, Number(row.price)])
        );
        const addOnPrices = new Map(
            addOnResult.rows.map(row => [row.addonsid, Number(row.price)])
        );

        if (menuPrices.size !== menuIds.length ||
            selectedAddOnIds.some(id => !addOnPrices.has(id))) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'One or more drinks or add-ons do not exist'
            });
        }

        if (needsNoAddOn && !addOnPrices.has(100)) {
            throw new Error('No Add-On (ID 100) is missing from AddOn table');
        }

        // Calculate the full order total using cents to avoid decimal errors.
        let totalCents = 0;
        for (const item of items) {
            totalCents += Math.round(menuPrices.get(item.id) * 100);
            for (const addOnId of item.addOnIds) {
                totalCents += Math.round(addOnPrices.get(addOnId) * 100);
            }
        }
        const total = totalCents / 100;

        // Existing ID columns are INT, not auto-generated SERIAL IDs.
        const ids = await client.query(
            'SELECT COALESCE(MAX(OrderID), 0) + 1 AS orderid, ' +
            '(SELECT COALESCE(MAX(ItemID), 0) FROM OrderItems) AS lastitemid ' +
            'FROM OrderHistory'
        );
        const orderId = ids.rows[0].orderid;
        let itemId = ids.rows[0].lastitemid;

        await client.query(
            'INSERT INTO OrderHistory (OrderID, EmployeeID, CustomerName, Total, Date, Time) ' +
            "VALUES ($1, NULL, 'Cashier', $2, " +
            "(NOW() AT TIME ZONE 'America/Chicago')::date, " +
            "(NOW() AT TIME ZONE 'America/Chicago')::time(0))",
            [orderId, total]
        );

        for (const item of items) {
            itemId += 1;
            await client.query(
                'INSERT INTO OrderItems (ItemID, OrderID, MenuID) VALUES ($1, $2, $3)',
                [itemId, orderId, item.id]
            );

            // CSV data uses add-on ID 100 for drinks without toppings.
            const idsToSave = item.addOnIds.length ? item.addOnIds : [100];
            for (const addOnId of idsToSave) {
                await client.query(
                    'INSERT INTO OrderItemAddOns (OrderItemID, AddOnID) VALUES ($1, $2)',
                    [itemId, addOnId]
                );
            }
        }

        await client.query('COMMIT');
        return res.status(201).json({
            message: 'Cashier order saved successfully',
            orderId,
            itemCount: items.length,
            total
        });

    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Cashier Rollback Error:', rollbackError);
            }
        }
        console.error('Cashier Save Error:', error);
        return res.status(500).json({ error: 'Could not save cashier order' });

    } finally {
        if (client) client.release();
    }
});

module.exports = router;
