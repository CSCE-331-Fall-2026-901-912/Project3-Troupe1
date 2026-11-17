const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js');

const router = express.Router();

const xReportSQL = fs.readFileSync(path.join(__dirname, './queries/x_report.sql'), 'utf8');
const salesCategorySQL = fs.readFileSync(path.join(__dirname, './queries/sales_by_category.sql'), 'utf8');
const employeeListSQL = fs.readFileSync(path.join(__dirname, './queries/employee_list.sql'), 'utf8');
const employeeAddSQL = fs.readFileSync(path.join(__dirname, './queries/employee_add.sql'), 'utf8');
const employeeRemoveSQL = fs.readFileSync(path.join(__dirname, './queries/employee_remove.sql'), 'utf8');
const employeeEditSQL = fs.readFileSync(path.join(__dirname, './queries/employee_edit.sql'), 'utf8');
const menuListSQL = fs.readFileSync(path.join(__dirname, './queries/menu_list.sql'), 'utf8');
const menuAddSQL = fs.readFileSync(path.join(__dirname, './queries/menu_add.sql'), 'utf8');
const menuEditSQL = fs.readFileSync(path.join(__dirname, './queries/menu_edit.sql'), 'utf8');
const menuRemoveSQL = fs.readFileSync(path.join(__dirname, './queries/menu_remove.sql'), 'utf8');
const inventoryListSQL = fs.readFileSync(path.join(__dirname, './queries/inventory_list.sql'), 'utf8');
const inventoryAddSQL = fs.readFileSync(path.join(__dirname, './queries/inventory_add.sql'), 'utf8');
const inventoryEditSQL = fs.readFileSync(path.join(__dirname, './queries/inventory_edit.sql'), 'utf8');
const inventoryRemoveSQL = fs.readFileSync(path.join(__dirname, './queries/inventory_remove.sql'), 'utf8');
const dailyReportSQL = fs.readFileSync(path.join(__dirname, './queries/daily_report.sql'), 'utf8');
const salesReportSQL = fs.readFileSync(path.join(__dirname, './queries/sales_report.sql'), 'utf8');
const productUsageReportSQL = fs.readFileSync(path.join(__dirname, './queries/product_usage_report.sql'), 'utf8');

router.get('/x-report', async (req, res) => {
    try {
        const selectedDate = req.query.date;

        if (!selectedDate) {
            return res.status(400).json({
                error: 'Date is required'
            });
        }

        const result = await pool.query(xReportSQL, [selectedDate]);
        res.json(result.rows);
    } catch (error) {
        console.error('X-Report Error:', error);
        res.status(500).json({
            error: 'Failed to generate X-Report'
        });
    }
});

router.get('/sales-category', async (req, res) => {
    try {
        const selectedDate = req.query.date;

        if (!selectedDate) {
            return res.status(400).json({
                error: 'Date is required'
            });
        }

        const result = await pool.query(salesCategorySQL, [selectedDate]);
        res.json(result.rows);
    } catch (error) {
        console.error('Sales Category Error:', error);
        res.status(500).json({
            error: 'Failed to load sales categories'
        });
    }
});

router.get('/employees', async (req, res) => {
    try {
        const result = await pool.query(employeeListSQL);
        res.json(result.rows);
    } catch (error) {
        console.error('Employee List Error:', error);
        res.status(500).json({
            error: 'Failed to load employees'
        });
    }
});

router.post('/employees', async (req, res) => {
    try {
        const { employeeID, firstName, lastName, position } = req.body;
        if (
            !Number.isSafeInteger(employeeID) ||
            employeeID <= 0 ||
            typeof firstName !== 'string' ||
            !firstName.trim() ||
            typeof lastName !== 'string' ||
            !lastName.trim() ||
            typeof position !== 'string' ||
            !position.trim()
        ) {
            return res.status(400).json({
                error: 'Valid employee information is required'
            });
        }
        const result = await pool.query(employeeAddSQL, [employeeID, firstName.trim(), lastName.trim(), position.trim()]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Add Employee Error:', error);
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Employee ID already exists'
            });
        }
        res.status(500).json({
            error: 'Failed to add employee'
        });
    }
});

