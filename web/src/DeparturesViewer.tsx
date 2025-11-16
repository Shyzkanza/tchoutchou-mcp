import React, { useState, useEffect, useRef } from "react";
import { useToolOutput } from "./hooks";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Helper functions pour la carte
function getRouteGeoJSON(departure: any) {
  // Essayer route.geojson d'abord, puis line.geojson
  const routeGeoJSON = departure.route?.geojson;
  const lineGeoJSON = departure.route?.line?.geojson;
  
  // GeoJSON peut être MultiLineString avec des coordonnées imbriquées
  const extractCoordinates = (geojson: any): number[][] => {
    if (!geojson || !geojson.coordinates) return [];
    
    if (geojson.type === 'MultiLineString') {
      // MultiLineString: [[[lon, lat], ...], [[lon, lat], ...]]
      const allCoords: number[][] = [];
      geojson.coordinates.forEach((line: number[][]) => {
        if (line && line.length > 0) {
          allCoords.push(...line);
        }
      });
      return allCoords.length > 0 ? allCoords : [];
    } else if (geojson.type === 'LineString') {
      // LineString: [[lon, lat], ...]
      return geojson.coordinates || [];
    }
    
    return [];
  };
  
  const routeCoords = extractCoordinates(routeGeoJSON);
  if (routeCoords.length > 0) {
    return { type: 'LineString', coordinates: routeCoords };
  }
  
  const lineCoords = extractCoordinates(lineGeoJSON);
  if (lineCoords.length > 0) {
    return { type: 'LineString', coordinates: lineCoords };
  }
  
  return null;
}

function getRouteColor(departure: any) {
  return departure.display_informations?.color 
    ? `#${departure.display_informations.color}` 
    : "#2563eb";
}

