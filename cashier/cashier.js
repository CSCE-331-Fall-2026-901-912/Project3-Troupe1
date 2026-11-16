
let menuItems = [];
let addOns = [];

const menuGrid = document.getElementById("menuGrid");
const drinkGrid = document.getElementById("drinkGrid");
const menuTitle = document.getElementById("menuTitle");
const backButton = document.getElementById("backButton");
const customization = document.getElementById("customization");
const addonList = document.getElementById("addonList");
const orderList = document.getElementById("orderList");
const popularDrinks = document.getElementById("popularDrinks");

let currentCategory = "";
let selectedDrink = null;
let currentOrder = [];

// Get the menu and add-ons from PostgreSQL when the page loads
async function loadCashierMenu() {
    try {
        const [menuResponse, addOnResponse] = await Promise.all([
            fetch("/api/cashier/menu"),
            fetch("/api/cashier/add-ons")
        ]);

        if (!menuResponse.ok || !addOnResponse.ok) {
            throw new Error("Could not load the cashier menu");
        }

        const [menuData, addOnData] = await Promise.all([
            menuResponse.json(),
            addOnResponse.json()
        ]);

        if (!Array.isArray(menuData) || !Array.isArray(addOnData)) {
            throw new Error("Unexpected menu data from the server");
        }

        // PostgreSQL DECIMAL values arrive as strings, so convert prices to numbers
        menuItems = menuData.map(item => ({
            id: Number(item.id),
            name: item.name,
            category: item.category,
            price: Number(item.price)
        }));

        addOns = addOnData.map(addOn => ({
            id: Number(addOn.id),
            name: addOn.name,
            price: Number(addOn.price)
        }));

        showCategories();
        showCategoryButtons();
        loadPopularDrinks();

    } catch (error) {
        console.error("Cashier menu error:", error);
        menuGrid.textContent = "Could not load the menu. Please refresh the page.";
        popularDrinks.textContent = "Popular drinks are unavailable right now.";
    }
}

// Create category buttons using the categories in the database
function showCategoryButtons() {
    menuGrid.replaceChildren();
    const categories = [...new Set(menuItems.map(item => item.category))];

    if (categories.length === 0) {
        menuGrid.textContent = "No drinks are available.";
        return;
    }

    categories.forEach(category => {
        const button = document.createElement("button");
        button.className = "category-button";
        button.textContent = category;
        button.addEventListener("click", () => showCategory(category));
        menuGrid.appendChild(button);
    });
}

// Load the three best-selling drinks from actual order history
async function loadPopularDrinks() {
    try {
        const response = await fetch("/api/cashier/popular");
        if (!response.ok) {
            throw new Error("Could not load popular drinks");
        }

        const popularData = await response.json();
        if (!Array.isArray(popularData)) {
            throw new Error("Unexpected popular drink data");
        }

        popularDrinks.replaceChildren();

        popularData.forEach(row => {
            const item = menuItems.find(item => item.id === Number(row.id));
            if (!item) return;

            const button = document.createElement("button");
            button.className = "drink-button";
            button.textContent = item.name;
            button.addEventListener("click", () => {
                currentCategory = item.category;
                showDrinkCustomization(item);
            });
            popularDrinks.appendChild(button);
        });

        if (popularDrinks.children.length === 0) {
            popularDrinks.textContent = "No popular drinks available.";
        }

    } catch (error) {
        console.error("Popular drinks error:", error);
        popularDrinks.textContent = "Popular drinks are unavailable right now.";
    }
}

// Show drinks from the selected category
function showCategory(category) {
    currentCategory = category;
    menuTitle.textContent = category;
    menuGrid.style.display = "none";
    drinkGrid.style.display = "grid";
    customization.style.display = "none";
    backButton.style.display = "block";
    drinkGrid.replaceChildren();

    menuItems.filter(item => item.category === category).forEach(item => {
        const drink = document.createElement("button");
        drink.className = "menu-drink";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const price = document.createElement("span");
        price.textContent = "$" + item.price.toFixed(2);

        drink.append(name, price);
        drink.addEventListener("click", () => showDrinkCustomization(item));
        drinkGrid.appendChild(drink);
    });
}

// Return to the category buttons
function showCategories() {
    menuTitle.textContent = "Select a Category";
    menuGrid.style.display = "grid";
    drinkGrid.style.display = "none";
    customization.style.display = "none";
    backButton.style.display = "none";
}

