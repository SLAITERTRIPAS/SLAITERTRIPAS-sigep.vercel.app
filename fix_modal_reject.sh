#!/bin/bash
sed -i -e '/await firestoreService.password_reset_requests.update(request.id, {/,/});/c\
      // Remove a notificação permanentemente\
      await firestoreService.password_reset_requests.delete(request.id);' src/blocos/bloco5_sistema/ModalProcessarReset.tsx
