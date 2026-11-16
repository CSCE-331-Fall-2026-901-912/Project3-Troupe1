document.addEventListener("DOMContentLoaded", () => {
    const inventoryBody = document.getElementById('inventoryBody');
    const addForm = document.getElementById('addIngredientForm');
    const nameInput = document.getElementById('ingredientName');
    const categoryInput = document.getElementById('ingredientCategory');
    const quantityInput = document.getElementById('ingredientQuantity');
    const unitInput = document.getElementById('ingredientUnit');
    const status = document.getElementById('inventoryStatus');
    
    let inventoryItems = [];

    async function loadInventory() {
        try {
            const response = await fetch('/api/manager/inventory');

            if (!response.ok) {
                throw new Error('Failed to load inventory');
            }

            inventoryItems = await response.json();
            renderInventory();

        } catch (error) {
            console.error('Inventory Error:', error);
            status.textContent = error.message;
        }
    }


    

    function renderInventory() {
        inventoryBody.replaceChildren();
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

    [nameInput, categoryInput, quantityInput, unitInput].forEach(input => {
        input.addEventListener('input', () => {
            input.setCustomValidity('');
            status.textContent = '';
        });
    });

    addForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = nameInput.value.trim();
        const category = categoryInput.value.trim();
        const unit = unitInput.value.trim();
        const quantity = quantityInput.valueAsNumber;

        nameInput.setCustomValidity(name ? "" : "Enter an ingredient name.");
        categoryInput.setCustomValidity(category ? '' : 'Enter a category.');
        unitInput.setCustomValidity(unit ? "" : "Enter a unit.");
        quantityInput.setCustomValidity(
            Number.isFinite(quantity) && quantity >= 0
                ? "" : "Enter a valid quantity of zero or greater."
        );
        if (!addForm.reportValidity()) return;

        try {
            const response = await fetch('/api/manager/inventory', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ingredientName,category,quantity,unit})
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add ingredient');
            }
            addForm.reset();
            await loadInventory();
            status.textContent = `${ingredientName} added to inventory.`;
            nameInput.focus();

        } catch (error) {
            console.error('Add Inventory Error:', error);
            status.textContent = error.message;
        }
    });


    inventoryBody.addEventListener("click", async (event) => {
        const editButton = event.target.closest('[data-edit-inventory]');
        const removeButton = event.target.closest('[data-remove-inventory]');
        const saveButton = event.target.closest('[data-save-inventory]');
        const cancelButton = event.target.closest('[data-cancel-inventory]');

        if (editButton) {
            const id = Number(editButton.dataset.editInventory);
            const item = inventoryItems.find(item => item.id === id);
            if (!item) return;
            renderInventory();

            const row = Array.from(inventoryBody.rows).find(row => Number(row.querySelector('[data-edit-inventory]').dataset.editInventory) === id);
            row.cells[0].replaceChildren();
            row.cells[1].replaceChildren();
            row.cells[2].replaceChildren();

            const nameEdit = document.createElement('input');
            nameEdit.type = 'text';
            nameEdit.value = item.ingredientname;
            nameEdit.dataset.field = 'name';

            const categoryEdit = document.createElement('input');
            categoryEdit.type = 'text';
            categoryEdit.value = item.category;
            categoryEdit.placeholder = 'Category';
            categoryEdit.dataset.field = 'category';

            const quantityEdit = document.createElement('input');
            quantityEdit.type = 'number';
            quantityEdit.min = '0';
            quantityEdit.step = '1';
            quantityEdit.value = item.quantity;
            quantityEdit.dataset.field = 'quantity';

            const unitEdit = document.createElement('input');
            unitEdit.type = 'text';
            unitEdit.value = item.unit;
            unitEdit.dataset.field = 'unit';
            
            row.cells[0].appendChild(nameEdit);
            row.cells[0].appendChild(categoryEdit);
            row.cells[1].appendChild(quantityEdit);
            row.cells[2].appendChild(unitEdit);
            row.cells[3].innerHTML = 
            `
                <button data-save-inventory="${id}">Save</button>
                <button data-cancel-inventory="${id}">Cancel</button>
            `;

            nameEdit.focus();

        }

        if (cancelButton) renderInventory();

        if (saveButton) {
            const id = Number(saveButton.dataset.saveInventory);
            const row = saveButton.closest('tr');
            
            const ingredientName = row.querySelector('[data-field="name"]').value.trim();
            const category = row.querySelector('[data-field="category"]').value.trim();
            const quantityText = row.querySelector('[data-field="quantity"]').value;
            const quantity = Number(quantityText);
            const unit = row.querySelector('[data-field="unit"]').value.trim();

            if (!ingredientName || !category ||
                quantityText.trim() === '' ||
                !Number.isSafeInteger(quantity) ||
                quantity < 0 || !unit) {
                status.textContent = 'Invalid inventory information.';
                return;
            }

            try {
                const response = await fetch(`/api/manager/inventory/${id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ingredientName, category, quantity, unit})
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to edit ingredient');
                }

                await loadInventory();
                status.textContent = 'Ingredient updated successfully.';

            } catch (error) {
                console.error('Edit Inventory Error:', error);
                status.textContent = error.message;
            }

        }

        if (removeButton) {
            const id = Number(removeButton.dataset.removeInventory);
            if (!confirm('Remove this ingredient?')) return;

            try {
                const response = await fetch(`/api/manager/inventory/${id}`, {method: 'DELETE'});

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to remove ingredient');
                }
                await loadInventory();
                status.textContent = 'Ingredient removed successfully.';
            } catch (error) {
                console.error('Remove Inventory Error:', error);
                status.textContent = error.message;
            }
        }
    });
    renderInventory();
});