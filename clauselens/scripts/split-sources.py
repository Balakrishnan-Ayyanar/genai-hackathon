"""One-time migration from the legacy combined demo fixture; not a runtime adapter."""
import json,pathlib
rows=json.loads(pathlib.Path('data/evidence.json').read_text())
common=lambda e:dict(source_ref=e['sourceId'],revision=e['version'],valid_from=e['effectiveFrom'],valid_until=e['effectiveTo'],source_text=e['passage'])
sources={'document-registry':dict(documents=[],classifications=[]),'supplier-registry':dict(suppliers=[]),'agreement-register':dict(agreements=[],purposes=[]),'approval-register':dict(approvals=[]),'policy-repository':dict(clauses=[])}
for e in rows:
 c=common(e);f=e['facts'];k=e['kind']
 if k=='Document':sources['document-registry']['documents'].append(dict(report_code=e['id'],report_title=e['label'],classification_code=f['classificationId'],owner_code=f['ownerId'],aliases_json=json.dumps(f['aliases']),**c))
 elif k=='Classification':sources['document-registry']['classifications'].append(dict(class_code=e['id'],caption=e['label'],**c))
 elif k=='Supplier':sources['supplier-registry']['suppliers'].append(dict(vendor_code=e['id'],display_name=e['label'],aliases_json=json.dumps(f['aliases']),**c))
 elif k=='Agreement':
  sources['agreement-register']['agreements'].append(dict(contract_code=e['id'],contract_title=e['label'],vendor_code=f['supplierId'],contract_state=f['status'],**c))
  for purpose in f['purposes']:sources['agreement-register']['purposes'].append(dict(coverage_code=e['id']+':'+purpose,contract_code=e['id'],purpose_code=purpose,source_ref=e['sourceId']))
 elif k=='Approval':sources['approval-register']['approvals'].append(dict(decision_code=e['id'],decision_title=e['label'],report_ref=f['documentId'],recipient_id=f['supplierId'],approver_ref=f['ownerId'],intended_use=f['purpose'],decision=f['status'],**c))
 elif k=='PolicyClause':sources['policy-repository']['clauses'].append(dict(clause_code=e['id'],heading=e['label'],rule_key=f['rule'],config_json=json.dumps(f),**c))
for name,data in sources.items():pathlib.Path('data/sources/'+name+'.json').write_text(json.dumps(data,indent=2)+'\n')
print('Created five independent fictional source files. The legacy fixture is unchanged.')
