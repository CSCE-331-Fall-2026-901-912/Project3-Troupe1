const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/hub', express.static(path.join(__dirname, 'hub')));
app.use('/manager', express.static(path.join(__dirname, 'manager')));
app.use('/cashier', express.static(path.join(__dirname, 'cashier')));
app.use('/kiosk', express.static(path.join(__dirname, 'kiosk')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'hub', 'hub.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});