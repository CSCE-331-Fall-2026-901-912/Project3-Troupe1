document.addEventListener("DOMContentLoaded", () => {

    const tabs = document.querySelectorAll(".tab");
    const pages = document.querySelectorAll(".page");
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const selectedTab = tab.dataset.tab;

            pages.forEach((page) => {
                page.classList.remove("active");
            });
            tabs.forEach((button) => {
                button.classList.remove("active");
            });
            document.getElementById(selectedTab).classList.add("active");
            tab.classList.add("active");
        });
    });

    const trendTabs = document.querySelectorAll(".trend-tab");
    const trendPages = document.querySelectorAll(".trend-page");
    trendTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const selected = tab.dataset.trend;
            trendTabs.forEach((button) => {
                button.classList.remove("active");
            });

            trendPages.forEach((page) => {
                page.classList.remove("active");
            });
            tab.classList.add("active");
            document.getElementById(selected).classList.add("active");
        });
    });

    const backButton = document.getElementById("backToHub");
    backButton.addEventListener("click", () => {
        window.location.href = "../hub/hub.html";
    });
});