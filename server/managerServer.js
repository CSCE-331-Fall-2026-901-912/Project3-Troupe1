const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js');

const router = express.Router();

const xReportSQL = fs.readFileSync(path.join(__dirname, './queries/x_report.sql'), 'utf8');
const salesCategorySQL = fs.readFileSync(path.join(__dirname, 'queries', 'sales_by_category.sql'), 'utf8');

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

module.exports = router;