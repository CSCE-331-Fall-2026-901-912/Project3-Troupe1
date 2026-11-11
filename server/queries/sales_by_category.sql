SELECT
    MenuItem.Category,
    COUNT(*) AS ItemsSold
FROM OrderHistory
JOIN OrderItems
    ON OrderHistory.OrderID = OrderItems.OrderID
JOIN MenuItem
    ON OrderItems.MenuID = MenuItem.MenuItemID
WHERE OrderHistory.Date = $1
GROUP BY MenuItem.Category
ORDER BY MenuItem.Category;