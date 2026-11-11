document.addEventListener("DOMContentLoaded", () => {
    loadXReport();
    loadSalesCategory();
});

async function loadXReport() {
    const output = document.getElementById('xOutput');
    try {
        const date = '2025-09-26';
        const response = await fetch(`/api/manager/x-report?date=${date}`);
        if (!response.ok) throw new Error('Failed to load X-Report');

        const data = await response.json();
        if (data.length === 0) {
            output.textContent = 'No sales data available.';
            return;
        }

        let totalOrders = 0;
        let totalSales = 0;
        let busiestHour = null;

        data.forEach(row => {
            const orders = Number(row.orders);
            const sales = Number(row.sales);

            totalOrders += orders;
            totalSales += sales;

            if (!busiestHour || orders > Number(busiestHour.orders)) busiestHour = row;
        });

        output.textContent =
            `Total Sales: $${totalSales.toFixed(2)}\n` +
            `Total Orders: ${totalOrders}\n` +
            `Busiest Hour: ${busiestHour.hour}:00\n` +
            `Orders During Busiest Hour: ${busiestHour.orders}\n` +
            `Sales During Busiest Hour: $${Number(busiestHour.sales).toFixed(2)}`;

    } catch (error) {
        console.error('X-Report Error:', error);
        output.textContent = 'Failed to load X-Report.';
    }
}

async function loadSalesCategory() {
    const pie = document.querySelector('.pie');
    const legend = document.querySelector('.legend');
    try {
        const date = '2025-09-26';
        const response = await fetch(`/api/manager/sales-category?date=${date}`);
        if (!response.ok) throw new Error('Failed to load sales categories');

        const data = await response.json();
        if (data.length === 0) {
            pie.style.background = 'none';
            legend.textContent = 'No sales data available.';
            return;
        }

        const colors = [
            '#184E36',
            '#95CDBB',
            '#D7F0E7',
            '#6B9F8A',
            '#B6CFC4'
        ];

        const total = data.reduce((sum, item) => sum + Number(item.itemssold), 0);
        let currentPercentage = 0;
        const segments = [];
        legend.replaceChildren();

        data.forEach((item, index) => {
            const percentage = Number(item.itemssold) / total * 100;
            const nextPercentage = currentPercentage + percentage;
            const color = colors[index % colors.length];

            segments.push(`${color} ${currentPercentage}% ${nextPercentage}%`);
            currentPercentage = nextPercentage;
            const label = document.createElement('span');
            const dot = document.createElement('b');
            dot.className = 'dot';
            dot.style.backgroundColor = color;

            label.appendChild(dot);
            label.appendChild(document.createTextNode(`${item.category}: ${item.itemssold}`));
            legend.appendChild(label);
        });

        pie.style.background = `conic-gradient(${segments.join(', ')})`;
    } catch (error) {
        console.error('Sales Category Error:', error);
        legend.textContent = 'Failed to load sales categories.';
    }
}