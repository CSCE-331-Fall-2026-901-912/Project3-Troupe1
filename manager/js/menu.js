document.addEventListener("DOMContentLoaded", () => {
    let menuItems = [
        { id: 1, name: "Classic Milk Tea", category: "Milk Tea", price: 5.25 },
        { id: 2, name: "Taro Milk Tea", category: "Milk Tea", price: 5.50 },
        { id: 3, name: "Matcha Latte", category: "Specialty", price: 5.75 },
        { id: 4, name: "Mango Fruit Tea", category: "Fruit Tea", price: 5.50 }
    ];

    const menuBody = document.getElementById("menuBody");
    const addButton = document.querySelector('[data-add="menu"]');

    function renderMenu() {
        menuBody.innerHTML = "";
        menuItems.forEach((item) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <button data-edit="${item.id}">Edit</button>
                    <button data-remove="${item.id}">Remove</button>
                </td>
            `;
            menuBody.appendChild(row);
        });
    }

    addButton.addEventListener("click", () => {
        const name = prompt("Enter menu item name:");
        if (!name || !name.trim()) return;
        const category = prompt("Enter category:");
        if (!category || !category.trim()) return;
        const priceInput = prompt("Enter price:");
        if (priceInput === null || priceInput.trim() === "") return;

        const price = Number(priceInput);
        if (!Number.isFinite(price) || price < 0) {
            alert("Please enter a valid price.");
            return;
        }
        menuItems.push({
            id: Date.now(),
            name: name.trim(),
            category: category.trim(),
            price: price
        });
        renderMenu();
    });

    menuBody.addEventListener("click", (event) => {
        const editButton = event.target.closest("[data-edit]");
        const removeButton = event.target.closest("[data-remove]");
        if (editButton) {
            const id = Number(editButton.dataset.edit);
            const item = menuItems.find(item => item.id === id);

            if (!item) return;
            const name = prompt("Edit item name:", item.name);
            if (name === null) return;
            const category = prompt("Edit category:", item.category);
            if (category === null) return;
            const priceInput = prompt("Edit price:", item.price);
            if (priceInput === null) return;

            const price = Number(priceInput);
            if (!name.trim() || !category.trim() ||
                priceInput.trim() === "" ||
                !Number.isFinite(price) || price < 0) {
                alert("Invalid menu information.");
                return;
            }

            item.name = name.trim();
            item.category = category.trim();
            item.price = price;
            renderMenu();
        }

        if (removeButton) {
            const id = Number(removeButton.dataset.remove);
            if (!confirm("Remove this menu item?")) return;

            menuItems = menuItems.filter(item => item.id !== id);
            renderMenu();
        }
    });
    renderMenu();
});