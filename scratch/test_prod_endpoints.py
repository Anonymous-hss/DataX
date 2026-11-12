import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base = "https://dataglow.ai/datax-api"

endpoints = [
    ("GET", f"{base}/navigation/summary", None),
    ("GET", f"{base}/workflow/preflight-check?workflow_id=current", None),
    ("GET", f"{base}/workflow/edge-suggestions?from_node=source&to_node=target", None),
    ("GET", f"{base}/quarantine/trace/%23PO-4500743580", None),
    ("POST", f"{base}/workflow/ai-draft", {"prompt": "Ingest SAP BW purchasing orders and validate with AI rules", "workflow_id": "test"}),
    ("POST", f"{base}/rules/impact-preview", {"rule_id": "rule_gl_format", "new_expression": "regex_match(gl_account, '^[0-9]{4}-[0-9]{4}$')", "sample_size": 1420})
]

print("=== Testing Production APIs on https://dataglow.ai/datax-api ===")
for method, url, body in endpoints:
    try:
        req = urllib.request.Request(url, method=method)
        if body:
            req.add_header('Content-Type', 'application/json')
            data = json.dumps(body).encode('utf-8')
        else:
            data = None
        with urllib.request.urlopen(req, data=data, context=ctx, timeout=10) as resp:
            status = resp.status
            content = resp.read().decode('utf-8')
            parsed = json.loads(content)
            print(f"✓ [{status}] {method} {url.split('datax-api')[1]} -> Success ({len(str(parsed))} bytes)")
    except Exception as e:
        print(f"✗ {method} {url.split('datax-api')[1]} -> Error: {e}")
