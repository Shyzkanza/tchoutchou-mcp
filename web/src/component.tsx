import React, { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { JourneyViewer } from "./JourneyViewer";
import { AddressMapViewer } from "./AddressMapViewer";
import { DeparturesViewer } from "./DeparturesViewer";
import { ArrivalsViewer } from "./ArrivalsViewer";
import { useToolOutput } from "./hooks";

// Déterminer quel composant afficher basé sur le type de données
function App() {
  const toolOutputHook = useToolOutput() as any;
  const [toolOutput, setToolOutput] = useState<any>(toolOutputHook);
  
  // Écouter les changements de window.openai.toolOutput directement
  useEffect(() => {
    if (typeof window === 'undefined' || !window.openai) return;
    
    const checkToolOutput = () => {
      const currentOutput = window.openai?.toolOutput;
      setToolOutput((prev: any) => {
        if (currentOutput !== prev) {
          return currentOutput;
        }
        return prev;
      });
    };
    
    // Vérifier immédiatement
    checkToolOutput();
    
    // Vérifier périodiquement (pour les cas où les événements ne sont pas émis)
    const interval = setInterval(checkToolOutput, 100);
    
    return () => clearInterval(interval);
  }, []); // Pas de dépendances pour éviter les boucles
  
  // Mettre à jour si toolOutputHook change (via le hook)
  useEffect(() => {
    if (toolOutputHook !== toolOutput) {
      setToolOutput(toolOutputHook);
    }
  }, [toolOutputHook]);
  
  // Debug: logger ce qui est reçu
  if (typeof window !== 'undefined') {
    console.log('App component - toolOutput:', toolOutput);
  }
  
  // Parser toolOutput - gérer le cas où c'est un objet avec une propriété "text"
  let parsedOutput = toolOutput;
  if (toolOutput) {
    // Si toolOutput a une propriété "text" qui contient une chaîne JSON
    if (typeof toolOutput === 'object' && toolOutput.text && typeof toolOutput.text === 'string') {
      try {
        parsedOutput = JSON.parse(toolOutput.text);
      } catch (e) {
        console.error('Failed to parse toolOutput.text:', e);
      }
    } 
    // Si toolOutput est directement une string JSON
    else if (typeof toolOutput === 'string') {
      try {
        parsedOutput = JSON.parse(toolOutput);
      } catch (e) {
        console.error('Failed to parse toolOutput:', e);
      }
    }
  }
  
  // Déterminer automatiquement le composant en fonction des données
  if (parsedOutput) {
    // Vérifier que les tableaux existent ET ont des éléments
    if (parsedOutput.departures && Array.isArray(parsedOutput.departures) && parsedOutput.departures.length > 0) {
      console.log('App: Rendering DeparturesViewer');
      return <DeparturesViewer />;
    }
    if (parsedOutput.arrivals && Array.isArray(parsedOutput.arrivals) && parsedOutput.arrivals.length > 0) {
      console.log('App: Rendering ArrivalsViewer');
      return <ArrivalsViewer />;
    }
    if (parsedOutput.journeys && Array.isArray(parsedOutput.journeys) && parsedOutput.journeys.length > 0) {
      console.log('App: Rendering JourneyViewer');
      return <JourneyViewer />;
    }
    // Pour AddressMapViewer, on utilise toujours le viewType car les données sont différentes
    const viewType = (window as any).__MCP_VIEW_TYPE__;
    if (viewType === 'addressMap') {
      return <AddressMapViewer />;
    }
    
    // Debug: afficher ce qui est disponible mais n'a pas matché
    if (typeof window !== 'undefined') {
      console.log('App: No matching component, parsedOutput keys:', Object.keys(parsedOutput || {}));
    }
  }
  
  // Par défaut, afficher JourneyViewer
  console.log('App: Rendering JourneyViewer (default)');
  return <JourneyViewer />;
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
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } else {
    console.error("Root element not found");
  }
}


