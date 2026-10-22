ACTIVATE USL TABLE lightning.metastore.clauselens.sharing_model.classification AS
SELECT
    COALESCE(r.class_code, '') AS classification_id,
    r.caption AS label,
    r.source_ref AS source_id,
    r.revision AS version,
    CAST(r.valid_from AS DATE) AS effective_from,
    CAST(r.valid_until AS DATE) AS effective_to,
    r.source_text AS passage
FROM CL_DOCUMENTS.registry LATERAL VIEW explode(classifications) AS r;

ACTIVATE USL TABLE lightning.metastore.clauselens.sharing_model.document AS
SELECT
    COALESCE(r.report_code, '') AS document_id,
    r.report_title AS label,
    r.source_ref AS source_id,
    r.revision AS version,
    CAST(r.valid_from AS DATE) AS effective_from,
    CAST(r.valid_until AS DATE) AS effective_to,
    r.source_text AS passage,
    r.classification_code AS classification_id,
    r.owner_code AS owner_id,
    r.aliases_json AS aliases_json
FROM CL_DOCUMENTS.registry LATERAL VIEW explode(documents) AS r;

ACTIVATE USL TABLE lightning.metastore.clauselens.sharing_model.supplier AS
SELECT
    COALESCE(r.vendor_code, '') AS supplier_id,
    r.display_name AS label,
    r.source_ref AS source_id,
    r.revision AS version,
    CAST(r.valid_from AS DATE) AS effective_from,
    CAST(r.valid_until AS DATE) AS effective_to,
    r.source_text AS passage,
    r.aliases_json AS aliases_json
FROM CL_SUPPLIERS.registry LATERAL VIEW explode(suppliers) AS r;

ACTIVATE USL TABLE lightning.metastore.clauselens.sharing_model.agreement AS
SELECT
    COALESCE(r.contract_code, '') AS agreement_id,
    r.contract_title AS label,
    r.source_ref AS source_id,
    r.revision AS version,
    CAST(r.valid_from AS DATE) AS effective_from,
    CAST(r.valid_until AS DATE) AS effective_to,
    r.source_text AS passage,
    r.vendor_code AS supplier_id,
    r.contract_state AS status
FROM CL_AGREEMENTS.registry LATERAL VIEW explode(agreements) AS r;

ACTIVATE USL TABLE lightning.metastore.clauselens.sharing_model.agreement_purpose AS
SELECT
    COALESCE(r.coverage_code, '') AS coverage_id,
    r.contract_code AS agreement_id,
    r.purpose_code AS purpose,
    r.source_ref AS source_id
FROM CL_AGREEMENTS.registry LATERAL VIEW explode(purposes) AS r;

ACTIVATE USL TABLE lightning.metastore.clauselens.sharing_model.approval AS
SELECT
    COALESCE(r.decision_code, '') AS approval_id,
    r.decision_title AS label,
    r.source_ref AS source_id,
    r.revision AS version,
    CAST(r.valid_from AS DATE) AS effective_from,
    CAST(r.valid_until AS DATE) AS effective_to,
    r.source_text AS passage,
    r.report_ref AS document_id,
    r.recipient_id AS supplier_id,
    r.approver_ref AS owner_id,
    r.intended_use AS purpose,
    r.decision AS status
FROM CL_APPROVALS.registry LATERAL VIEW explode(approvals) AS r;

ACTIVATE USL TABLE lightning.metastore.clauselens.sharing_model.policy_clause AS
SELECT
    COALESCE(r.clause_code, '') AS clause_id,
    r.heading AS label,
    r.source_ref AS source_id,
    r.revision AS version,
    CAST(r.valid_from AS DATE) AS effective_from,
    CAST(r.valid_until AS DATE) AS effective_to,
    r.source_text AS passage,
    r.rule_key AS rule_key,
    r.config_json AS config_json
FROM CL_POLICIES.registry LATERAL VIEW explode(clauses) AS r;
