UPDATE Employee
SET
    FirstName = $1,
    LastName = $2,
    Position = $3
WHERE EmployeeID = $4
RETURNING *;