router.delete('/employees/:id', async (req, res) => {
    try {
        const employeeID = Number(req.params.id);
        if (!Number.isSafeInteger(employeeID) || employeeID <= 0) {
            return res.status(400).json({
                error: 'Invalid Employee ID'
            });
        }

        const result = await pool.query(employeeRemoveSQL, [employeeID]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Employee not found'
            });
        }

        res.json({
            message: 'Employee removed successfully'
        });
    } catch (error) {
        console.error('Remove Employee Error:', error);
        if (error.code === '23503') {
            return res.status(409).json({
                error: 'Cannot remove an employee with existing order history'
            });
        }
        res.status(500).json({
            error: 'Failed to remove employee'
        });
    }
});

router.put('/employees/:id', async (req, res) => {
    try {
        const employeeID = Number(req.params.id);
        const { firstName, lastName, position } = req.body;
        if (
            !Number.isSafeInteger(employeeID) ||
            employeeID <= 0 ||
            typeof firstName !== 'string' ||
            !firstName.trim() ||
            typeof lastName !== 'string' ||
            !lastName.trim() ||
            typeof position !== 'string' ||
            !position.trim()
        ) {
            return res.status(400).json({
                error: 'Valid employee information is required'
            });
        }

        const result = await pool.query(employeeEditSQL, [firstName.trim(), lastName.trim(), position.trim(), employeeID]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Employee not found'
            });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Edit Employee Error:', error);
        res.status(500).json({
            error: 'Failed to edit employee'
        });
    }
});

router.get('/menu', async (req, res) => {
    try {
        const result = await pool.query(menuListSQL);
        res.json(result.rows);
    } catch (error) {
        console.error('Menu List Error:', error);
        res.status(500).json({
            error: 'Failed to load menu items'
        });
    }
});

router.post('/menu', async (req, res) => {
    try {
        const { menuItemID, category, menuItemName, ingredientList, price } = req.body;
        if (
            !Number.isSafeInteger(menuItemID) ||
            menuItemID <= 0 ||
            typeof category !== 'string' ||
            !category.trim() ||
            typeof menuItemName !== 'string' ||
            !menuItemName.trim() ||
            typeof ingredientList !== 'string' ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            return res.status(400).json({
                error: 'Valid menu item information is required'
            });
        }

        const result = await pool.query(menuAddSQL, [
            menuItemID,
            category.trim(),
            menuItemName.trim(),
            ingredientList.trim(),
            Number(price)
        ]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Add Menu Error:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Menu Item ID already exists'
            });
        }

        res.status(500).json({
            error: 'Failed to add menu item'
        });
    }
});

router.put('/menu/:id', async (req, res) => {
    try {
        const menuItemID = Number(req.params.id);
        const { category, menuItemName, ingredientList, price } = req.body;
        if (
            !Number.isSafeInteger(menuItemID) ||
            menuItemID <= 0 ||
            typeof category !== 'string' ||
            !category.trim() ||
            typeof menuItemName !== 'string' ||
            !menuItemName.trim() ||
            typeof ingredientList !== 'string' ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            return res.status(400).json({
                error: 'Valid menu item information is required'
            });
        }

        const result = await pool.query(menuEditSQL, [
            category.trim(),
            menuItemName.trim(),
            ingredientList.trim(),
            Number(price),
            menuItemID
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Menu item not found'
            });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Edit Menu Error:', error);
        res.status(500).json({
            error: 'Failed to edit menu item'
        });
    }
});

router.delete('/menu/:id', async (req, res) => {
    try {
        const menuItemID = Number(req.params.id);
        if (!Number.isSafeInteger(menuItemID) || menuItemID <= 0) {
            return res.status(400).json({
                error: 'Invalid Menu Item ID'
            });
        }

        const result = await pool.query(menuRemoveSQL, [menuItemID]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Menu item not found'
            });
        }

        res.json({
            message: 'Menu item removed successfully'
        });
    } catch (error) {
        console.error('Remove Menu Error:', error);

        if (error.code === '23503') {
            return res.status(409).json({
                error: 'Cannot remove a menu item with existing order history'
            });
        }
        res.status(500).json({
            error: 'Failed to remove menu item'
        });
    }
});

router.get('/inventory', async (req, res) => {
    try {
        const result = await pool.query(inventoryListSQL);
        res.json(result.rows);
    } catch (error) {
        console.error('Inventory List Error:', error);
        res.status(500).json({
            error: 'Failed to load inventory'
        });
    }
});

