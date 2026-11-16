document.addEventListener("DOMContentLoaded", () => {
    let inventoryItems = [
        { id: 1, name: "Tapioca Pearls", quantity: 25, unit: "kg" },
        { id: 2, name: "Whole Milk", quantity: 40, unit: "L" },
        { id: 3, name: "Matcha Powder", quantity: 8, unit: "kg" },
        { id: 4, name: "Taro Powder", quantity: 12, unit: "kg" }
    ];

    const inventoryBody = document.getElementById("inventoryBody");
    const addForm = document.getElementById("addIngredientForm");
    const nameInput = document.getElementById("ingredientName");
    const quantityInput = document.getElementById("ingredientQuantity");
    const unitInput = document.getElementById("ingredientUnit");
    const status = document.getElementById("inventoryStatus");
    let nextId = Math.max(0, ...inventoryItems.map(item => item.id)) + 1;

    function renderInventory() {
        inventoryBody.innerHTML = "";
        inventoryItems.forEach((item) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td></td>
                <td></td>
                <td></td>
                <td>
                    <button data-edit-inventory="${item.id}">Edit</button>
                    <button data-remove-inventory="${item.id}">Remove</button>
                </td>
            `;
            row.cells[0].textContent = item.name;
            row.cells[1].textContent = item.quantity;
            row.cells[2].textContent = item.unit;
            inventoryBody.appendChild(row);
        });
    }

    [nameInput, unitInput, quantityInput].forEach(input => {
        input.addEventListener("input", () => {
            input.setCustomValidity("");
            status.textContent = "";
        });
    });

    addForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = nameInput.value.trim();
        const unit = unitInput.value.trim();
        const quantity = quantityInput.valueAsNumber;

        nameInput.setCustomValidity(name ? "" : "Enter an ingredient name.");
        unitInput.setCustomValidity(unit ? "" : "Enter a unit.");
        quantityInput.setCustomValidity(
            Number.isFinite(quantity) && quantity >= 0
                ? "" : "Enter a valid quantity of zero or greater."
        );
        if (!addForm.reportValidity()) return;

        inventoryItems.push({ id: nextId++, name, quantity, unit });
        renderInventory();
        addForm.reset();
        status.textContent = `${name} added to inventory.`;
        nameInput.focus();
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