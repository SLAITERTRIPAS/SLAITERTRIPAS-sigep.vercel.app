import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App, { ErrorBoundary } from "./App.tsx";
import "./index.css";

// Intercetor global para impedir que erros de Assertion interna do Firestore SDK síncronos/assíncronos
// provoquem a paragem da aplicação ou disparem a ErrorBoundary do React
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const msg = event?.message || String(event?.error || "");
    if (
      msg.includes("FIRESTORE") ||
      msg.includes("INTERNAL ASSERTION FAILED") ||
      msg.includes("Unexpected state") ||
      msg.includes("Could not reach Cloud Firestore backend") ||
      msg.includes("Converting circular structure to JSON") ||
      msg.includes("circular structure")
    ) {
      console.warn("🛡️ Intercetado e suprimido erro interno do Firestore/circular:", msg);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg = reason?.message || String(reason || "");
    if (
      msg.includes("FIRESTORE") ||
      msg.includes("INTERNAL ASSERTION FAILED") ||
      msg.includes("Unexpected state") ||
      msg.includes("Could not reach Cloud Firestore backend") ||
      msg.includes("Converting circular structure to JSON") ||
      msg.includes("circular structure")
    ) {
      console.warn("🛡️ Intercetada e suprimida rejeição interna do Firestore/circular:", msg);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

