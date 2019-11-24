SELECT *
FROM contact
WHERE emailaddress1 ILIKE ${email}
AND statecode = 'Active'
