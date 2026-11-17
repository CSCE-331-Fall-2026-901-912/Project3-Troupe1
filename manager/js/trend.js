document.addEventListener("DOMContentLoaded", () => {
    const reportButtons = document.querySelectorAll(".report-button");
    const trendOutput = document.getElementById("trendOutput");
    const chartPanel = document.getElementById("trendChartPanel");
    const chartCanvas = document.getElementById("trendChart");

    let currentChart = null;


    function validDateRange(startDate, endDate) {
        if (!startDate || !endDate) {
            trendOutput.textContent = "Please select both dates.";
            return false;
        }
        if (startDate > endDate) {
            trendOutput.textContent = "Start date cannot be after end date.";
            return false;
        }
        return true;
    }

    reportButtons.forEach((button) => {
        button.addEventListener("click", async () => {
            const reportType = button.dataset.report;

            try {
                if (reportType === "Daily Report"){
                    const date = document.getElementById("dailyDate").value;
                    if (!date) {
                        trendOutput.textContent = "Please select a date.";
                        return;
                    }

                    const response = await fetch(`/api/manager/daily-report?date=${date}`);
                    if (!response.ok) {
                        throw new Error("Failed to generate Daily Report");
                    }

                    const data = await response.json();
                    const totalSales = data.reduce((sum, item) => sum + Number(item.sales), 0);
                    const totalOrders = data.reduce((sum, item) => sum + Number(item.orders), 0);

                    trendOutput.textContent =
                        "Daily Report\n" +
                        "Date: " + date + "\n" +
                        "Total Sales: $" + totalSales.toFixed(2) + "\n" +
                        "Total Orders: " + totalOrders;

                    const labels = data.map(item => {
                        const hour = Number(item.hour);
                        const displayHour = hour % 12 || 12;
                        const period = hour < 12 ? "AM" : "PM";

                        return displayHour + " " + period;
                    });
                    const values = data.map(item => Number(item.sales));
                    drawTrendChart("bar", labels, values, "Sales ($)");
                }
                else if (reportType === "Sales Report"){
                    const startDate = document.getElementById("salesStart").value;
                    const endDate = document.getElementById("salesEnd").value;
                    if (!validDateRange(startDate, endDate)) return;

                    const response = await fetch(`/api/manager/sales-report?startDate=${startDate}&endDate=${endDate}`);
                    if (!response.ok) {
                        throw new Error("Failed to generate Sales Report");
                    }

                    const data = await response.json();
                    const totalSales = data.reduce((sum, item) => sum + Number(item.sales), 0);
                    const totalOrders = data.reduce((sum, item) => sum + Number(item.orders), 0);

                    trendOutput.textContent =
                        "Sales Report\n" +
                        "Period: " + startDate + " to " + endDate + "\n" +
                        "Total Sales: $" + totalSales.toFixed(2) + "\n" +
                        "Total Orders: " + totalOrders;
                    const labels = data.map(item => {
                        return String(item.date).split("T")[0];
                    });
                    const values = data.map(item => Number(item.sales));
                    drawTrendChart("line", labels, values, "Sales ($)");
                }
                else if (reportType === "Product Usage Report"){
                    const startDate = document.getElementById("usageStart").value;
                    const endDate = document.getElementById("usageEnd").value;
                    if (!validDateRange(startDate, endDate)) return;

                    const response = await fetch(`/api/manager/product-usage-report?startDate=${startDate}&endDate=${endDate}`);
                    if (!response.ok) {
                        throw new Error("Failed to generate Product Usage Report");
                    }

                    const data = await response.json();
                    let report =
                        "Product Usage Report\n" +
                        "Period: " + startDate + " to " + endDate + "\n\n";

                    if (data.length === 0) {
                        report += "No sales data found.";
                    } else {
                        data.forEach(item => {
                            report += item.product + ": " + item.quantity + "\n";
                        });
                    }

                    trendOutput.textContent = report;

                    const labels = data.map(item => item.product);
                    const values = data.map(item => Number(item.quantity));
                    drawTrendChart("bar", labels, values, "Quantity Sold");
                }

            }
            catch (error) {
                console.error("Trend Report Error:", error);
                trendOutput.textContent = error.message;

                if (currentChart) {
                    currentChart.destroy();
                    currentChart = null;
                }
                chartPanel.hidden = true;
            }
        });
    });

    function drawTrendChart(chartType, labels, values, datasetLabel) {
        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }

        if (labels.length === 0) {
            chartPanel.hidden = true;
            return;
        }

        chartPanel.hidden = false;
        currentChart = new Chart(chartCanvas, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: datasetLabel,
                    data: values,
                    backgroundColor: "#99ccba",
                    borderColor: "#184e36",
                    borderWidth: 2,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});

