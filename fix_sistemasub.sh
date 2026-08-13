#!/bin/bash
sed -i -e '/setNewPassword("1234"); \/\/ Reset input to default for next time/c\
        setNewPassword("1234"); // Reset input to default for next time\
        // Remove also from password_reset_requests\
        const resetReqQuery = query(collection(db, "password_reset_requests"), where("status", "==", "Pendente"));\
        const reqSnap = await getDocs(resetReqQuery);\
        reqSnap.forEach(async (doc) => {\
          const data = doc.data();\
          if (data.identifier === name || data.identifier === id) {\
            await firestoreService.password_reset_requests.delete(doc.id);\
          }\
        });' src/blocos/bloco5_sistema/SistemaSubViews.tsx
