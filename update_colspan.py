import re

with open('src/blocos/bloco5_sistema/PlanoWorkflowView.tsx', 'r') as f:
    content = f.read()

# Replace colSpan={32}, colSpan={37}, colSpan={40}, colSpan={45} with colSpan={18}
# to match the new header structure
new_content = re.sub(r'colSpan=\{[0-9]+\}', 'colSpan={18}', content)

with open('src/blocos/bloco5_sistema/PlanoWorkflowView.tsx', 'w') as f:
    f.write(new_content)
