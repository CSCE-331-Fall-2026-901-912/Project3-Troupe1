DELETE FROM Inventory
WHERE IngredientID = $1
RETURNING *;