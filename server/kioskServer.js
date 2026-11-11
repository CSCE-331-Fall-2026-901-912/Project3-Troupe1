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

module.exports = router;
