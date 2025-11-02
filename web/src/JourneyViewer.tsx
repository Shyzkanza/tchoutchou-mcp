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
      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-primary)" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!toolOutput || !toolOutput.journeys || toolOutput.journeys.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-primary)" }}>
        <p>Aucun itinéraire disponible</p>
      </div>
    );
  }

  const journeys = toolOutput.journeys;
  const selectedIndex = widgetState?.selectedJourneyIndex ?? 0;
  const selectedJourney = journeys[selectedIndex] || journeys[0];

  return (
    <div style={{ 
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "20px",
      maxWidth: "100%",
      background: "var(--bg-primary, #ffffff)",
      color: "var(--text-primary, #1a1a1a)",
      minHeight: "100vh"
    }}>
      {/* En-tête avec origine/destination */}
      {(toolOutput.from || toolOutput.to) && (
        <div style={{ 
          marginBottom: "24px",
          paddingBottom: "20px",
          borderBottom: "2px solid var(--border-color, #e5e7eb)"
        }}>
          <h2 style={{ 
            margin: "0 0 12px 0", 
            fontSize: "28px", 
            fontWeight: "700",
            color: "var(--text-primary, #1a1a1a)",
            letterSpacing: "-0.5px"
          }}>
            🚂 {toolOutput.from || "Origine"} → {toolOutput.to || "Destination"}
          </h2>
          <p style={{ 
            margin: 0, 
            color: "var(--text-secondary, #6b7280)", 
            fontSize: "15px",
            fontWeight: "500"
          }}>
            {journeys.length} itinéraire{journeys.length > 1 ? "s" : ""} trouvé{journeys.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Sélecteur d'itinéraires (onglets) */}
      {journeys.length > 1 && (
        <div style={{ 
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "8px"
        }}>
          {journeys.map((journey, index) => (
            <button
              key={index}
              onClick={() => setWidgetState({ ...widgetState, selectedJourneyIndex: index })}
              style={{
                padding: "14px 20px",
                border: "2px solid",
                borderColor: selectedIndex === index ? "var(--accent-primary, #2563eb)" : "var(--border-color, #e5e7eb)",
                borderRadius: "12px",
                backgroundColor: selectedIndex === index ? "var(--accent-bg, #eff6ff)" : "var(--bg-secondary, #f9fafb)",
                color: selectedIndex === index ? "var(--accent-primary, #2563eb)" : "var(--text-primary, #1a1a1a)",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: selectedIndex === index ? "700" : "500",
                transition: "all 0.2s ease",
                boxShadow: selectedIndex === index ? "0 2px 8px rgba(37, 99, 235, 0.15)" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "6px",
                minWidth: "fit-content"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Option {index + 1}</span>
                <span style={{ 
                  fontSize: "13px", 
                  color: selectedIndex === index ? "var(--accent-primary, #2563eb)" : "var(--text-secondary, #6b7280)",
                  fontWeight: "600"
                }}>
                  {formatDuration(journey.duration)}
                </span>
              </div>
              
              {journey.fare?.total?.value && (
                <span style={{ 
                  fontSize: "14px", 
                  color: "var(--success-text, #059669)",
                  fontWeight: "700",
                  backgroundColor: selectedIndex === index ? "var(--success-bg, #d1fae5)" : "var(--success-bg, #d1fae5)",
                  padding: "4px 10px",
                  borderRadius: "6px"
                }}>
                  💰 {journey.fare.total.value} {journey.fare.total.currency || "€"}
                </span>
              )}
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
  // Générer URL de réservation SNCF
  const getBookingUrl = () => {
    const departureTime = journey.departure_date_time;
    // Format: YYYYMMDDTHHmmss -> YYYY-MM-DD HH:mm
    const formattedDate = `${departureTime.slice(0,4)}-${departureTime.slice(4,6)}-${departureTime.slice(6,8)}`;
    const formattedTime = `${departureTime.slice(9,11)}h${departureTime.slice(11,13)}`;
    
    // URL SNCF Connect
    return `https://www.sncf-connect.com/app/home/search?originId=${from}&destinationId=${to}&outwardDate=${formattedDate}&outwardTime=${formattedTime}`;
  };

  return (
    <div>
      {/* Résumé principal + Carte côte à côte */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "20px", 
        marginBottom: "24px"
      }}>
        {/* Résumé */}
        <div style={{
          background: "linear-gradient(135deg, var(--bg-secondary, #f9fafb) 0%, var(--bg-tertiary, #f3f4f6) 100%)",
          padding: "24px",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid var(--border-color, #e5e7eb)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
        }}>
          <div>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ 
                fontSize: "12px", 
                color: "var(--text-tertiary, #9ca3af)", 
                marginBottom: "6px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Départ
              </div>
              <div style={{ 
                fontSize: "22px", 
                fontWeight: "700",
                color: "var(--text-primary, #1a1a1a)"
              }}>
                {formatDateTime(journey.departure_date_time)}
              </div>
            </div>
            
            <div style={{ 
              fontSize: "28px", 
              color: "var(--accent-primary, #2563eb)", 
              textAlign: "center", 
              margin: "12px 0",
              fontWeight: "300"
            }}>
              ↓
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <div style={{ 
                fontSize: "12px", 
                color: "var(--text-tertiary, #9ca3af)", 
                marginBottom: "6px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Arrivée
              </div>
              <div style={{ 
                fontSize: "22px", 
                fontWeight: "700",
                color: "var(--text-primary, #1a1a1a)"
              }}>
                {formatDateTime(journey.arrival_date_time)}
              </div>
            </div>
          </div>
          
          <div style={{ 
            paddingTop: "20px",
            borderTop: "2px solid var(--border-color, #e5e7eb)"
          }}>
            <div style={{ 
              fontSize: "12px", 
              color: "var(--text-tertiary, #9ca3af)", 
              marginBottom: "6px",
              fontWeight: "600",
              textTransform: "uppercase"
            }}>
              Durée totale
            </div>
            <div style={{ 
              fontSize: "32px", 
              fontWeight: "800", 
              color: "var(--accent-primary, #2563eb)",
              marginBottom: "16px"
            }}>
              {formatDuration(journey.duration)}
            </div>
            
            {/* Info badges */}
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "10px",
              marginTop: "16px"
            }}>
              {journey.nb_transfers > 0 && (
                <div style={{ 
                  backgroundColor: "var(--accent-bg, #eff6ff)",
                  color: "var(--accent-primary, #2563eb)",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>🔄</span>
                  <span>{journey.nb_transfers} {journey.nb_transfers > 1 ? "changements" : "changement"}</span>
                </div>
              )}
              
              {journey.fare?.total?.value && (
                <div style={{ 
                  backgroundColor: "var(--success-bg, #d1fae5)",
                  color: "var(--success-text, #059669)",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "2px solid var(--success-text, #059669)"
                }}>
                  <span>💰</span>
                  <span>{journey.fare.total.value} {journey.fare.total.currency || "€"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carte */}
        <div style={{ minHeight: "250px" }}>
          <MapView journey={journey} from={from} to={to} />
        </div>
      </div>

      {/* Bouton de réservation */}
      <div style={{ marginBottom: "24px" }}>
        <a
          href={getBookingUrl()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: "100%",
            padding: "18px 32px",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "white",
            textDecoration: "none",
            borderRadius: "12px",
            fontSize: "17px",
            fontWeight: "700",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            transition: "all 0.2s ease",
            border: "none",
            cursor: "pointer"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
          }}
        >
          🎫 Réserver ce trajet sur SNCF Connect
        </a>
      </div>

      {/* Sections du trajet */}
      <div>
        <h3 style={{ 
          fontSize: "20px", 
          fontWeight: "700", 
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "2px solid var(--border-color, #e5e7eb)",
          color: "var(--text-primary, #1a1a1a)",
          letterSpacing: "-0.3px"
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
          marginTop: "20px",
          padding: "16px 20px",
          background: "var(--warning-bg, #fef3c7)",
          border: "1px solid var(--warning-border, #fbbf24)",
          borderRadius: "12px",
          fontSize: "15px",
          color: "var(--warning-text, #92400e)",
          fontWeight: "500"
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
        border: "2px solid var(--border-color, #e5e7eb)",
        borderRadius: "12px",
        padding: "20px",
        background: "var(--bg-secondary, #ffffff)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        transition: "all 0.2s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "24px" }}>{getSectionIcon(section.type)}</span>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: "700", 
              fontSize: "17px",
              color: "var(--text-primary, #1a1a1a)",
              marginBottom: "4px"
            }}>
              {getSectionTitle(section)}
            </div>
            {lineName && (
              <div style={{ 
                fontSize: "14px", 
                color: "var(--text-secondary, #6b7280)",
                fontWeight: "500"
              }}>
                {lineName} {direction && `→ ${direction}`}
              </div>
            )}
          </div>
          <div style={{ 
            fontSize: "14px", 
            color: "var(--accent-primary, #2563eb)",
            fontWeight: "700",
            backgroundColor: "var(--accent-bg, #eff6ff)",
            padding: "6px 12px",
            borderRadius: "8px"
          }}>
            {formatDuration(section.duration)}
          </div>
        </div>
        
        <div style={{ 
          paddingLeft: "36px",
          fontSize: "15px",
          color: "var(--text-secondary, #6b7280)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "700", color: "var(--text-primary, #1a1a1a)" }}>De:</span> 
            <span style={{ color: "var(--text-primary, #1a1a1a)" }}>{from}</span>
            {section.departure_date_time && (
              <span style={{ 
                marginLeft: "auto", 
                color: "var(--accent-primary, #2563eb)",
                fontWeight: "600",
                fontSize: "14px"
              }}>
                {formatTime(section.departure_date_time)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "700", color: "var(--text-primary, #1a1a1a)" }}>À:</span> 
            <span style={{ color: "var(--text-primary, #1a1a1a)" }}>{to}</span>
            {section.arrival_date_time && (
              <span style={{ 
                marginLeft: "auto", 
                color: "var(--accent-primary, #2563eb)",
                fontWeight: "600",
                fontSize: "14px"
              }}>
                {formatTime(section.arrival_date_time)}
              </span>
            )}
          </div>
          
          {section.data_freshness === "realtime" && (
            <div style={{ 
              marginTop: "8px", 
              fontSize: "13px", 
              color: "var(--success-text, #059669)",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "var(--success-bg, #d1fae5)",
              padding: "4px 10px",
              borderRadius: "6px",
              width: "fit-content"
            }}>
              ⚡ Temps réel
            </div>
          )}
          
          {section.stop_date_times && section.stop_date_times.length > 2 && (
            <div style={{ 
              marginTop: "4px", 
              fontSize: "13px", 
              color: "var(--text-tertiary, #9ca3af)",
              fontWeight: "500"
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
      border: "1px solid var(--border-light, #f3f4f6)",
      borderRadius: "10px",
      padding: "14px 18px",
      background: "var(--bg-tertiary, #f9fafb)",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
      display: "flex",
      alignItems: "center",
      gap: "12px"
    }}>
      <span style={{ fontSize: "20px" }}>{getSectionIcon(section.type, section.mode)}</span>
      <div style={{ 
        flex: 1, 
        fontSize: "15px", 
        fontWeight: "600",
        color: "var(--text-secondary, #6b7280)"
      }}>
        {getSectionTitle(section)}
      </div>
      <div style={{ 
        fontSize: "13px", 
        color: "var(--text-tertiary, #9ca3af)",
        fontWeight: "500"
      }}>
        {formatDuration(section.duration)}
      </div>
    </div>
  );
}


