CREATE LIGHTNING DATABASE CL_DOCUMENTS DESCRIBE BY "ClauseLens fictional document-registry";

CREATE LIGHTNING REST TABLE registry FROM CL_DOCUMENTS REQUEST(endpoint "http://172.18.0.1:3100/source/document-registry", method "get", response_type "json", http_encoding "URLENCODED") HEADER () BODY ();

CREATE LIGHTNING DATABASE CL_SUPPLIERS DESCRIBE BY "ClauseLens fictional supplier-registry";

CREATE LIGHTNING REST TABLE registry FROM CL_SUPPLIERS REQUEST(endpoint "http://172.18.0.1:3100/source/supplier-registry", method "get", response_type "json", http_encoding "URLENCODED") HEADER () BODY ();

CREATE LIGHTNING DATABASE CL_AGREEMENTS DESCRIBE BY "ClauseLens fictional agreement-register";

CREATE LIGHTNING REST TABLE registry FROM CL_AGREEMENTS REQUEST(endpoint "http://172.18.0.1:3100/source/agreement-register", method "get", response_type "json", http_encoding "URLENCODED") HEADER () BODY ();

CREATE LIGHTNING DATABASE CL_APPROVALS DESCRIBE BY "ClauseLens fictional approval-register";

CREATE LIGHTNING REST TABLE registry FROM CL_APPROVALS REQUEST(endpoint "http://172.18.0.1:3100/source/approval-register", method "get", response_type "json", http_encoding "URLENCODED") HEADER () BODY ();

CREATE LIGHTNING DATABASE CL_POLICIES DESCRIBE BY "ClauseLens fictional policy-repository";

CREATE LIGHTNING REST TABLE registry FROM CL_POLICIES REQUEST(endpoint "http://172.18.0.1:3100/source/policy-repository", method "get", response_type "json", http_encoding "URLENCODED") HEADER () BODY ();
