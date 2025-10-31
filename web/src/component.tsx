import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { JourneyViewer } from "./JourneyViewer";

// Point d'entrée du composant
function App() {
  return (
    <StrictMode>
      <JourneyViewer />
    </StrictMode>
  );
}

// Attendre que le DOM soit prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    mountApp();
  });
} else {
  mountApp();
}

function mountApp() {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
  } else {
    console.error("Root element not found");
  }
}


