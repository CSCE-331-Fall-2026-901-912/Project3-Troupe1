document.addEventListener('DOMContentLoaded', () => {
    loadMenuItems();
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

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'small-btn danger';

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