// Open drink customization
function showDrinkCustomization(item) {
    selectedDrink = item;
    menuTitle.textContent = "Customize Drink";
    document.getElementById("drinkName").textContent = item.name;
    document.getElementById("basePrice").textContent = "Base Price: $" + item.price.toFixed(2);

    menuGrid.style.display = "none";
    drinkGrid.style.display = "none";
    customization.style.display = "block";
    backButton.style.display = "block";
    addonList.replaceChildren();

    let availableAddOns = addOns;

    // Preserve the Project 2 customization rules
    if (item.category === "Seasonal" || item.category === "Seasonal Drink") {
        availableAddOns = [];
    } else if (item.id === 20) {
        availableAddOns = addOns.filter(addOn => addOn.name !== "Grass Jelly");
    }

    if (availableAddOns.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No optional add-ons for this drink.";
        addonList.appendChild(message);
    }

    availableAddOns.forEach(addOn => {
        const label = document.createElement("label");
        label.className = "addon-option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = addOn.id;
        input.addEventListener("change", updateCustomTotal);

        const name = document.createElement("span");
        name.textContent = addOn.name;

        const price = document.createElement("span");
        price.textContent = "+$" + addOn.price.toFixed(2);

        label.append(input, name, price);
        addonList.appendChild(label);
    });

    updateCustomTotal();
}

// Get the selected add-ons
function getSelectedAddOns() {
    return Array.from(addonList.querySelectorAll("input:checked"))
        .map(input => addOns.find(addOn => addOn.id === Number(input.value)))
        .filter(Boolean);
}

// Calculate prices using cents to avoid floating-point rounding errors
function getDrinkTotal(drink, selectedAddOns) {
    let cents = Math.round(drink.price * 100);
    selectedAddOns.forEach(addOn => {
        cents += Math.round(addOn.price * 100);
    });
    return cents / 100;
}

// Update the customization price
function updateCustomTotal() {
    if (!selectedDrink) return;
    const total = getDrinkTotal(selectedDrink, getSelectedAddOns());
    document.getElementById("customTotal").textContent = "Total: $" + total.toFixed(2);
}

// Add the customized drink to the order
const addToOrderButton = document.getElementById("addToOrderButton");
addToOrderButton.addEventListener("click", () => {
    if (!selectedDrink || addToOrderButton.disabled) return;

    const selectedAddOns = getSelectedAddOns();
    const total = getDrinkTotal(selectedDrink, selectedAddOns);

    currentOrder.push({
        id: selectedDrink.id,
        name: selectedDrink.name,
        addOns: selectedAddOns.map(addOn => addOn.name),
        addOnIds: selectedAddOns.map(addOn => addOn.id),
        total: total
    });

    updateOrder();
    showCategory(currentCategory);
});

// Update the order display
function updateOrder() {
    orderList.replaceChildren();
    let totalCents = 0;

    if (currentOrder.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-order";
        message.textContent = "No items in order yet.";
        orderList.appendChild(message);
    }

    currentOrder.forEach(item => {
        totalCents += Math.round(item.total * 100);

        const row = document.createElement("div");
        row.className = "order-item";

        const details = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = item.name;
        const toppings = document.createElement("small");
        toppings.textContent = item.addOns.length ? item.addOns.join(", ") : "No add-ons";
        details.append(name, toppings);

        const price = document.createElement("span");
        price.textContent = "$" + item.total.toFixed(2);
        row.append(details, price);
        orderList.appendChild(row);
    });

    document.getElementById("orderTotal").textContent = "$" + (totalCents / 100).toFixed(2);
    document.getElementById("checkoutButton").disabled = currentOrder.length === 0;
}

// Back button
backButton.addEventListener("click", () => {
    if (customization.style.display === "block") {
        showCategory(currentCategory);
    } else {
        showCategories();
    }
});

// Submit cashier orders to the backend
// This is the same checkout behavior that was working in Step 2.
document.getElementById("checkoutButton").addEventListener("click", async () => {
    if (currentOrder.length === 0) return;

    const button = document.getElementById("checkoutButton");
    const addButton = document.getElementById("addToOrderButton");

    button.disabled = true;
    addButton.disabled = true;
    button.textContent = "Saving...";

    try {
        const response = await fetch("/api/cashier/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                items: currentOrder.map(item => ({
                    id: item.id,
                    addOnIds: item.addOnIds
                }))
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Could not save order");
        }

        // Only clear the order after the database confirms it was saved
        currentOrder = [];
        updateOrder();
        showCategories();

        alert(`Order #${result.orderId} saved! Total: $${Number(result.total).toFixed(2)}`);

    } catch (error) {
        console.error("Cashier checkout error:", error);
        alert("Couldn't save order: " + error.message);

    } finally {
        button.textContent = "Checkout";
        button.disabled = currentOrder.length === 0;
        addButton.disabled = false;
    }
});

// Load the live menu on page load.
loadCashierMenu();
