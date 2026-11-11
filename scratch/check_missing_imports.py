import re
import os

def check_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find imported names
    imported = set()
    for m in re.finditer(r'import\s+(?:\{([^}]+)\}|([A-Za-z0-9_]+))\s+from', content):
        if m.group(1):
            for name in m.group(1).split(','):
                clean = name.strip().split(' as ')[-1].strip()
                if clean:
                    imported.add(clean)
        if m.group(2):
            imported.add(m.group(2).strip())

    # Find JSX tags
    jsx_tags = set(re.findall(r'<([A-Z][a-zA-Z0-9]+)', content))

    # Known local definitions
    local_defs = set(re.findall(r'(?:function|const|let|var|class)\s+([A-Z][a-zA-Z0-9]+)', content))

    missing = []
    for tag in sorted(jsx_tags):
        if tag not in imported and tag not in local_defs:
            missing.append(tag)

    if missing:
        print(f"File {path} has missing tags: {missing}")
    else:
        print(f"File {path} is ALL CLEAN!")

check_file('H:/AAVIL Inc/DataX/DataX/src/components/common/DataXAppShell.jsx')
check_file('H:/AAVIL Inc/DataX/DataX/src/components/cleanflow/WorkflowCanvasBuilder.jsx')
check_file('H:/AAVIL Inc/DataX/DataX/src/pages/WorkflowCanvasPage.jsx')
check_file('H:/AAVIL Inc/DataX/DataX/src/pages/ThreadsPage.jsx')
check_file('H:/AAVIL Inc/DataX/DataX/src/components/common/OnboardingWizard.jsx')
check_file('H:/AAVIL Inc/DataX/DataX/src/components/workflows/dryrun/DryRunResultsModal.jsx')
check_file('H:/AAVIL Inc/DataX/DataX/src/components/workflows/dryrun/RunningDryRunModal.jsx')
check_file('H:/AAVIL Inc/DataX/DataX/src/components/workflows/WorkflowsEmptyState.jsx')

