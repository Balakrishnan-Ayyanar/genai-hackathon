CREATE NAMESPACE IF NOT EXISTS lightning.metastore;
CREATE NAMESPACE IF NOT EXISTS lightning.metastore.clauselens;

COMPILE USL IF NOT EXISTS sharing_model DEPLOY NAMESPACE lightning.metastore.clauselens DDL
CREATE TABLE classification (
    classification_id varchar(300) NOT NULL PRIMARY KEY,
    label varchar(300),
    source_id varchar(300),
    version varchar(300),
    effective_from date,
    effective_to date,
    passage varchar(4000)
);
CREATE TABLE document (
    document_id varchar(300) NOT NULL PRIMARY KEY,
    label varchar(300),
    source_id varchar(300),
    version varchar(300),
    effective_from date,
    effective_to date,
    passage varchar(4000),
    classification_id varchar(300) FOREIGN KEY REFERENCES classification(classification_id),
    owner_id varchar(300),
    aliases_json varchar(2000)
);
CREATE TABLE supplier (
    supplier_id varchar(300) NOT NULL PRIMARY KEY,
    label varchar(300),
    source_id varchar(300),
    version varchar(300),
    effective_from date,
    effective_to date,
    passage varchar(4000),
    aliases_json varchar(2000)
);
CREATE TABLE agreement (
    agreement_id varchar(300) NOT NULL PRIMARY KEY,
    label varchar(300),
    source_id varchar(300),
    version varchar(300),
    effective_from date,
    effective_to date,
    passage varchar(4000),
    supplier_id varchar(300) FOREIGN KEY REFERENCES supplier(supplier_id),
    status varchar(300)
);
CREATE TABLE agreement_purpose (
    coverage_id varchar(300) NOT NULL PRIMARY KEY,
    agreement_id varchar(300) FOREIGN KEY REFERENCES agreement(agreement_id),
    purpose varchar(300),
    source_id varchar(300)
);
CREATE TABLE approval (
    approval_id varchar(300) NOT NULL PRIMARY KEY,
    label varchar(300),
    source_id varchar(300),
    version varchar(300),
    effective_from date,
    effective_to date,
    passage varchar(4000),
    document_id varchar(300) FOREIGN KEY REFERENCES document(document_id),
    supplier_id varchar(300) FOREIGN KEY REFERENCES supplier(supplier_id),
    owner_id varchar(300),
    purpose varchar(300),
    status varchar(300)
);
CREATE TABLE policy_clause (
    clause_id varchar(300) NOT NULL PRIMARY KEY,
    label varchar(300),
    source_id varchar(300),
    version varchar(300),
    effective_from date,
    effective_to date,
    passage varchar(4000),
    rule_key varchar(300),
    config_json varchar(4000)
);

UPDATE USL lightning.metastore.clauselens.sharing_model SET DESCRIPTION 'ClauseLens sharing evidence: five fictional source systems, normalized entities, provenance and explicit relationships; no materialization or permission granting.';
