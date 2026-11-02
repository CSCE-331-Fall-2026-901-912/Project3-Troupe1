document.addEventListener("DOMContentLoaded", () => {
    const salesData = {
        totalSales: 1250.50,
        totalOrders: 85,
        totalItems: 112,

        categories: {
            milkTea: 50,
            fruitTea: 30,
            specialty: 20
        }
    };

    const xOutput = document.getElementById("xOutput");
    xOutput.textContent =
        "Total Sales: $" + salesData.totalSales.toFixed(2) + "\n" +
        "Total Orders: " + salesData.totalOrders + "\n" +
        "Total Items Sold: " + salesData.totalItems;

    const pieChart = document.querySelector(".pie");
    const milkTea = salesData.categories.milkTea;
    const fruitTea = salesData.categories.fruitTea;
    const specialty = salesData.categories.specialty;
    const total = milkTea + fruitTea + specialty;
    const milkPercent = (milkTea / total) * 100;
    const fruitPercent = (fruitTea / total) * 100;

    pieChart.style.background = `conic-gradient(
        #184e36 0% ${milkPercent}%,
        #99ccba ${milkPercent}% ${milkPercent + fruitPercent}%,
        #e0f2ea ${milkPercent + fruitPercent}% 100%
    )`;
});