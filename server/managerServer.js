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

module.exports = router;