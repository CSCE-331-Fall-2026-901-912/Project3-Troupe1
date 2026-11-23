const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js');
const { deductIngredients } = require('./cashierServer.js');

const kioskStrings = require('./kioskStrings.json');

const router = express.Router();

const translationLanguages = new Set(['es', 'fr']);
const translationCache = new Map();
const pendingTranslations = new Map();

async function translateWithGoogle(texts, target) {
    const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': process.env.GOOGLE_TRANSLATE_API_KEY
        },
        body: JSON.stringify({ q: texts, source: 'en', target, format: 'text' })
    });

    if (!response.ok) {
        throw new Error('Google Translate returned ' + response.status);
    }

    const data = await response.json();
    return data.data.translations.map(item => item.translatedText);
}

async function translateAll(texts, lang) {
    if (!translationCache.has(lang)) {
        translationCache.set(lang, new Map());
    }

    const cache = translationCache.get(lang);
    const missing = texts.filter(text => !cache.has(text));

    for (let i = 0; i < missing.length; i += 100) {
        const chunk = missing.slice(i, i + 100);
        const translated = await translateWithGoogle(chunk, lang);
        chunk.forEach((text, index) => cache.set(text, translated[index]));
    }

    return Object.fromEntries(texts.map(text => [text, cache.get(text)]));
}

router.get('/translations', async (req, res) => {
    const lang = req.query.lang;

    if (!translationLanguages.has(lang)) {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
        return res.status(503).json({ error: 'Translation is not configured' });
    }

    try {
        const names = await pool.query(
            'SELECT MenuItemName AS text FROM MenuItem ' +
            'UNION SELECT Name FROM AddOn WHERE AddOnsID <> 100'
        );
        const texts = [...new Set([...kioskStrings, ...names.rows.map(row => row.text)])];

        while (pendingTranslations.has(lang)) {
            await pendingTranslations.get(lang).catch(() => {});
        }

        const job = translateAll(texts, lang);
        pendingTranslations.set(lang, job);

        try {
            res.json({ translations: await job });
        } finally {
            pendingTranslations.delete(lang);
        }
    } catch (error) {
        console.error('Translation Error:', error);
        res.status(502).json({ error: 'Failed to translate' });
    }
});

const topDrinksSQL = fs.readFileSync(path.join(__dirname, 'queries', 'top_drinks.sql'), 'utf8');

router.get('/menu', async (req, res) => {
    try {
        const menuResult = await pool.query(
            'SELECT MenuItemID AS id, MenuItemName AS name, Category AS category, Price AS price ' +
            'FROM MenuItem ORDER BY MenuItemID'
        );
        const addOnResult = await pool.query(
            'SELECT a.AddOnsID AS id, a.Name AS name, a.Price AS price, ' +
            'COALESCE(ARRAY_AGG(DISTINCT r.MenuItemID) FILTER (WHERE r.MenuItemID IS NOT NULL), ' +
            "'{}') AS menuitemids " +
            'FROM AddOn a LEFT JOIN Recipe r ON r.InventoryID = a.IngredientID ' +
            "AND LOWER(r.UsageType) = 'optional' " +
            'WHERE a.AddOnsID <> 100 GROUP BY a.AddOnsID, a.Name, a.Price ORDER BY a.AddOnsID'
        );

        res.json({
            menuItems: menuResult.rows.map(row => ({
                id: row.id,
                name: row.name,
                category: row.category,
                price: Number(row.price)
            })),
            addOns: addOnResult.rows.map(row => ({
                id: row.id,
                name: row.name,
                price: Number(row.price),
                menuItemIds: row.menuitemids
            }))
        });
    } catch (error) {
        console.error('Kiosk Menu Error:', error);
        res.status(500).json({
            error: 'Failed to load menu'
        });
    }
});

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
            !addOnIds.every(id => Number.isInteger(id) && id > 0 && id !== 100)) {
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
            'SELECT AddOnsID, IngredientID, Price FROM AddOn WHERE AddOnsID = ANY($1::int[])',
            [addOnIds]
        );

        const menuPrices = new Map(menuResult.rows.map(row => [row.menuitemid, Number(row.price)]));
        const addOnPrices = new Map(addOnResult.rows.map(row => [row.addonsid, Number(row.price)]));

        if (menuPrices.size !== menuIds.length || addOnPrices.size !== addOnIds.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Unknown menu item or add-on' });
        }

        let total = 0;
        for (const drink of drinks) {
            total += menuPrices.get(drink.menuId);
            for (const addOnId of drink.addOnIds) {
                total += addOnPrices.get(addOnId);
            }
        }
        total = Math.round(total * 100) / 100;

        await deductIngredients(
            client,
            drinks.map(drink => ({ id: drink.menuId, addOnIds: drink.addOnIds })),
            menuIds,
            new Map(addOnResult.rows.map(row => [row.addonsid, Number(row.ingredientid)]))
        );

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
            for (const addOnId of drink.addOnIds.length ? drink.addOnIds : [100]) {
                await client.query(
                    'INSERT INTO OrderItemAddOns (OrderItemID, AddOnID) VALUES ($1, $2)',
                    [itemId, addOnId]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ orderId, total });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Order Error:', error);
        res.status(error.statusCode || 500).json({
            error: error.statusCode ? error.message : 'Failed to save order'
        });
    } finally {
        client.release();
    }
});

module.exports = router;
