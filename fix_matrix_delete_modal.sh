#!/bin/bash

# Add state
sed -i -e '/const \[viewMode, setViewMode\] = useState/i\  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);' src/blocos/bloco5_sistema/MatrixView.tsx

# Replace handleBatchDelete
sed -i -e 's/const handleBatchDelete = async () => {/const handleBatchDelete = async () => {\n    if (selectedActivityIds.length === 0) return;\n    setShowBatchDeleteConfirm(true);\n  };\n\n  const confirmBatchDelete = async () => {/g' src/blocos/bloco5_sistema/MatrixView.tsx

# Remove old confirm
sed -i -e '/if (!confirm/d' src/blocos/bloco5_sistema/MatrixView.tsx
sed -i -e '/if (selectedActivityIds.length === 0) return;/d' src/blocos/bloco5_sistema/MatrixView.tsx

