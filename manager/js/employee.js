document.addEventListener("DOMContentLoaded", () => {
    let employees = [
        { id: 101, name: "Alex Kim", position: "Manager" },
        { id: 102, name: "Jamie Lee", position: "Cashier" },
        { id: 103, name: "Taylor Park", position: "Cashier" }
    ];

    const employeeBody = document.getElementById("employeeBody");
    const addButton = document.querySelector('[data-add="employee"]');

    function renderEmployees() {
        employeeBody.innerHTML = "";
        employees.forEach((employee) => {
            const row = document.createElement("tr");
            const idCell = document.createElement("td");
            idCell.textContent = employee.id;

            const nameCell = document.createElement("td");
            nameCell.textContent = employee.name;

            const positionCell = document.createElement("td");
            positionCell.textContent = employee.position;

            const actionCell = document.createElement("td");
            
            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.dataset.editEmployee = employee.id;

            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.dataset.removeEmployee = employee.id;
            
            actionCell.append(editButton, removeButton);
            row.append(idCell, nameCell, positionCell, actionCell);
            employeeBody.appendChild(row);
        });
    }

    addButton.addEventListener("click", () => {
        const name = prompt("Enter employee name:");
        if (name === null || !name.trim()) return;

        const position = prompt("Enter position (Manager/Cashier):");
        if (position === null || !position.trim()) return;

        const newId = Math.max(100, ...employees.map(emp => emp.id)) + 1;
        employees.push({
            id: newId,
            name: name.trim(),
            position: position.trim()
        });
        renderEmployees();
    });

    employeeBody.addEventListener("click", (event) => {
        const editButton = event.target.closest("[data-edit-employee]");
        const removeButton = event.target.closest("[data-remove-employee]");

        if (editButton) {
            const id = Number(editButton.dataset.editEmployee);
            const employee = employees.find(emp => emp.id === id);
            if (!employee) return;

            const name = prompt("Edit employee name:", employee.name);
            if (name === null) return;

            const position = prompt("Edit position:", employee.position);
            if (position === null) return;
            if (!name.trim() || !position.trim()) {
                alert("Employee name and position cannot be empty.");
                return;
            }

            employee.name = name.trim();
            employee.position = position.trim();
            renderEmployees();
        }

        if (removeButton) {
            const id = Number(removeButton.dataset.removeEmployee);
            if (!confirm("Remove this employee?")) return;

            employees = employees.filter(emp => emp.id !== id);
            renderEmployees();
        }
    });
    renderEmployees();
});