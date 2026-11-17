SELECT
    EXTRACT(HOUR FROM Time) AS Hour,
    COUNT(*) AS Orders,
    SUM(Total) AS Sales
FROM OrderHistory
WHERE Date = $1
GROUP BY EXTRACT(HOUR FROM Time)
ORDER BY Hour;