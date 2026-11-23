
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
// This route is unused by the current cashier screen.
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

// Convert recipe measurements into thousandths of the inventory unit
function amountInThousandths(recipe) {
    const amount = Number(recipe.amountused);
    const ingredientId = Number(recipe.inventoryid);

    if (!Number.isFinite(amount) || amount <= 0 ||
        !Number.isSafeInteger(ingredientId) || ingredientId <= 0 ||
        !recipe.inventoryunit) {
        throw new Error('Invalid recipe or missing inventory ingredient');
    }

    // Most recipes use the same unit as inventory
    if (recipe.recipeunit === recipe.inventoryunit) {
        return Math.round(amount * 1000);
    }

    // Espresso recipes use grams, but inventory uses liters.
    // Approximation: 1 g of espresso = 0.001 L.
    if (ingredientId === 34 && recipe.recipeunit === 'g' &&
        recipe.inventoryunit === 'L') {
        return Math.round(amount);
    }

    throw new Error(`Unit mismatch for ingredient ${ingredientId}: ` +
        `${recipe.recipeunit} vs ${recipe.inventoryunit}`);
}

// Deduct all ingredients needed for the cashier order
async function deductIngredients(client, items, menuIds, addOnIngredients) {

    // Verify that the database supports decimal ingredient amounts
    const schema = await client.query(
        "SELECT table_name, column_name, data_type, numeric_scale " +
        "FROM information_schema.columns WHERE table_schema = current_schema() " +
        "AND ((table_name = 'inventory' AND column_name = 'quantity') " +
        "OR (table_name = 'recipe' AND column_name = 'amountused'))"
    );

    const columnScales = new Map(
        schema.rows.map(row => [row.table_name + '.' + row.column_name, row])
    );

    for (const column of ['inventory.quantity', 'recipe.amountused']) {
        const definition = columnScales.get(column);

        if (!definition || definition.data_type !== 'numeric' ||
            Number(definition.numeric_scale) < 3) {
            const error = new Error(
                'Inventory and Recipe columns must support 3 decimal places'
            );
            error.statusCode = 503;
            throw error;
        }
    }

    // Get the recipes and their inventory units from the database
    const result = await client.query(
        'SELECT r.MenuItemID, r.InventoryID, r.AmountUsed, ' +
        'r.Unit AS RecipeUnit, r.UsageType, ' +
        'i.Unit AS InventoryUnit, i.IngredientName ' +
        'FROM Recipe r LEFT JOIN Inventory i ON i.IngredientID = r.InventoryID ' +
        'WHERE r.MenuItemID = ANY($1::int[])',
        [menuIds]
    );

    const baseRecipes = new Map();
    const optionalRecipes = new Map();

    // Separate required ingredients from optional toppings
    for (const recipe of result.rows) {
        const menuId = Number(recipe.menuitemid);

        if (recipe.usagetype === 'Base') {
            if (!baseRecipes.has(menuId)) {
                baseRecipes.set(menuId, []);
            }

            baseRecipes.get(menuId).push(recipe);

        } else if (recipe.usagetype === 'Optional') {
            optionalRecipes.set(
                `${menuId}:${recipe.inventoryid}`,
                recipe
            );
        }
    }

    // Store the total amount needed for each ingredient
    const amounts = new Map();

    function addUsage(recipe) {
        const ingredientId = Number(recipe.inventoryid);
        const thousandths = amountInThousandths(recipe);

        if (!Number.isSafeInteger(thousandths) || thousandths <= 0) {
            throw new Error('Invalid ingredient usage amount');
        }

        const newAmount = (amounts.get(ingredientId) || 0) + thousandths;

        if (!Number.isSafeInteger(newAmount)) {
            throw new Error('Ingredient amount is too large');
        }

        amounts.set(ingredientId, newAmount);
    }

    // Calculate the ingredients used by every drink
    for (const item of items) {
        const recipes = baseRecipes.get(item.id);

        if (!recipes || recipes.length === 0) {
            const error = new Error(
                `No base recipe for drink ID ${item.id}`
            );
            error.statusCode = 400;
            throw error;
        }

        // Add required ingredients
        recipes.forEach(addUsage);

        // Add only the toppings actually selected
        for (const addOnId of item.addOnIds) {
            const ingredientId = addOnIngredients.get(addOnId);
            const recipe = optionalRecipes.get(
                `${item.id}:${ingredientId}`
            );

            if (!recipe) {
                const error = new Error(
                    `Add-on ${addOnId} is not available for drink ${item.id}`
                );
                error.statusCode = 400;
                throw error;
            }

            addUsage(recipe);
        }
    }

    // Deduct ingredients in a consistent order
    const ingredientIds = [...amounts.keys()].sort((a, b) => a - b);

    for (const ingredientId of ingredientIds) {
        const quantity = amounts.get(ingredientId) / 1000;

        // Deduct only if enough inventory exists
        const updated = await client.query(
            'UPDATE Inventory SET Quantity = Quantity - $2::numeric ' +
            'WHERE IngredientID = $1 AND Quantity >= $2::numeric ' +
            'RETURNING IngredientName',
            [ingredientId, quantity]
        );

        if (updated.rowCount !== 1) {
            const error = new Error(
                `Not enough inventory for ingredient ID ${ingredientId}`
            );
            error.statusCode = 409;
            throw error;
        }
    }
}

