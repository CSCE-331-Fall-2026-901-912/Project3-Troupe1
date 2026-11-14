document.addEventListener("DOMContentLoaded", () => {
    loadEmployees();
    const addButton = document.querySelector('[data-add="employee"]');
    addButton.addEventListener('click', addEmployee);
});

async function loadEmployees() {
    const employeeBody = document.getElementById("employeeBody");
    try {
        const response = await fetch('/api/manager/employees');
        if (!response.ok) throw new Error('Failed to load employees');
        const employees = await response.json();

        employeeBody.replaceChildren();
        employees.forEach(employee => {
            const row = document.createElement('tr');

            const idCell = document.createElement('td');
            idCell.textContent = employee.employeeid;

            const nameCell = document.createElement('td');
            nameCell.textContent = `${employee.firstname} ${employee.lastname}`;

            const positionCell = document.createElement('td');
            positionCell.textContent = employee.position;

            const actionCell = document.createElement('td');

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'small-btn';
            editButton.addEventListener('click', () => {editEmployee(employee);});

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'small-btn danger';
            removeButton.addEventListener('click', () => {removeEmployee(employee.employeeid);});

            actionCell.appendChild(editButton);
            actionCell.appendChild(removeButton);

            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(positionCell);
            row.appendChild(actionCell);

            employeeBody.appendChild(row);
        });
    } catch (error) {
        console.error('Employee Error:', error);
    }
}

async function addEmployee() {
    const employeeID = Number(prompt('Enter Employee ID:'));
    if (!Number.isInteger(employeeID) || employeeID <= 0) {
        alert('Invalid Employee ID.');
        return;
    }

    const firstName = prompt('Enter First Name:');
    if (firstName === null) return;
    const lastName = prompt('Enter Last Name:');
    if (lastName === null) return;
    const position = prompt('Enter Position:');
    if (position === null) return;
    if (!firstName.trim() || !lastName.trim() || !position.trim()) {
        alert('All fields are required.');
        return;
    }

    try {
        const response = await fetch('/api/manager/employees', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({employeeID, firstName, lastName, position})
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add employee');
        }

        alert('Employee added successfully.');
        await loadEmployees();
    } catch (error) {
        console.error('Add Employee Error:', error);
        alert(error.message);
    }
}

async function removeEmployee(employeeID) {
    if (!confirm('Are you sure you want to remove this employee?')) return;

    try {
        const response = await fetch(
            `/api/manager/employees/${employeeID}`,
            {
                method: 'DELETE'
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove employee');
        }

        alert('Employee removed successfully.');
        await loadEmployees();
    } catch (error) {
        console.error('Remove Employee Error:', error);
        alert(error.message);
    }
}

async function editEmployee(employee) {
    const firstName = prompt('Enter First Name:', employee.firstname);
    if (firstName === null) return;

    const lastName = prompt('Enter Last Name:', employee.lastname);
    if (lastName === null) return;

    const position = prompt('Enter Position:', employee.position);
    if (position === null) return;

    if (!firstName.trim() || !lastName.trim() || !position.trim()) {
        alert('All fields are required.');
        return;
    }

    try {
        const response = await fetch(
            `/api/manager/employees/${employee.employeeid}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    position
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to edit employee');
        }
        alert('Employee updated successfully.');
        await loadEmployees();
    } catch (error) {
        console.error('Edit Employee Error:', error);
        alert(error.message);
    }
}
