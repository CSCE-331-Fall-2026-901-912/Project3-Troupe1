SELECT
    MenuItem.MenuItemID,
    COUNT(*) AS TotalSold
FROM OrderItems
JOIN MenuItem
    ON OrderItems.MenuID = MenuItem.MenuItemID
GROUP BY MenuItem.MenuItemID
ORDER BY TotalSold DESC, MenuItem.MenuItemID
LIMIT 5;
