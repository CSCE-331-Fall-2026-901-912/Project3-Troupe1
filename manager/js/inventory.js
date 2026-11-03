document.addEventListener("DOMContentLoaded", () => {
    let inventoryItems = [
        { id: 1, name: "Tapioca Pearls", quantity: 25, unit: "kg" },
        { id: 2, name: "Whole Milk", quantity: 40, unit: "L" },
        { id: 3, name: "Matcha Powder", quantity: 8, unit: "kg" },
        { id: 4, name: "Taro Powder", quantity: 12, unit: "kg" }
    ];

    const inventoryBody = document.getElementById("inventoryBody");
    const addButton = document.querySelector('[data-add="inventory"]');

    function renderInventory() {
        inventoryBody.innerHTML = "";
        inventoryItems.forEach((item) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>
                    <button data-edit-inventory="${item.id}">Edit</button>
                    <button data-remove-inventory="${item.id}">Remove</button>
                </td>
            `;
            inventoryBody.appendChild(row);
        });
    }

    addButton.addEventListener("click", () => {
        const name = prompt("Enter ingredient name:");
        if (name === null || !name.trim()) return;
        const quantityInput = prompt("Enter quantity:");
        if (quantityInput === null || !quantityInput.trim()) return;

        const quantity = Number(quantityInput);
        if (!Number.isFinite(quantity) || quantity < 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        const unit = prompt("Enter unit (kg, L, etc.):");
        if (unit === null || !unit.trim()) return;
        inventoryItems.push({
            id: Date.now(),
            name: name.trim(),
            quantity: quantity,
            unit: unit.trim()
        });
        renderInventory();
    });

    inventoryBody.addEventListener("click", (event) => {
        const editButton = event.target.closest("[data-edit-inventory]");
        const removeButton = event.target.closest("[data-remove-inventory]");
        if (editButton) {
            const id = Number(editButton.dataset.editInventory);
            const item = inventoryItems.find(item => item.id === id);

            if (!item) return;
            const name = prompt("Edit ingredient name:", item.name);
            if (name === null) return;
            const quantityInput = prompt("Edit quantity:", item.quantity);
            if (quantityInput === null) return;
            const unit = prompt("Edit unit:", item.unit);
            if (unit === null) return;

            const quantity = Number(quantityInput);
            if (!name.trim() || !unit.trim() || quantityInput.trim() === "" || !Number.isFinite(quantity) || quantity < 0) {
                alert("Invalid inventory information.");
                return;
            }
            item.name = name.trim();
            item.quantity = quantity;
            item.unit = unit.trim();
            renderInventory();
        }

        if (removeButton) {
            const id = Number(removeButton.dataset.removeInventory);
            if (!confirm("Remove this ingredient?")) return;
            inventoryItems = inventoryItems.filter(
                item => item.id !== id
            );
            renderInventory();
        }
    });
    renderInventory();
});