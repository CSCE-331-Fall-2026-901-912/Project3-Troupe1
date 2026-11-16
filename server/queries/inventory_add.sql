INSERT INTO Inventory (
    IngredientID,
    IngredientName,
    Category,
    Quantity,
    Unit
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;