router.post('/inventory', async (req, res) => {
    try {
        const { ingredientName, category, quantity, unit } = req.body;
        if (
            typeof ingredientName !== 'string' || !ingredientName.trim() ||
            typeof category !== 'string' || !category.trim() ||
            !Number.isSafeInteger(quantity) || quantity < 0 ||
            typeof unit !== 'string' || !unit.trim()) {

            return res.status(400).json({error: 'Valid inventory information is required'});
        }

        const idResult = await pool.query('SELECT MAX(IngredientID) AS maxid FROM Inventory');
        const ingredientID = Number(idResult.rows[0].maxid || 0) + 1;
        const result = await pool.query(inventoryAddSQL, [ingredientID, ingredientName.trim(), category.trim(), quantity, unit.trim()]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Add Inventory Error:', error);
        if (error.code === '23505') {
            return res.status(409).json({error: 'Ingredient ID already exists. Please try again.'});
        }
        res.status(500).json({error: 'Failed to add inventory item'});
    }
});

router.put('/inventory/:id', async (req, res) => {
    try {
        const ingredientID = Number(req.params.id);
        const { ingredientName, category, quantity, unit } = req.body;
        if (
            !Number.isSafeInteger(ingredientID) || ingredientID <= 0 ||
            typeof ingredientName !== 'string' || !ingredientName.trim() ||
            typeof category !== 'string' || !category.trim() ||
            !Number.isSafeInteger(quantity) || quantity < 0 ||
            typeof unit !== 'string' || !unit.trim()) {
            return res.status(400).json({
                error: 'Valid inventory information is required'
            });
        }

        const result = await pool.query(inventoryEditSQL, [ingredientName.trim(), category.trim(), quantity, unit.trim(), ingredientID]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Inventory item not found'
            });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Edit Inventory Error:', error);
        res.status(500).json({
            error: 'Failed to edit inventory item'
        });
    }
});

router.delete('/inventory/:id', async (req, res) => {
    try {
        const ingredientID = Number(req.params.id);
        if (!Number.isSafeInteger(ingredientID) || ingredientID <= 0) {
            return res.status(400).json({
                error: 'Invalid Ingredient ID'
            });
        }
        const recipeCheck = await pool.query('SELECT 1 FROM Recipe WHERE InventoryID = $1 LIMIT 1', [ingredientID]);
        if (recipeCheck.rowCount > 0) {
            return res.status(409).json({
                error: 'Cannot remove an ingredient used in an existing recipe'
            });
        }

        const result = await pool.query(inventoryRemoveSQL, [ingredientID]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Inventory item not found'
            });
        }
        res.json({message: 'Inventory item removed successfully'});
    } catch (error) {
        console.error('Remove Inventory Error:', error);
        res.status(500).json({
            error: 'Failed to remove inventory item'
        });
    }
});

router.get('/daily-report', async (req, res) => {
    try {
        const selectedDate = req.query.date;
        if (!selectedDate) {
            return res.status(400).json({
                error: 'Date is required'
            });
        }

        const result = await pool.query(dailyReportSQL, [selectedDate]);
        res.json(result.rows);
    } catch (error) {
        console.error('Daily Report Error:', error);
        res.status(500).json({
            error: 'Failed to generate Daily Report'
        });
    }
});

router.get('/sales-report', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Start date and end date are required'
            });
        }

        if (startDate > endDate) {
            return res.status(400).json({
                error: 'Start date cannot be after end date'
            });
        }
        const result = await pool.query(salesReportSQL, [startDate, endDate]);
        res.json(result.rows);
    } catch (error) {
        console.error('Sales Report Error:', error);
        res.status(500).json({
            error: 'Failed to generate Sales Report'
        });
    }
});

router.get('/product-usage-report', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Start date and end date are required'
            });
        }

        if (startDate > endDate) {
            return res.status(400).json({
                error: 'Start date cannot be after end date'
            });
        }
        const result = await pool.query(productUsageReportSQL, [startDate, endDate]);
        res.json(result.rows);
    } catch (error) {
        console.error('Product Usage Report Error:', error);
        res.status(500).json({
            error: 'Failed to generate Product Usage Report'
        });
    }
});

module.exports = router;