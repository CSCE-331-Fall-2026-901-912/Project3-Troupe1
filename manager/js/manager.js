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
});