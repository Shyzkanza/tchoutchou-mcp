import React from "react";
import { useToolOutput, useWidgetState } from "./hooks";
import { formatDateTime, formatDuration, formatTime } from "./utils";
import { MapView } from "./MapView";
import type { Journey, Section, WidgetState } from "./types";

export function JourneyViewer() {
  const toolOutput = useToolOutput();
  const [widgetState, setWidgetState] = useWidgetState<WidgetState>({ selectedJourneyIndex: 0 });

  // Vérifier que window.openai existe
  if (typeof window === "undefined" || !window.openai) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!toolOutput || !toolOutput.journeys || toolOutput.journeys.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Aucun itinéraire disponible</p>
      </div>
    );
  }

  const journeys = toolOutput.journeys;
  const selectedIndex = widgetState?.selectedJourneyIndex ?? 0;
  const selectedJourney = journeys[selectedIndex] || journeys[0];

  return (
    <div style={{ 
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "16px",
      maxWidth: "100%",
      color: "var(--text-color, #333)"
    }}>
      {/* En-tête avec origine/destination */}
      {(toolOutput.from || toolOutput.to) && (
        <div style={{ 
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: "2px solid #e0e0e0"
        }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600" }}>
            🚂 {toolOutput.from || "Origine"} → {toolOutput.to || "Destination"}
          </h2>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            {journeys.length} itinéraire{journeys.length > 1 ? "s" : ""} disponible{journeys.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Sélecteur d'itinéraires (onglets) */}
      {journeys.length > 1 && (
        <div style={{ 
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          overflowX: "auto",
          paddingBottom: "8px"
        }}>
          {journeys.map((journey, index) => (
            <button
              key={index}
              onClick={() => setWidgetState({ ...widgetState, selectedJourneyIndex: index })}
              style={{
                padding: "10px 16px",
                border: selectedIndex === index ? "2px solid #0066cc" : "2px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: selectedIndex === index ? "#f0f7ff" : "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: selectedIndex === index ? "600" : "400",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              Option {index + 1}
              <span style={{ 
                marginLeft: "8px", 
                fontSize: "12px", 
                color: "#666",
                fontWeight: "400"
              }}>
                {formatDuration(journey.duration)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Détails de l'itinéraire sélectionné */}
      <JourneyDetails journey={selectedJourney} from={toolOutput.from} to={toolOutput.to} />
    </div>
  );
}

function JourneyDetails({ journey, from, to }: { journey: Journey; from?: string; to?: string }) {
  return (
    <div>
      {/* Résumé principal + Carte côte à côte */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "20px", 
        marginBottom: "20px",
        '@media (max-width: 768px)': {
          gridTemplateColumns: "1fr"
        }
      }}>
        {/* Résumé */}
        <div style={{
          backgroundColor: "#f8f9fa",
          padding: "16px",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Départ</div>
              <div style={{ fontSize: "18px", fontWeight: "600" }}>
                {formatDateTime(journey.departure_date_time)}
              </div>
            </div>
            
            <div style={{ fontSize: "24px", color: "#999", textAlign: "center", margin: "8px 0" }}>↓</div>
            
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Arrivée</div>
              <div style={{ fontSize: "18px", fontWeight: "600" }}>
                {formatDateTime(journey.arrival_date_time)}
              </div>
            </div>
          </div>
          
          <div style={{ 
            paddingTop: "16px",
            borderTop: "2px solid #ddd"
          }}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Durée totale</div>
            <div style={{ fontSize: "24px", fontWeight: "600", color: "#0066cc" }}>
              {formatDuration(journey.duration)}
            </div>
            
            {journey.nb_transfers > 0 && (
              <div style={{ marginTop: "12px", fontSize: "14px" }}>
                🔄 {journey.nb_transfers} correspondance{journey.nb_transfers > 1 ? "s" : ""}
              </div>
            )}
            
            {journey.fare?.total?.value && (
              <div style={{ marginTop: "8px", fontSize: "14px" }}>
                💰 {journey.fare.total.value} {journey.fare.total.currency || "€"}
              </div>
            )}
          </div>
        </div>

        {/* Carte */}
        <div style={{ minHeight: "250px" }}>
          <MapView journey={journey} from={from} to={to} />
        </div>
      </div>

      {/* Sections du trajet */}
      <div>
        <h3 style={{ 
          fontSize: "16px", 
          fontWeight: "600", 
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e0e0e0"
        }}>
          📍 Détail du trajet
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {journey.sections.map((section, index) => (
            <SectionCard key={index} section={section} index={index} />
          ))}
        </div>
      </div>

      {/* Durées de marche si disponibles */}
      {journey.durations?.walking && journey.durations.walking > 0 && (
        <div style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
          fontSize: "14px"
        }}>
          🚶 Temps de marche total: {formatDuration(journey.durations.walking)}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, index }: { section: Section; index: number }) {
  const getSectionIcon = (type: string, mode?: string) => {
    switch (type) {
      case "public_transport":
        return "🚂";
      case "transfer":
        return "🔄";
      case "waiting":
        return "⏳";
      case "street_network":
        return mode === "walking" ? "🚶" : mode === "bike" ? "🚴" : "🚗";
      default:
        return "📍";
    }
  };

  const getSectionTitle = (section: Section) => {
    switch (section.type) {
      case "public_transport":
        return section.display_informations?.commercial_mode || "Train";
      case "transfer":
        return "Correspondance";
      case "waiting":
        return "Attente";
      case "street_network":
        return section.mode === "walking" 
          ? "Marche à pied" 
          : section.mode === "bike" 
          ? "Vélo" 
          : "Déplacement";
      default:
        return section.type;
    }
  };

  if (section.type === "public_transport") {
    const from = section.from?.name || section.from?.stop_area?.name || "Départ";
    const to = section.to?.name || section.to?.stop_area?.name || "Arrivée";
    const lineName = section.display_informations?.name || section.display_informations?.code || "";
    const direction = section.display_informations?.direction;

    return (
      <div style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "12px",
        backgroundColor: "white"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "20px" }}>{getSectionIcon(section.type)}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", fontSize: "15px" }}>
              {getSectionTitle(section)}
            </div>
            {lineName && (
              <div style={{ fontSize: "13px", color: "#666" }}>
                {lineName} {direction && `→ ${direction}`}
              </div>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#999" }}>
            {formatDuration(section.duration)}
          </div>
        </div>
        
        <div style={{ 
          paddingLeft: "28px",
          fontSize: "14px",
          color: "#555",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <div>
            <span style={{ fontWeight: "600" }}>De:</span> {from}
            {section.departure_date_time && (
              <span style={{ marginLeft: "8px", color: "#666" }}>
                {formatTime(section.departure_date_time)}
              </span>
            )}
          </div>
          <div>
            <span style={{ fontWeight: "600" }}>À:</span> {to}
            {section.arrival_date_time && (
              <span style={{ marginLeft: "8px", color: "#666" }}>
                {formatTime(section.arrival_date_time)}
              </span>
            )}
          </div>
          
          {section.data_freshness === "realtime" && (
            <div style={{ 
              marginTop: "4px", 
              fontSize: "12px", 
              color: "#0066cc",
              fontWeight: "500"
            }}>
              ⚡ Horaires temps réel
            </div>
          )}
          
          {section.stop_date_times && section.stop_date_times.length > 2 && (
            <div style={{ 
              marginTop: "4px", 
              fontSize: "12px", 
              color: "#666"
            }}>
              🛑 {section.stop_date_times.length - 2} arrêt(s) intermédiaire(s)
            </div>
          )}
        </div>
      </div>
    );
  }

  // Autres types de sections (transfer, waiting, street_network)
  return (
    <div style={{
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "10px",
      backgroundColor: "#f8f9fa",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}>
      <span style={{ fontSize: "18px" }}>{getSectionIcon(section.type, section.mode)}</span>
      <div style={{ flex: 1, fontSize: "14px" }}>
        {getSectionTitle(section)}
      </div>
      <div style={{ fontSize: "12px", color: "#666" }}>
        {formatDuration(section.duration)}
      </div>
    </div>
  );
}


