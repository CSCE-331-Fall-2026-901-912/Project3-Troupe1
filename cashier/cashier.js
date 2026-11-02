
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

// Set up category buttons
document.querySelectorAll(".category-button").forEach(button => {
    button.addEventListener("click", () => {
        showCategory(button.dataset.category);
    });
});

// Show drinks in the selected category
function showCategory(category) {
    menuTitle.textContent = category;
    menuGrid.style.display = "none";
    drinkGrid.style.display = "grid";
    backButton.style.display = "block";

    drinkGrid.innerHTML = "";

    menuItems.forEach(item => {
        if (item.category === category) {
            const drink = document.createElement("div");
            drink.className = "menu-drink";

            drink.innerHTML = `
                <strong>${item.name}</strong>
                <span>$${item.price.toFixed(2)}</span>
            `;

            drinkGrid.appendChild(drink);
        }
    });
}

// Return to category selection
function showCategories() {
    menuTitle.textContent = "Select a Category";
    menuGrid.style.display = "grid";
    drinkGrid.style.display = "none";
    backButton.style.display = "none";
}

backButton.addEventListener("click", showCategories);
