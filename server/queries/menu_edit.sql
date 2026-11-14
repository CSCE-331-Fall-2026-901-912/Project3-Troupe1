UPDATE MenuItem
SET
    Category = $1,
    MenuItemName = $2,
    IngredientList = $3,
    Price = $4
WHERE MenuItemID = $5
RETURNING *;