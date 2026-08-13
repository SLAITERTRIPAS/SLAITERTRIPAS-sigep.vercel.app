#!/bin/bash
sed -i -e '/saveUserToCache(finalUser);/c\
        saveUserToCache(finalUser);\
        // Remove notificação de password_reset_requests pendente se existir\
        try {\
          const resetReqQuery = query(collection(db, "password_reset_requests"), where("status", "==", "Pendente"));\
          const reqSnap = await getDocs(resetReqQuery);\
          reqSnap.forEach(async (resetDoc) => {\
            const data = resetDoc.data();\
            if (data.identifier === matchedUser.name || data.identifier === matchedUser.nuit || data.identifier === matchedUser.email || data.identifier === matchedUser.id) {\
              await firestoreService.password_reset_requests.delete(resetDoc.id);\
            }\
          });\
        } catch (err) {\
          console.error("Erro ao limpar reset requests:", err);\
        }' src/blocos/bloco1_apresentacao/LoginScreen.tsx
