import re

with open('src/blocos/bloco5_sistema/PlanoWorkflowView.tsx', 'r') as f:
    content = f.read()

# Pattern to find and remove 'actions={...}' prop from ActivityTableRow
# This is a bit complex because of nested braces, but we can match until the closing brace of the actions block
# Assuming actions blocks look like: actions={ <JSX> } or actions={ condition ? <JSX> : <JSX> }
# We can try to match the prop and its content.

# Since we already removed some, let's look at the remaining ones.
# They look like:
# actions={
#   <div ...>
#     ...
#   </div>
# }
# OR
# actions={
#   !canEdit(activity) ? (
#     ...
#   ) : (
#     ...
#   )
# }

# I'll use a simple approach: find 'actions={' and match balanced braces.
def remove_actions_prop(text):
    start_tag = 'actions={'
    while start_tag in text:
        start_idx = text.find(start_tag)
        # Find the end of the block by counting braces
        brace_count = 0
        end_idx = -1
        for i in range(start_idx + len(start_tag) - 1, len(text)):
            if text[i] == '{':
                brace_count += 1
            elif text[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
        if end_idx != -1:
            # Remove the whole actions={...} block
            text = text[:start_idx] + text[end_idx+1:]
        else:
            # Avoid infinite loop if something goes wrong
            break
    return text

new_content = remove_actions_prop(content)

with open('src/blocos/bloco5_sistema/PlanoWorkflowView.tsx', 'w') as f:
    f.write(new_content)
