document.addEventListener("DOMContentLoaded", () => {
    const reportButtons = document.querySelectorAll(".report-button");
    const trendOutput = document.getElementById("trendOutput");

    const sampleData = {
        daily: {
            totalSales: 425.50,
            totalOrders: 32
        },
        sales: {
            totalSales: 2850.75,
            totalOrders: 215
        },
        usage: [
            { product: "Classic Milk Tea", quantity: 120 },
            { product: "Taro Milk Tea", quantity: 85 },
            { product: "Brown Sugar Boba", quantity: 45 }
        ]
    };

    function validDateRange(startDate, endDate) {
        if (!startDate || !endDate) {
            trendOutput.textContent = "Please select both dates.";
            return false;
        }
        if (startDate > endDate) {
            trendOutput.textContent =
                "Start date cannot be after end date.";
            return false;
        }
        return true;
    }

    reportButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const reportType = button.dataset.report;

            if (reportType === "Daily Report") {
                const date = document.getElementById("dailyDate").value;
                if (!date) {
                    trendOutput.textContent = "Please select a date.";
                    return;
                }
                trendOutput.textContent =
                    "Daily Report\n" +
                    "Date: " + date + "\n" +
                    "Total Sales: $" + sampleData.daily.totalSales.toFixed(2) + "\n" +
                    "Total Orders: " + sampleData.daily.totalOrders;
                drawTrendChart(reportType);
            }
            else if (reportType === "Sales Report") {
                const startDate = document.getElementById("salesStart").value;
                const endDate = document.getElementById("salesEnd").value;
                if (!validDateRange(startDate, endDate)) {
                    return;
                }
                trendOutput.textContent =
                    "Sales Report\n" +
                    "Period: " + startDate + " to " + endDate + "\n" +
                    "Total Sales: $" + sampleData.sales.totalSales.toFixed(2) + "\n" +
                    "Total Orders: " + sampleData.sales.totalOrders;
                drawTrendChart(reportType);
            }
            else if (reportType === "Product Usage Report") {
                const startDate = document.getElementById("usageStart").value;
                const endDate = document.getElementById("usageEnd").value;
                if (!validDateRange(startDate, endDate)) {
                    return;
                }
                let report = "Product Usage Report\n" + "Period: " + startDate + " to " + endDate + "\n\n";
                sampleData.usage.forEach((item) => {
                    report += item.product + ": " + item.quantity + "\n";
                });
                trendOutput.textContent = report;
                drawTrendChart(reportType);
            }
        });
    });
    const chartPanel = document.getElementById("trendChartPanel");
    const chartCanvas = document.getElementById("trendChart");
    let currentChart = null;

    function drawTrendChart(reportType) {
        let chartType;
        let labels;
        let values;
        let datasetLabel;

        if (reportType === "Daily Report") {
            chartType = "bar";
            labels = ["9 AM", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM"];
            values = [35, 70, 105, 80, 125, 65];
            datasetLabel = "Sales ($)";
        } else if (reportType === "Sales Report") {
            chartType = "line";
            labels = ["Oct 25", "Oct 26", "Oct 27",
                      "Oct 28", "Oct 29", "Oct 30", "Oct 31"];
            values = [310, 450, 390, 510, 420, 590, 530];
            datasetLabel = "Sales ($)";
        } else if (reportType === "Product Usage Report") {
            chartType = "bar";
            labels = ["Classic Milk Tea", "Taro Milk Tea",
                      "Brown Sugar Boba", "Matcha Latte"];
            values = [120, 85, 45, 65];
            datasetLabel = "Quantity Sold";
        } else {
            return;
        }

        if (currentChart) {
        currentChart.destroy();
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

