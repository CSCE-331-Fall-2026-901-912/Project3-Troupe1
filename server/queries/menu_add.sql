INSERT INTO MenuItem (
    MenuItemID,
    Category,
    MenuItemName,
    IngredientList,
    Price
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;