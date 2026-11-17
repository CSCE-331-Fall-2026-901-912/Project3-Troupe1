SELECT
    Date,
    COUNT(*) AS Orders,
    SUM(Total) AS Sales
FROM OrderHistory
WHERE Date BETWEEN $1 AND $2
GROUP BY Date
ORDER BY Date;