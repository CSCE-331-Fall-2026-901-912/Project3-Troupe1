DROP TABLE IF EXISTS OrderItemAddOns;
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS OrderHistory;
DROP TABLE IF EXISTS Recipe;
DROP TABLE IF EXISTS AddOn;
DROP TABLE IF EXISTS MenuItem;
DROP TABLE IF EXISTS Inventory;
DROP TABLE IF EXISTS Employee;

CREATE TABLE Employee (EmployeeID INT PRIMARY KEY, FirstName VARCHAR(50), LastName VARCHAR(50), Position VARCHAR(50));
CREATE TABLE Inventory (IngredientID INT PRIMARY KEY, IngredientName VARCHAR(100), Category VARCHAR(50), Quantity INT, Unit VARCHAR(20));
CREATE TABLE MenuItem (MenuItemID INT PRIMARY KEY, Category VARCHAR(50), MenuItemName VARCHAR(100), IngredientList VARCHAR(255), Price DECIMAL(10,2));
CREATE TABLE AddOn (AddOnsID INT PRIMARY KEY, IngredientID INT, Name VARCHAR(100), Price DECIMAL(10,2));
CREATE TABLE Recipe (MenuItemID INT, InventoryID INT, InventoryItem VARCHAR(100), AmountUsed DECIMAL(10,2), Unit VARCHAR(20), UsageType VARCHAR(50));
CREATE TABLE OrderHistory (OrderID INT PRIMARY KEY, EmployeeID INT REFERENCES Employee(EmployeeID), CustomerName VARCHAR(100), Total DECIMAL(12,2) NOT NULL, Date DATE, Time TIME);
CREATE TABLE OrderItems (ItemID INT PRIMARY KEY, OrderID INT NOT NULL REFERENCES OrderHistory(OrderID), MenuID INT NOT NULL REFERENCES MenuItem(MenuItemID));
CREATE TABLE OrderItemAddOns (OrderItemID INT NOT NULL REFERENCES OrderItems(ItemID), AddOnID INT NOT NULL REFERENCES AddOn(AddOnsID), PRIMARY KEY (OrderItemID, AddOnID));

\copy Employee (EmployeeID, FirstName, LastName, Position) FROM 'Inventory - Employee.csv' WITH (FORMAT csv, HEADER true);
\copy Inventory (IngredientID, IngredientName, Category, Quantity, Unit) FROM 'Inventory - Inventory.csv' WITH (FORMAT csv, HEADER true);
\copy MenuItem (MenuItemID, Category, MenuItemName, IngredientList, Price) FROM 'Inventory - MenuItem.csv' WITH (FORMAT csv, HEADER true);
\copy AddOn (AddOnsID, IngredientID, Name, Price) FROM 'Inventory - AddOn.csv' WITH (FORMAT csv, HEADER true);
\copy Recipe (MenuItemID, InventoryID, InventoryItem, AmountUsed, Unit, UsageType) FROM 'Inventory - Recipe.csv' WITH (FORMAT csv, HEADER true);
\copy OrderHistory (OrderID, EmployeeID, CustomerName, Total, Date, Time) FROM 'Inventory - OrderHistory.csv' WITH (FORMAT csv, HEADER true);
\copy OrderItems (ItemID, OrderID, MenuID) FROM 'Inventory - OrderItems.csv' WITH (FORMAT csv, HEADER true);
\copy OrderItemAddOns (OrderItemID, AddOnID) FROM 'Inventory - OrderItemAddOns.csv' WITH (FORMAT csv, HEADER true);

SELECT 'Employee' AS table_name, COUNT(*) AS row_count FROM Employee
UNION ALL SELECT 'Inventory', COUNT(*) FROM Inventory
UNION ALL SELECT 'MenuItem', COUNT(*) FROM MenuItem
UNION ALL SELECT 'AddOn', COUNT(*) FROM AddOn
UNION ALL SELECT 'Recipe', COUNT(*) FROM Recipe
UNION ALL SELECT 'OrderHistory', COUNT(*) FROM OrderHistory
UNION ALL SELECT 'OrderItems', COUNT(*) FROM OrderItems
UNION ALL SELECT 'OrderItemAddOns', COUNT(*) FROM OrderItemAddOns;