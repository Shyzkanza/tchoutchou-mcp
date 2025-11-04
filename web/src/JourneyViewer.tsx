import React from "react";
import { useToolOutput, useWidgetState } from "./hooks";
import { formatDateTime, formatDuration, formatTime } from "./utils";
import { MapView } from "./MapView";
import type { Journey, Section, WidgetState } from "./types";

export function JourneyViewer() {
  const toolOutputHook = useToolOutput();
  const [widgetState, setWidgetState] = useWidgetState<WidgetState>({ selectedJourneyIndex: 0 });
  const [toolOutput, setToolOutput] = React.useState<any>(toolOutputHook);
  
  // Écouter les changements de window.openai.toolOutput directement
  React.useEffect(() => {
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
    
    checkToolOutput();
    const interval = setInterval(checkToolOutput, 100);
    return () => clearInterval(interval);
  }, []);
  
  // Mettre à jour si toolOutputHook change
  React.useEffect(() => {
    if (toolOutputHook !== toolOutput) {
      setToolOutput(toolOutputHook);
    }
  }, [toolOutputHook]);
  
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

  // Vérifier que window.openai existe
  if (typeof window === "undefined" || !window.openai) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-primary)" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!parsedOutput || !parsedOutput.journeys || parsedOutput.journeys.length === 0) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center", 
        color: "var(--text-primary)",
        fontFamily: "monospace",
        fontSize: "12px"
      }}>
        <p style={{ marginBottom: "20px", fontSize: "16px", fontWeight: "bold" }}>
          Aucun itinéraire disponible
        </p>
        
        <div style={{
          background: "#f3f4f6",
          padding: "20px",
          borderRadius: "8px",
          textAlign: "left",
          maxWidth: "800px",
          margin: "0 auto"
        }}>
          <h3 style={{ marginBottom: "10px" }}>Debug Info:</h3>
          <div style={{ marginBottom: "10px" }}>
            <strong>toolOutput (raw) type:</strong> {typeof toolOutput} {toolOutput === null ? "(null)" : ""} {toolOutput === undefined ? "(undefined)" : ""}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>toolOutput (raw) value:</strong> {toolOutput === null ? "null" : toolOutput === undefined ? "undefined" : typeof toolOutput === 'string' ? `"${toolOutput.substring(0, 100)}..."` : JSON.stringify(toolOutput).substring(0, 200)}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>parsedOutput type:</strong> {typeof parsedOutput} {parsedOutput === null ? "(null)" : ""} {parsedOutput === undefined ? "(undefined)" : ""}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>parsedOutput keys:</strong> {parsedOutput && parsedOutput !== null ? Object.keys(parsedOutput).join(", ") : "null/undefined"}
          </div>
          {parsedOutput && parsedOutput !== null && (
            <>
              <div style={{ marginBottom: "10px" }}>
                <strong>parsedOutput.departures:</strong> {parsedOutput.departures ? `${Array.isArray(parsedOutput.departures) ? parsedOutput.departures.length + " items" : typeof parsedOutput.departures}` : "undefined"}
              </div>
              <div style={{ marginBottom: "10px" }}>
                <strong>parsedOutput.arrivals:</strong> {parsedOutput.arrivals ? `${Array.isArray(parsedOutput.arrivals) ? parsedOutput.arrivals.length + " items" : typeof parsedOutput.arrivals}` : "undefined"}
              </div>
              <div style={{ marginBottom: "10px" }}>
                <strong>parsedOutput.journeys:</strong> {parsedOutput.journeys ? `${Array.isArray(parsedOutput.journeys) ? parsedOutput.journeys.length + " items" : typeof parsedOutput.journeys}` : "undefined"}
              </div>
              <div style={{ marginBottom: "10px", marginTop: "20px" }}>
                <strong>Full parsedOutput:</strong>
                <pre style={{ 
                  background: "#ffffff", 
                  padding: "10px", 
                  borderRadius: "4px", 
                  overflow: "auto",
                  maxHeight: "400px",
                  fontSize: "10px"
                }}>
                  {JSON.stringify(parsedOutput, null, 2)}
                </pre>
              </div>
            </>
          )}
          <div style={{ marginBottom: "10px", marginTop: "20px" }}>
            <strong>window.openai.toolOutput:</strong>
            <pre style={{ 
              background: "#ffffff", 
              padding: "10px", 
              borderRadius: "4px", 
              overflow: "auto",
              maxHeight: "200px",
              fontSize: "10px"
            }}>
              {typeof window !== 'undefined' && window.openai ? JSON.stringify(window.openai.toolOutput, null, 2) : "window.openai not available"}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const journeys = parsedOutput.journeys;
  const selectedIndex = widgetState?.selectedJourneyIndex ?? 0;
  const selectedJourney = journeys[selectedIndex] || journeys[0];

  // Extraire les noms réels depuis les sections
  const getStationName = (journey: Journey, type: 'from' | 'to') => {
    const publicTransportSections = journey.sections.filter(s => s.type === 'public_transport');
    if (publicTransportSections.length === 0) return type === 'from' ? "Origine" : "Destination";
    
    if (type === 'from') {
      const firstSection = publicTransportSections[0];
      return firstSection.from?.stop_area?.name || firstSection.from?.name || "Origine";
    } else {
      const lastSection = publicTransportSections[publicTransportSections.length - 1];
      return lastSection.to?.stop_area?.name || lastSection.to?.name || "Destination";
    }
  };

  const originName = getStationName(selectedJourney, 'from');
  const destinationName = getStationName(selectedJourney, 'to');

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
          🚂 {originName} → {destinationName}
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
      <JourneyDetails journey={selectedJourney} from={originName} to={destinationName} />
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
              
              {journey.co2_emission && journey.co2_emission.value && (
                <div style={{ 
                  backgroundColor: "#ecfdf5",
                  color: "#059669",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>🌱</span>
                  <span>{(journey.co2_emission.value / 1000).toFixed(2)} kg CO₂</span>
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
  const [showStops, setShowStops] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  const getSectionIcon = (type: string, mode?: string) => {
    switch (type) {
      case "public_transport":
        return "🚂";
      case "transfer":
        return "🔄";
      case "waiting":
        return "⏳";
      case "street_network":
      case "crow_fly":
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
      case "crow_fly":
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
    const from = section.from?.stop_point?.name || section.from?.stop_area?.name || section.from?.name || "Départ";
    const to = section.to?.stop_point?.name || section.to?.stop_area?.name || section.to?.name || "Arrivée";
    const lineName = section.display_informations?.name || section.display_informations?.code || "";
    const lineCode = section.display_informations?.code || "";
    const direction = section.display_informations?.direction;
    const lineColor = section.display_informations?.color ? `#${section.display_informations.color}` : "#2563eb";
    const textColor = section.display_informations?.text_color ? `#${section.display_informations.text_color}` : "#ffffff";
    const headsign = section.display_informations?.headsign;

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
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px"
            }}>
              <div style={{ 
                fontWeight: "700", 
                fontSize: "17px",
                color: "var(--text-primary, #1a1a1a)"
              }}>
                {getSectionTitle(section)}
              </div>
              {lineCode && (
                <div style={{ 
                  backgroundColor: lineColor,
                  color: textColor,
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "700",
                  minWidth: "32px",
                  textAlign: "center"
                }}>
                  {lineCode}
                </div>
              )}
              {headsign && (
                <div style={{ 
                  fontSize: "12px", 
                  color: "var(--text-tertiary, #9ca3af)",
                  fontWeight: "600",
                  backgroundColor: "var(--bg-tertiary, #f3f4f6)",
                  padding: "4px 8px",
                  borderRadius: "4px"
                }}>
                  n°{headsign}
                </div>
              )}
            </div>
            {direction && (
              <div style={{ 
                fontSize: "14px", 
                color: "var(--text-secondary, #6b7280)",
                fontWeight: "500"
              }}>
                → {direction}
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
          
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: "8px", 
            marginTop: "8px" 
          }}>
            {section.data_freshness === "realtime" && (
              <div style={{ 
                fontSize: "13px", 
                color: "var(--success-text, #059669)",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "var(--success-bg, #d1fae5)",
                padding: "4px 10px",
                borderRadius: "6px"
              }}>
                ⚡ Temps réel
              </div>
            )}
            
            {section.co2_emission && section.co2_emission.value && (
              <div style={{ 
                fontSize: "13px", 
                color: "#059669",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#ecfdf5",
                padding: "4px 10px",
                borderRadius: "6px"
              }}>
                🌱 {(section.co2_emission.value / 1000).toFixed(2)} kg CO₂
              </div>
            )}
          </div>
          
          {section.stop_date_times && section.stop_date_times.length > 2 && (
            <>
              <button
                onClick={() => setShowStops(!showStops)}
                style={{ 
                  marginTop: "8px", 
                  fontSize: "14px", 
                  color: "var(--accent-primary, #2563eb)",
                  fontWeight: "600",
                  backgroundColor: "var(--accent-bg, #eff6ff)",
                  border: "1px solid var(--accent-primary, #2563eb)",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--accent-primary, #2563eb)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--accent-bg, #eff6ff)";
                  e.currentTarget.style.color = "var(--accent-primary, #2563eb)";
                }}
              >
                <span>{showStops ? "▼" : "►"}</span>
                <span>🛑 {section.stop_date_times.length - 2} arrêt(s) intermédiaire(s)</span>
              </button>
              
              {showStops && (
                <div style={{ 
                  marginTop: "12px",
                  marginLeft: "12px",
                  paddingLeft: "16px",
                  borderLeft: `3px solid ${lineColor}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  {section.stop_date_times.map((stop, idx) => (
                    <div key={idx} style={{ 
                      fontSize: "13px",
                      color: "var(--text-secondary, #6b7280)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0"
                    }}>
                      <span style={{ fontWeight: "500" }}>
                        {idx === 0 ? "🚉" : idx === section.stop_date_times.length - 1 ? "🏁" : "•"} {stop.stop_point?.name || "Arrêt"}
                      </span>
                      <div style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                        {stop.arrival_date_time && (
                          <span style={{ color: "var(--text-tertiary, #9ca3af)" }}>
                            ↓ {formatTime(stop.arrival_date_time)}
                          </span>
                        )}
                        {stop.departure_date_time && (
                          <span style={{ color: lineColor, fontWeight: "600" }}>
                            ↑ {formatTime(stop.departure_date_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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


