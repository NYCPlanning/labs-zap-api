SELECT *
FROM contact
WHERE emailaddress1 = '${email:value}'
AND statecode = 'Active'
