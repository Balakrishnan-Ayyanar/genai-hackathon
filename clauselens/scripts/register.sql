CREATE LIGHTNING DATABASE CLAUSELENS_REST DESCRIBE BY "ClauseLens fictional evidence source";
CREATE SCHEMASTORE CONTAINER clauselens;
CREATE LIGHTNING REST TABLE records FROM CLAUSELENS_REST REQUEST(endpoint "http://172.18.0.1:3100/source/evidence", method "get", response_type "json", http_encoding "URLENCODED") HEADER () BODY ();
CREATE SCHEMASTORE VIEW evidence WITH CONTAINER clauselens AS SELECT record.id AS id, record.kind AS kind, record.payload AS payload FROM CLAUSELENS_REST.records LATERAL VIEW explode(records) AS record;
