
const menuItems = [
    { id: 1, name: "Classic Milk Tea", category: "Milk Tea", price: 5.25 },
    { id: 2, name: "Taro Milk Tea", category: "Milk Tea", price: 5.75 },
    { id: 3, name: "Matcha Milk Tea", category: "Milk Tea", price: 6.00 },
    { id: 4, name: "Brown Sugar Milk Tea", category: "Milk Tea", price: 6.25 },
    { id: 5, name: "Thai Milk Tea", category: "Milk Tea", price: 5.50 },
    { id: 6, name: "Oolong Milk Tea", category: "Milk Tea", price: 5.50 },
    { id: 7, name: "Jasmine Milk Tea", category: "Milk Tea", price: 5.50 },
    { id: 8, name: "Chocolate Milk Tea", category: "Milk Tea", price: 5.75 },
    { id: 9, name: "Mango Green Tea", category: "Fruit Tea", price: 5.75 },
    { id: 10, name: "Strawberry Green Tea", category: "Fruit Tea", price: 5.75 },
    { id: 11, name: "Passion Fruit Green Tea", category: "Fruit Tea", price: 5.75 },
    { id: 12, name: "Peach Green Tea", category: "Fruit Tea", price: 5.50 },
    { id: 13, name: "Lychee Green Tea", category: "Fruit Tea", price: 5.75 },
    { id: 14, name: "Mango Milk Tea", category: "Milk Tea", price: 6.00 },
    { id: 15, name: "Strawberry Milk Tea", category: "Milk Tea", price: 6.00 },
    { id: 16, name: "Coconut Milk Tea", category: "Milk Tea", price: 6.75 },
    { id: 17, name: "Brown Sugar Boba Coffee", category: "Coffee", price: 6.25 },
    { id: 18, name: "Yuanyang Coffee Milk Tea", category: "Coffee", price: 5.75 },
    { id: 19, name: "Thai Tea Coffee", category: "Coffee", price: 6.25 },
    { id: 20, name: "Coconut Mocha With Grass Jelly", category: "Coffee", price: 6.50 },
    { id: 21, name: "Mango Passion Fruit Smoothie", category: "Smoothie", price: 6.50 },
    { id: 22, name: "Strawberry Banana Smoothie", category: "Smoothie", price: 6.50 },
    { id: 23, name: "Peach Lychee Smoothie", category: "Smoothie", price: 6.25 },
    { id: 24, name: "Taro Coconut Smoothie", category: "Smoothie", price: 6.50 },
    { id: 25, name: "Pumpkin spice latte", category: "Seasonal Drink", price: 6.50 },
    { id: 26, name: "Pepermint Shake", category: "Seasonal Drink", price: 6.00 }
];

const menuGrid = document.getElementById("menuGrid");
const drinkGrid = document.getElementById("drinkGrid");
const menuTitle = document.getElementById("menuTitle");
const backButton = document.getElementById("backButton");
const customization = document.getElementById("customization");
const addonList = document.getElementById("addonList");
const orderList = document.getElementById("orderList");

const addOns = [
    { id: 1, name: "Tapioca Pearls", price: 0.75 },
    { id: 2, name: "Mango Popping Boba", price: 0.75 },
    { id: 3, name: "Strawberry Popping Boba", price: 0.75 },
    { id: 4, name: "Lychee Jelly", price: 0.65 },
    { id: 5, name: "Grass Jelly", price: 0.65 },
    { id: 6, name: "Aloe Vera", price: 0.75 },
    { id: 7, name: "Pudding", price: 0.65 },
    { id: 8, name: "Red Bean", price: 0.75 }
];

let currentCategory = "";
let selectedDrink = null;
let currentOrder = [];

// Category buttons
document.querySelectorAll(".category-button").forEach(button => {
    button.addEventListener("click", () => showCategory(button.dataset.category));
});

// Popular drink buttons
document.querySelectorAll(".popular-drinks .drink-button").forEach(button => {
    button.addEventListener("click", () => {
        const item = menuItems.find(item => item.id === Number(button.dataset.id));

        if (item) {
            currentCategory = item.category;
            showDrinkCustomization(item);
        }
    });
});

// Show drinks from a category
function showCategory(category) {
    currentCategory = category;
    menuTitle.textContent = category;
    menuGrid.style.display = "none";
    drinkGrid.style.display = "grid";
    customization.style.display = "none";
    backButton.style.display = "block";
    drinkGrid.innerHTML = "";

    menuItems.forEach(item => {
        if (item.category === category) {
            const drink = document.createElement("button");
            drink.className = "menu-drink";

            drink.innerHTML = `
                <strong>${item.name}</strong>
                <span>$${item.price.toFixed(2)}</span>
            `;

            drink.addEventListener("click", () => showDrinkCustomization(item));
            drinkGrid.appendChild(drink);
        }
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
    addonList.innerHTML = "";

    let availableAddOns = addOns;

    // Match the available add-ons from Project 2
    if (item.id >= 25) {
        availableAddOns = [];
    } else if (item.id === 20) {
        availableAddOns = addOns.filter(addOn => addOn.name !== "Grass Jelly");
    }

    if (availableAddOns.length === 0) {
        addonList.innerHTML = "<p>No optional add-ons for this drink.</p>";
    }

    availableAddOns.forEach(addOn => {
        const label = document.createElement("label");
        label.className = "addon-option";

        label.innerHTML = `
            <input type="checkbox" value="${addOn.id}">
            <span>${addOn.name}</span>
            <span>+$${addOn.price.toFixed(2)}</span>
        `;

        addonList.appendChild(label);
    });

    addonList.querySelectorAll("input").forEach(input => {
        input.addEventListener("change", updateCustomTotal);
    });

    updateCustomTotal();
}

// Get the selected add-ons
function getSelectedAddOns() {
    return Array.from(addonList.querySelectorAll("input:checked")).map(input => {
        return addOns.find(addOn => addOn.id === Number(input.value));
    });
}

// Update the customization price
function updateCustomTotal() {
    let total = selectedDrink.price;

    getSelectedAddOns().forEach(addOn => {
        total += addOn.price;
    });

    document.getElementById("customTotal").textContent = "Total: $" + total.toFixed(2);
}

// Add the customized drink to the order
document.getElementById("addToOrderButton").addEventListener("click", () => {
    if (!selectedDrink) return;

    const selectedAddOns = getSelectedAddOns();
    let total = selectedDrink.price;

    selectedAddOns.forEach(addOn => {
        total += addOn.price;
    });

    currentOrder.push({
        name: selectedDrink.name,
        addOns: selectedAddOns.map(addOn => addOn.name),
        total: total
    });

    updateOrder();
    showCategory(currentCategory);
});


function updateOrder() {
    orderList.innerHTML = "";
    let orderTotal = 0;

    if (currentOrder.length === 0) {
        orderList.innerHTML = '<p class="empty-order">No items in order yet.</p>';
    }

    currentOrder.forEach(item => {
        orderTotal += item.total;

        const row = document.createElement("div");
        row.className = "order-item";

        const addOnText = item.addOns.length ? item.addOns.join(", ") : "No add-ons";

        row.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <small>${addOnText}</small>
            </div>
            <span>$${item.total.toFixed(2)}</span>
        `;

        orderList.appendChild(row);
    });

    document.getElementById("orderTotal").textContent = "$" + orderTotal.toFixed(2);
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


// Clear the order when checking out
document.getElementById("checkoutButton").addEventListener("click", () => {
    currentOrder = [];
    updateOrder();
    showCategories();
});