// Save an order submitted from the cashier screen
router.post('/orders', async (req, res) => {
    const items = req.body && req.body.items;

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
        return res.status(400).json({
            error: 'Order must contain 1 to 100 drinks'
        });
    }

    // Validate drink and add-on IDs
    for (const item of items) {
        if (!item || !Number.isInteger(item.id) || item.id <= 0 ||
            !Array.isArray(item.addOnIds) || item.addOnIds.length > 8 ||
            !item.addOnIds.every(id =>
                Number.isInteger(id) && id > 0 && id !== 100
            ) ||
            new Set(item.addOnIds).size !== item.addOnIds.length) {
            return res.status(400).json({
                error: 'Invalid drink or add-on selection'
            });
        }
    }

    let client;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // Prevent order IDs from overlapping with kiosk orders
        await client.query(
            'LOCK TABLE OrderHistory, OrderItems IN EXCLUSIVE MODE'
        );

        const menuIds = [...new Set(items.map(item => item.id))];

        const selectedAddOnIds = [
            ...new Set(items.flatMap(item => item.addOnIds))
        ];

        const needsNoAddOn = items.some(
            item => item.addOnIds.length === 0
        );

        const lookupAddOnIds = needsNoAddOn
            ? [...selectedAddOnIds, 100]
            : selectedAddOnIds;

        // Get menu prices from PostgreSQL
        const menuResult = await client.query(
            'SELECT MenuItemID, Price FROM MenuItem WHERE MenuItemID = ANY($1::int[])',
            [menuIds]
        );

        // Get add-on prices and their inventory ingredient IDs
        const addOnResult = await client.query(
            'SELECT AddOnsID, IngredientID, Price FROM AddOn WHERE AddOnsID = ANY($1::int[])',
            [lookupAddOnIds]
        );

        const menuPrices = new Map(
            menuResult.rows.map(row => [
                row.menuitemid,
                Number(row.price)
            ])
        );

        const addOnPrices = new Map(
            addOnResult.rows.map(row => [
                row.addonsid,
                Number(row.price)
            ])
        );

        // Check that all drinks and toppings exist
        if (menuPrices.size !== menuIds.length ||
            selectedAddOnIds.some(id => !addOnPrices.has(id))) {

            await client.query('ROLLBACK');

            return res.status(400).json({
                error: 'One or more drinks or add-ons do not exist'
            });
        }

        if (needsNoAddOn && !addOnPrices.has(100)) {
            throw new Error(
                'No Add-On (ID 100) is missing from AddOn table'
            );
        }

        // Calculate the order total using database prices
        let totalCents = 0;

        for (const item of items) {
            totalCents += Math.round(menuPrices.get(item.id) * 100);

            for (const addOnId of item.addOnIds) {
                totalCents += Math.round(addOnPrices.get(addOnId) * 100);
            }
        }

        const total = totalCents / 100;

        // NEW: Deduct inventory before saving the order
        // All changes are part of the same database transaction
        const addOnIngredients = new Map(
            addOnResult.rows.map(row => [
                row.addonsid,
                Number(row.ingredientid)
            ])
        );

        await deductIngredients(
            client,
            items,
            menuIds,
            addOnIngredients
        );

        // Generate the next order and item IDs
        const ids = await client.query(
            'SELECT COALESCE(MAX(OrderID), 0) + 1 AS orderid, ' +
            '(SELECT COALESCE(MAX(ItemID), 0) FROM OrderItems) AS lastitemid ' +
            'FROM OrderHistory'
        );

        const orderId = ids.rows[0].orderid;
        let itemId = ids.rows[0].lastitemid;

        // Save the order to OrderHistory
        await client.query(
            'INSERT INTO OrderHistory (OrderID, EmployeeID, CustomerName, Total, Date, Time) ' +
            "VALUES ($1, NULL, 'Cashier', $2, " +
            "(NOW() AT TIME ZONE 'America/Chicago')::date, " +
            "(NOW() AT TIME ZONE 'America/Chicago')::time(0))",
            [orderId, total]
        );

        // Save each drink and its selected toppings
        for (const item of items) {
            itemId += 1;

            await client.query(
                'INSERT INTO OrderItems (ItemID, OrderID, MenuID) VALUES ($1, $2, $3)',
                [itemId, orderId, item.id]
            );

            // ID 100 represents a drink without toppings
            const idsToSave = item.addOnIds.length
                ? item.addOnIds
                : [100];

            for (const addOnId of idsToSave) {
                await client.query(
                    'INSERT INTO OrderItemAddOns (OrderItemID, AddOnID) VALUES ($1, $2)',
                    [itemId, addOnId]
                );
            }
        }

        // Save the order and inventory changes together
        await client.query('COMMIT');

        return res.status(201).json({
            message: 'Cashier order saved successfully',
            orderId,
            itemCount: items.length,
            total
        });

    } catch (error) {
        // Undo inventory and order changes if anything fails
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Cashier Rollback Error:', rollbackError);
            }
        }

        console.error('Cashier Save Error:', error);

        return res.status(error.statusCode || 500).json({
            error: error.statusCode
                ? error.message
                : 'Could not save cashier order'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});

router.deductIngredients = deductIngredients;

module.exports = router;
