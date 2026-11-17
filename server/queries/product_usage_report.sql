SELECT
    MenuItem.MenuItemName AS Product,
    COUNT(*) AS Quantity
FROM OrderHistory
JOIN OrderItems
    ON OrderHistory.OrderID = OrderItems.OrderID
JOIN MenuItem
    ON OrderItems.MenuID = MenuItem.MenuItemID
WHERE OrderHistory.Date BETWEEN $1 AND $2
GROUP BY MenuItem.MenuItemID, MenuItem.MenuItemName
ORDER BY Quantity DESC;