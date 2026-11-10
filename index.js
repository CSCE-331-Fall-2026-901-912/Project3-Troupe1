require('dotenv').config();


const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: Number(process.env.PSQL_PORT),
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/hub', express.static(path.join(__dirname, 'hub')));
app.use('/manager', express.static(path.join(__dirname, 'manager')));
app.use('/cashier', express.static(path.join(__dirname, 'cashier')));
app.use('/kiosk', express.static(path.join(__dirname, 'kiosk')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'hub', 'hub.html'));
});

app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');

        res.json({
            status: 'Connected',
            serverTime: result.rows[0].now
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Database connection failed');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});