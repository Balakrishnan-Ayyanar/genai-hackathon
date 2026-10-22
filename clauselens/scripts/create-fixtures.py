import json,pathlib
rows=[]
def add(id,kind,label,passage,facts,version='1.0',start='2026-01-01',end='2027-12-31'):
 rows.append(dict(id=id,kind=kind,label=label,sourceId='SRC-'+id.upper(),version=version,effectiveFrom=start,effectiveTo=end,passage=passage,facts=facts))
add('policy-classification','PolicyClause','§1 · Classification','External sharing is allowed only for Partner-shareable documents. Restricted documents must not be shared externally.',dict(rule='classification',allowed=['class-partner'],prohibited=['class-restricted']),version='POL-2026.1')
add('policy-nda','PolicyClause','§2 · NDA coverage','An active NDA must cover the exact supplier and intended purpose on the evaluation date. Validity includes both start and end dates. An expired NDA fails this check; an absent record is unknown.',dict(rule='nda',inclusiveDates=True),version='POL-2026.1')
add('policy-approval','PolicyClause','§3 · Owner approval','An active approval by the document owner must identify the report, recipient and purpose. An explicit denial fails. A missing matching record leaves permission unestablished; it does not prove approval never happened.',dict(rule='approval',requireOwner=True),version='POL-2026.1')
add('policy-conflicts','PolicyClause','§4 · Evidence and conflicts','Use evidence effective on the evaluation date. Unresolved opposing records require review. Otherwise explicit failures take precedence over unknown facts, and all checks must pass for permission. Simulated facts are hypothetical and never grant access.',dict(rule='conflicts'),version='POL-2026.1')
add('class-partner','Classification','Partner-shareable','Partner-shareable material is eligible for external sharing subject to NDA and owner approval.',{})
add('class-restricted','Classification','Restricted','Restricted material must not be shared externally.',{})
add('doc-orion','Document','Project Orion · Design report','Orion design report v3 is Partner-shareable. Document owner: Maya Chen.',dict(classificationId='class-partner',ownerId='owner-maya',aliases=['orion','design report']),version='3')
add('doc-vega','Document','Project Vega · Security report','Vega security report v2 is Restricted. Document owner: Arun Shah.',dict(classificationId='class-restricted',ownerId='owner-arun',aliases=['vega','security report']),version='2')
add('supplier-a','Supplier','Supplier A','Supplier A is the fictional engineering partner Aster Components.',dict(aliases=['supplier a','aster']))
add('supplier-b','Supplier','Supplier B','Supplier B is the fictional supplier Boreal Systems.',dict(aliases=['supplier b','boreal']))
add('nda-a','Agreement','NDA · Supplier A','Supplier A NDA covers technical review, marketing and audit from 1 January 2026 through 31 December 2027 inclusive.',dict(supplierId='supplier-a',purposes=['technical review','marketing','audit'],status='valid'),end='2027-12-31')
add('nda-b','Agreement','NDA · Supplier B (expired)','Supplier B NDA covers technical review from 1 January 2026 through 30 September 2026 inclusive. No renewal is supplied.',dict(supplierId='supplier-b',purposes=['technical review'],status='valid'),end='2026-09-30')
for id,doc,sup,purpose,owner,status in [('approval-marketing','doc-orion','supplier-a','marketing','owner-maya','approved'),('approval-b','doc-orion','supplier-b','technical review','owner-maya','approved'),('approval-vega','doc-vega','supplier-a','technical review','owner-arun','approved'),('approval-audit-yes','doc-orion','supplier-a','audit','owner-maya','approved'),('approval-audit-no','doc-orion','supplier-a','audit','owner-maya','denied')]:
 add(id,'Approval',id.replace('-',' ').title(),f'Owner {owner} recorded {status} for {doc} to {sup} for {purpose}. No superseding record is supplied.',dict(documentId=doc,supplierId=sup,purpose=purpose,ownerId=owner,status=status))
pathlib.Path('data/evidence.json').write_text(json.dumps(rows,indent=2)+'\n')
print(f'Created {len(rows)} fictional evidence records.')