// Composant interne pour forcer l'initialisation de la carte
function MapContent({ center, zoom, geoJSON, departureCoord, destinationCoord, routeColor, fromName, toName }: any) {
  const map = useMap();
  
  useEffect(() => {
    // Forcer le re-render de la carte quand elle est montée
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        subdomains={['a', 'b', 'c']}
      />
      
      {/* Trajet */}
      {geoJSON?.coordinates && geoJSON.coordinates.length > 0 ? (
        <Polyline 
          positions={geoJSON.coordinates.map((coord: number[]) => 
            [parseFloat(String(coord[1])), parseFloat(String(coord[0]))] as [number, number]
          )} 
          color={routeColor} 
          weight={5}
          opacity={0.8}
        />
      ) : departureCoord && destinationCoord ? (
        <Polyline 
          positions={[
            [parseFloat(departureCoord.lat), parseFloat(departureCoord.lon)],
            [parseFloat(destinationCoord.lat), parseFloat(destinationCoord.lon)]
          ]} 
          color={routeColor} 
          weight={5}
          opacity={0.8}
          dashArray="5, 10"
        />
      ) : null}
      
      {/* Markers */}
      {departureCoord && (
        <Marker position={[parseFloat(departureCoord.lat), parseFloat(departureCoord.lon)]}>
          <Popup><strong>🚉 {fromName}</strong></Popup>
        </Marker>
      )}
      {destinationCoord && (
        <Marker position={[parseFloat(destinationCoord.lat), parseFloat(destinationCoord.lon)]}>
          <Popup><strong>🏁 {toName}</strong></Popup>
        </Marker>
      )}
    </>
  );
}

// Composant pour la modal de carte - Version simplifiée comme JourneyViewer
function MapModal({ departure, stationName, onClose, mapKey }: any) {
  const routeGeoJSON = getRouteGeoJSON(departure);
  const routeColor = getRouteColor(departure);

  const departureCoord = departure.stop_point?.coord;
  const destinationCoord = departure.route?.direction?.stop_area?.coord;

  // Calculer le centre de la carte
  let center: [number, number] = [46.2276, 2.2137]; // France par défaut
  let zoom = 10;

  if (departureCoord) {
    center = [parseFloat(departureCoord.lat), parseFloat(departureCoord.lon)];
    zoom = 12;
  }

  const fromName = stationName;
  const toName = departure.route?.direction?.stop_area?.name || departure.route?.direction?.name || 'Destination';

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "80vh",
          background: "white",
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 1000,
            background: "white",
            border: "2px solid #e0e0e0",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            fontSize: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
        >
          ✕
        </button>

        {typeof window !== 'undefined' && (
          <MapContainer
            key={`map-${mapKey}-${departure.stop_date_time?.departure_date_time || 'default'}`}
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%", minHeight: "400px" }}
          >
            <MapContent
              center={center}
              zoom={zoom}
              geoJSON={routeGeoJSON}
              departureCoord={departureCoord}
              destinationCoord={destinationCoord}
              routeColor={routeColor}
              fromName={fromName}
              toName={toName}
            />
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export function DeparturesViewer() {
  const toolOutputHook = useToolOutput() as any;
  const [toolOutput, setToolOutput] = useState<any>(toolOutputHook);
  const [selectedDeparture, setSelectedDeparture] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);
  const [showStops, setShowStops] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  // Forcer le re-render de la carte quand la modal s'ouvre
  useEffect(() => {
    if (showMap && selectedDeparture) {
      setMapKey(prev => prev + 1);
    }
  }, [showMap, selectedDeparture]);
  
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
    
    checkToolOutput();
    const interval = setInterval(checkToolOutput, 100);
    return () => clearInterval(interval);
  }, []);
  
  // Mettre à jour si toolOutputHook change
  useEffect(() => {
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

  // Helper pour formater les dates (déclaré avant utilisation)
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '-';
    try {
      const year = dateTimeStr.substring(0, 4);
      const month = dateTimeStr.substring(4, 6);
      const day = dateTimeStr.substring(6, 8);
      const hour = dateTimeStr.substring(9, 11);
      const minute = dateTimeStr.substring(11, 13);
      return `${day}/${month} ${hour}:${minute}`;
    } catch {
      return dateTimeStr;
    }
  };

  if (!parsedOutput || !parsedOutput.departures || parsedOutput.departures.length === 0) {
    const stationName = parsedOutput?.stationName || 'cette gare';
    const context = parsedOutput?.context;
    const currentTime = context?.current_datetime 
      ? formatDateTime(context.current_datetime)
      : 'maintenant';
    
    return (
      <div style={{ 
        padding: "40px 20px", 
        textAlign: "center", 
        color: "var(--text-primary)",
        maxWidth: "800px",
        margin: "0 auto"
      }}>
        <div style={{
          fontSize: "64px",
          marginBottom: "20px"
        }}>🚉</div>
        <h2 style={{
          fontSize: "28px",
          fontWeight: "700",
          margin: "0 0 12px 0",
          color: "var(--text-primary)"
        }}>
          Aucun départ prévu
        </h2>
        <p style={{
          fontSize: "18px",
          color: "var(--text-secondary, #6b7280)",
          margin: "0 0 8px 0"
        }}>
          Il n'y a actuellement aucun départ prévu depuis {stationName}.
        </p>
        {context && (
          <p style={{
            fontSize: "14px",
            color: "var(--text-tertiary, #9ca3af)",
            margin: "8px 0 0 0"
          }}>
            Données consultées le {currentTime}
          </p>
        )}
      </div>
    );
  }

  const departures = parsedOutput.departures;
  const stationName = parsedOutput.stationName || 'Gare';
  const currentStationCoord = departures[0]?.stop_point?.coord;

  const formatTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '-';
    try {
      const year = dateTimeStr.substring(0, 4);
      const month = dateTimeStr.substring(4, 6);
      const day = dateTimeStr.substring(6, 8);
      const hour = dateTimeStr.substring(9, 11);
      const minute = dateTimeStr.substring(11, 13);
      
      // Date actuelle
      const now = new Date();
      const departureDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const departureDateOnly = new Date(departureDate.getFullYear(), departureDate.getMonth(), departureDate.getDate());
      
      // Si c'est aujourd'hui, afficher seulement l'heure
      if (departureDateOnly.getTime() === today.getTime()) {
        return <span>{hour}:{minute}</span>;
      }
      
      // Si c'est demain
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (departureDateOnly.getTime() === tomorrow.getTime()) {
        return (
          <>
            <span>{hour}:{minute}</span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary, #6b7280)", fontWeight: "500" }}>Demain</span>
          </>
        );
      }
      
      // Sinon, afficher la date complète
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const dayName = dayNames[departureDate.getDay()];
      return (
        <>
          <span>{hour}:{minute}</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary, #6b7280)", fontWeight: "500" }}>
            {dayName} {day}/{month}
          </span>
        </>
      );
    } catch {
      return dateTimeStr;
    }
  };

  const handleShowMap = (departure: any) => {
    setSelectedDeparture(departure);
    setShowMap(true);
    setShowStops(false);
  };

  const handleShowStops = (departure: any) => {
    setSelectedDeparture(departure);
    setShowStops(true);
    setShowMap(false);
  };

  const getStops = (departure: any) => {
    // Les arrêts intermédiaires nécessitent une requête séparée sur vehicle_journey
    // Pour l'instant, on retourne un tableau vide car ces données ne sont pas dans la réponse departures
    // TODO: Faire une requête séparée sur vehicle_journey si nécessaire
    return [];
  };

  const getMapCenter = () => {
    if (selectedDeparture?.stop_point?.coord) {
      const coord = selectedDeparture.stop_point.coord;
      return [parseFloat(coord.lat), parseFloat(coord.lon)] as [number, number];
    }
    if (currentStationCoord) {
      return [parseFloat(currentStationCoord.lat), parseFloat(currentStationCoord.lon)] as [number, number];
    }
    return [46.2276, 2.2137] as [number, number]; // France par défaut
  };

  return (
    <div style={{
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "var(--bg-primary, #ffffff)",
      color: "var(--text-primary, #1a1a1a)",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "2px solid var(--border-color, #e5e7eb)"
        }}>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "700",
            margin: "0 0 8px 0",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <span>🚂</span>
            <span>Départs</span>
          </h1>
          <p style={{
            fontSize: "18px",
            color: "var(--text-secondary, #6b7280)",
            margin: 0,
            fontWeight: "500"
          }}>
            {stationName}
          </p>
        </div>

        {/* Table */}
        <div style={{
          background: "var(--bg-secondary, #f9fafb)",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border-color, #e5e7eb)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: "16px"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0 10px"
          }}>
            <thead>
              <tr style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                borderRadius: "12px"
              }}>
                <th style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  fontSize: "13px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}>Heure</th>
                <th style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  fontSize: "13px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}>Trajet</th>
                <th style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  fontSize: "13px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}>Train</th>
                <th style={{
                  padding: "16px 20px",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departures.map((departure: any, index: number) => {
                const display = departure.display_informations || {};
                const stopDateTime = departure.stop_date_time || {};
                const isRealtime = stopDateTime.data_freshness === 'realtime';
                const routeGeoJSON = getRouteGeoJSON(departure);
                const hasVehicleJourneyLink = departure.links?.some((link: any) => link.type === 'vehicle_journey');
                const vehicleJourneyId = departure.links?.find((link: any) => link.type === 'vehicle_journey')?.id;
                
                return (
                  <tr
                    key={index}
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                      border: "1px solid #e5e7eb"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.borderColor = "#cbd5e1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <td style={{
                      padding: "18px 20px",
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#1f2937",
                      borderTopLeftRadius: "12px",
                      borderBottomLeftRadius: "12px"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                        {formatTime(stopDateTime.departure_date_time)}
                        {isRealtime && (
                          <span style={{
                            fontSize: "11px",
                            color: "#10b981",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }} title="Temps réel">
                            <span>⚡</span>
                            <span>Temps réel</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{
                      padding: "18px 20px",
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#374151"
                    }}>
                      {(() => {
                        const origin = stationName;
                        const destination = departure.route?.direction?.stop_area?.name || departure.route?.direction?.name || display.direction || 'Destination inconnue';
                        return (
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap"
                            }}>
                              <span style={{ color: "#9ca3af", fontSize: "13px", fontWeight: "500" }}>De</span>
                              <span style={{ fontWeight: "600", color: "#1f2937", fontSize: "15px" }}>{origin}</span>
                            </div>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap"
                            }}>
                              <span style={{ color: "#9ca3af", fontSize: "13px", fontWeight: "500" }}>à</span>
                              <span style={{ fontWeight: "600", color: "#1f2937", fontSize: "15px" }}>{destination}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{
                      padding: "18px 20px",
                      fontSize: "14px",
                      color: "#6b7280"
                    }}>
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px"
                      }}>
                        {display.commercial_mode && (
                          <span style={{ fontWeight: "600", color: "#374151" }}>{display.commercial_mode}</span>
                        )}
                        {display.physical_mode && display.physical_mode !== display.commercial_mode && (
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>{display.physical_mode}</span>
                        )}
                        {display.headsign && (
                          <span style={{ 
                            fontSize: "13px", 
                            fontWeight: "600",
                            color: "#2563eb",
                            marginTop: "2px"
                          }}>
                            Train n°{display.headsign}
                          </span>
                        )}
                        {!display.commercial_mode && !display.physical_mode && !display.headsign && '-'}
                      </div>
                    </td>
                    <td style={{
                      padding: "18px 20px",
                      textAlign: "center",
                      borderTopRightRadius: "12px",
                      borderBottomRightRadius: "12px"
                    }}>
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        alignItems: "center"
                      }}>
                        <button
                          onClick={() => handleShowMap(departure)}
                          style={{
                            padding: "10px 18px",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            width: "100%",
                            justifyContent: "center",
                            boxShadow: "0 2px 4px rgba(102, 126, 234, 0.3)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(102, 126, 234, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(102, 126, 234, 0.3)";
                          }}
                        >
                          🗺️ Carte
                        </button>
                        {hasVehicleJourneyLink && (
                          <button
                            onClick={() => handleShowStops(departure)}
                            style={{
                              padding: "10px 18px",
                              background: "white",
                              color: "#667eea",
                              border: "2px solid #667eea",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              width: "100%",
                              justifyContent: "center"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#667eea";
                              e.currentTarget.style.color = "white";
                              e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.color = "#667eea";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            🚏 Arrêts
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Map Modal */}
        {showMap && selectedDeparture && (
          <MapModal
            departure={selectedDeparture}
            stationName={stationName}
            onClose={() => setShowMap(false)}
            mapKey={mapKey}
          />
        )}

        {/* Stops Modal */}
        {showStops && selectedDeparture && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setShowStops(false)}
          >
            <div style={{
              background: "white",
              borderRadius: "16px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "700"
                  }}>
                    Liste des arrêts
                  </h2>
                  <p style={{
                    margin: "8px 0 0 0",
                    color: "#6b7280",
                    fontSize: "14px"
                  }}>
                    {selectedDeparture.display_informations?.code || selectedDeparture.display_informations?.name} - {selectedDeparture.display_informations?.direction}
                  </p>
                </div>
                <button
                  onClick={() => setShowStops(false)}
                  style={{
                    padding: "8px 16px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}
                >
                  ✕ Fermer
                </button>
              </div>
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px"
              }}>
                {getStops(selectedDeparture).length === 0 ? (
                  <p style={{
                    textAlign: "center",
                    color: "#6b7280",
                    padding: "40px"
                  }}>
                    Les arrêts intermédiaires nécessitent une requête séparée sur le vehicle_journey.<br />
                    Cette fonctionnalité sera disponible prochainement.
                  </p>
                ) : (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}>
                    {getStops(selectedDeparture).map((stop: any, index: number) => {
                      const isCurrentStation = stop.stop_point?.id === selectedDeparture.stop_point?.id;
                      return (
                        <div
                          key={index}
                          style={{
                            padding: "16px",
                            borderRadius: "12px",
                            border: isCurrentStation ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                            background: isCurrentStation ? "#eff6ff" : "white",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div style={{
                            flex: 1
                          }}>
                            <div style={{
                              fontSize: "16px",
                              fontWeight: isCurrentStation ? "700" : "600",
                              color: isCurrentStation ? "#3b82f6" : "var(--text-primary)",
                              marginBottom: "4px"
                            }}>
                              {stop.stop_point?.name || stop.stop_area?.name || 'Arrêt inconnu'}
                              {isCurrentStation && (
                                <span style={{
                                  marginLeft: "8px",
                                  fontSize: "12px",
                                  background: "#3b82f6",
                                  color: "white",
                                  padding: "2px 8px",
                                  borderRadius: "12px"
                                }}>
                                  Vous êtes ici
                                </span>
                              )}
                            </div>
                            <div style={{
                              fontSize: "14px",
                              color: "#6b7280"
                            }}>
                              {stop.arrival_date_time && formatDateTime(stop.arrival_date_time)}
                              {stop.arrival_date_time && stop.departure_date_time && " → "}
                              {stop.departure_date_time && formatDateTime(stop.departure_date_time)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

