document.addEventListener('DOMContentLoaded', () => {
    loadMenuItems();
    const addButton = document.querySelector('[data-add="menu"]');
    addButton.addEventListener('click', addMenuItem);
});

async function loadMenuItems() {
    const menuBody = document.getElementById('menuBody');
    try {
        const response = await fetch('/api/manager/menu');
        if (!response.ok) {
            throw new Error('Failed to load menu items');
        }

        const menuItems = await response.json();

        menuBody.replaceChildren();

        menuItems.forEach(item => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = item.menuitemname;

            const categoryCell = document.createElement('td');
            categoryCell.textContent = item.category;

            const priceCell = document.createElement('td');
            priceCell.textContent = `$${Number(item.price).toFixed(2)}`;

            const actionCell = document.createElement('td');

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'small-btn';
            editButton.addEventListener('click', () => {
                editMenuItem(item);
            });
            
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'small-btn danger';
            removeButton.addEventListener('click', () => {
                removeMenuItem(item.menuitemid);
            });

            actionCell.appendChild(editButton);
            actionCell.appendChild(removeButton);

            row.appendChild(nameCell);
            row.appendChild(categoryCell);
            row.appendChild(priceCell);
            row.appendChild(actionCell);

            menuBody.appendChild(row);
        });

    } catch (error) {
        console.error('Menu Error:', error);
    }
}

async function addMenuItem() {
    const idInput = prompt('Enter Menu Item ID:');
    if (idInput === null) return;

    const menuItemID = Number(idInput);
    if (!Number.isSafeInteger(menuItemID) || menuItemID <= 0) {
        alert('Invalid Menu Item ID.');
        return;
    }

    const menuItemName = prompt('Enter Menu Item Name:');
    if (menuItemName === null) return;

    const category = prompt('Enter Category:');
    if (category === null) return;

    const ingredientList = prompt('Enter Ingredient List:');
    if (ingredientList === null) return;

    const priceInput = prompt('Enter Price:');
    if (priceInput === null) return;

    const price = Number(priceInput);
    if (!menuItemName.trim() || !category.trim() 
        || !Number.isFinite(price) || priceInput.trim() === '' || price < 0) {
        alert('Invalid menu item information.');
        return;
    }
    try {
        const response = await fetch('/api/manager/menu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                menuItemID,
                category,
                menuItemName,
                ingredientList,
                price
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add menu item');
        }
        alert('Menu item added successfully.');
        await loadMenuItems();
    } catch (error) {
        console.error('Add Menu Error:', error);
        alert(error.message);
    }
}

async function editMenuItem(item) {
    const menuItemName = prompt(
        'Enter Menu Item Name:',
        item.menuitemname
    );
    if (menuItemName === null) return;

    const category = prompt(
        'Enter Category:',
        item.category
    );
    if (category === null) return;

    const ingredientList = prompt(
        'Enter Ingredient List:',
        item.ingredientlist || ''
    );
    if (ingredientList === null) return;

    const priceInput = prompt(
        'Enter Price:',
        item.price
    );
    if (priceInput === null) return;

    const price = Number(priceInput);

    if (!menuItemName.trim() || !category.trim() ||
        !Number.isFinite(price) || priceInput.trim() === '' || price < 0) {
        alert('Invalid menu item information.');
        return;
    }
    try {
        const response = await fetch(
            `/api/manager/menu/${item.menuitemid}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category,
                    menuItemName,
                    ingredientList,
                    price
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to edit menu item');
        }

        alert('Menu item updated successfully.');
        await loadMenuItems();

    } catch (error) {
        console.error('Edit Menu Error:', error);
        alert(error.message);
    }
}

async function removeMenuItem(menuItemID) {
    if (!confirm('Are you sure you want to remove this menu item?')) {
        return;
    }

    try {
        const response = await fetch(
            `/api/manager/menu/${menuItemID}`,
            {
                method: 'DELETE'
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove menu item');
        }

        alert('Menu item removed successfully.');
        await loadMenuItems();

    } catch (error) {
        console.error('Remove Menu Error:', error);
        alert(error.message);
    }
}
