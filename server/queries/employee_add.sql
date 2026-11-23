INSERT INTO Employee (
    EmployeeID,
    FirstName,
    LastName,
    Position
)
VALUES ($1, $2, $3, $4)
RETURNING *;