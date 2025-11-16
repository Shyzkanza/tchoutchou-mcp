import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import type { Journey } from "./types";

// Fix pour les icônes Leaflet
import L from "leaflet";

// Configurer les icônes Leaflet via CDN
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapViewProps {
  journey: Journey;
  from?: string;
  to?: string;
}

export function MapView({ journey, from, to }: MapViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extraire les données pour la carte (GeoJSON, couleurs, etc.)
  const getMapData = () => {
    const paths: Array<{
      coordinates: Array<[number, number]>;
      color: string;
      type: string;
      label?: string;
    }> = [];
    const markers: Array<{
      position: [number, number];
      label: string;
      isTransfer?: boolean;
      isBoarding?: boolean;
      isAlighting?: boolean;
    }> = [];

    journey.sections.forEach((section, idx) => {
      // Extraire les coordonnées depuis le GeoJSON
      if (section.geojson?.coordinates && section.geojson.coordinates.length > 0) {
        const coords: Array<[number, number]> = section.geojson.coordinates.map(
          (coord) => [coord[1], coord[0]] // GeoJSON est [lon, lat], Leaflet attend [lat, lon]
        );

        // Déterminer la couleur en fonction du type de section
        let color = "#9ca3af"; // Gris par défaut
        let label = "";

        if (section.type === "public_transport") {
          color = section.display_informations?.color
            ? `#${section.display_informations.color}`
            : "#2563eb";
          label = section.display_informations?.code || section.display_informations?.name || "";
        } else if (section.type === "transfer") {
          color = "#f59e0b"; // Orange pour correspondances
          label = "Correspondance";
        } else if (section.type === "crow_fly") {
          color = "#8b5cf6"; // Violet pour crow_fly (à vol d'oiseau)
          label = section.mode === "walking" ? "Marche (estimée)" : "Trajet direct";
        } else if (section.type === "street_network" || section.type === "walking" || section.mode === "walking") {
          color = "#10b981"; // Vert pour marche sur réseau routier
          label = section.mode === "bike" ? "Vélo" : section.mode === "car" ? "Voiture" : "Marche";
        }

        paths.push({
          coordinates: coords,
          color,
          type: section.type,
          label
        });

        // Ajouter des markers pour les correspondances
        if (section.type === "transfer" && coords.length > 0) {
          markers.push({
            position: coords[0],
            label: "Correspondance",
            isTransfer: true
          });
        }

        // Ajouter des markers pour les arrêts intermédiaires (sections public_transport)
        if (section.type === "public_transport" && section.stop_date_times && section.stop_date_times.length > 2) {
          // Le premier arrêt de la section = montée, le dernier = descente
          const isFirstSection = idx === 0 || journey.sections[idx - 1]?.type !== "public_transport";
          const isLastSection = idx === journey.sections.length - 1 || journey.sections[idx + 1]?.type !== "public_transport";

          // Ne pas afficher le premier et le dernier arrêt (déjà affichés comme départ/arrivée)
          section.stop_date_times?.slice(1, -1).forEach((stop: any, stopIdx: number) => {
            if (stop.stop_point?.coord) {
              const isFirstStop = stopIdx === 0; // Premier arrêt intermédiaire (index 1 dans la liste complète)
              const isLastStop = stopIdx === (section.stop_date_times?.length ?? 0) - 3; // Dernier arrêt intermédiaire

              markers.push({
                position: [parseFloat(stop.stop_point.coord.lat), parseFloat(stop.stop_point.coord.lon)],
                label: stop.stop_point.name || "Arrêt",
                isTransfer: false,
                isBoarding: isFirstStop && isFirstSection,
                isAlighting: isLastStop && isLastSection
              });
            }
          });
        }
      }
    });

    // Calculer les coordonnées de départ et d'arrivée pour les markers principaux
    let startCoord: [number, number] | null = null;
    let endCoord: [number, number] | null = null;

    const firstPublicTransport = journey.sections.find(s => s.type === "public_transport");
    const lastPublicTransport = [...journey.sections].reverse().find(s => s.type === "public_transport");

    if (firstPublicTransport?.from?.stop_point?.coord) {
      const c = firstPublicTransport.from.stop_point.coord;
      startCoord = [parseFloat(c.lat), parseFloat(c.lon)];
    } else if (firstPublicTransport?.from?.stop_area?.coord) {
      const c = firstPublicTransport.from.stop_area.coord;
      startCoord = [parseFloat(c.lat), parseFloat(c.lon)];
    }

    if (lastPublicTransport?.to?.stop_point?.coord) {
      const c = lastPublicTransport.to.stop_point.coord;
      endCoord = [parseFloat(c.lat), parseFloat(c.lon)];
    } else if (lastPublicTransport?.to?.stop_area?.coord) {
      const c = lastPublicTransport.to.stop_area.coord;
      endCoord = [parseFloat(c.lat), parseFloat(c.lon)];
    }

    return { paths, markers, startCoord, endCoord };
  };

  const mapData = getMapData();
  const { paths, markers, startCoord, endCoord } = mapData;

  // Calculer toutes les coordonnées pour centrer la carte
  const allCoords: Array<[number, number]> = [];
  paths.forEach(path => allCoords.push(...path.coordinates));
  if (startCoord) allCoords.push(startCoord);
  if (endCoord) allCoords.push(endCoord);

  const coordinates = allCoords;

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  // Calculer le centre et le zoom adaptatif
  const center: [number, number] = [
    (coordinates[0][0] + coordinates[coordinates.length - 1][0]) / 2,
    (coordinates[0][1] + coordinates[coordinates.length - 1][1]) / 2
  ];

  // Calculer la distance pour ajuster le zoom
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = calculateDistance(
    coordinates[0][0], coordinates[0][1],
    coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]
  );

  // Déterminer le zoom selon la distance
  const getZoomLevel = (dist: number) => {
    if (dist < 50) return 10;
    if (dist < 100) return 9;
    if (dist < 200) return 8;
    if (dist < 400) return 7;
    return 6;
  };

  const zoomLevel = getZoomLevel(distance);

  const MiniMap = () => (
    <div 
      style={{
        height: "100%",
        minHeight: "250px",
        borderRadius: "8px",
        overflow: "hidden",
        cursor: "pointer",
        border: "2px solid #e0e0e0",
        position: "relative"
      }}
      onClick={() => setIsFullscreen(true)}
    >
      <MapContainer
        center={center}
        zoom={zoomLevel}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Tracer les trajets avec GeoJSON */}
        {paths.map((path, idx) => (
          <Polyline
            key={idx}
            positions={path.coordinates}
            color={path.color}
            weight={path.type === "public_transport" ? 5 : path.type === "crow_fly" ? 3 : 4}
            opacity={0.85}
            dashArray={path.type === "crow_fly" ? "8, 8" : path.type === "transfer" ? "5, 5" : undefined}
          />
        ))}
        
        {/* Markers de départ et arrivée */}
        {startCoord && (
          <Marker position={startCoord}>
            <Popup><strong>{from || "Départ"}</strong></Popup>
          </Marker>
        )}
        {endCoord && (
          <Marker position={endCoord}>
            <Popup><strong>{to || "Arrivée"}</strong></Popup>
          </Marker>
        )}
      </MapContainer>
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          right: "8px",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "6px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          pointerEvents: "none"
        }}
      >
        🔍 Cliquez pour agrandir
      </div>
    </div>
  );

  const FullscreenMap = () => (
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
      onClick={() => setIsFullscreen(false)}
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
          onClick={() => setIsFullscreen(false)}
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
        
        {/* Légende */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: 1000,
            background: "white",
            border: "2px solid #e0e0e0",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            maxWidth: "250px"
          }}
        >
          <div style={{ fontWeight: "700", marginBottom: "8px", fontSize: "14px" }}>Légende</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            {paths.some(p => p.type === "public_transport") && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "20px", height: "4px", backgroundColor: "#2563eb" }}></div>
                <span>Transport en commun</span>
              </div>
            )}
            {paths.some(p => p.type === "street_network" || p.type === "walking") && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "20px", height: "3px", backgroundColor: "#10b981" }}></div>
                <span>Marche / Vélo / Voiture</span>
              </div>
            )}
            {paths.some(p => p.type === "crow_fly") && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "20px", height: "3px", borderTop: "3px dashed #8b5cf6" }}></div>
                <span>Trajet estimé (à vol d'oiseau)</span>
              </div>
            )}
            {paths.some(p => p.type === "transfer") && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "20px", height: "3px", borderTop: "3px dashed #f59e0b" }}></div>
                <span>Correspondance</span>
              </div>
            )}
          </div>
        </div>
        
        <MapContainer
          center={center}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Tracer les trajets avec GeoJSON */}
          {paths.map((path, idx) => (
            <Polyline
              key={idx}
              positions={path.coordinates}
              color={path.color}
              weight={path.type === "public_transport" ? 6 : path.type === "crow_fly" ? 4 : 5}
              opacity={0.9}
              dashArray={path.type === "crow_fly" ? "10, 10" : path.type === "transfer" ? "8, 8" : undefined}
            >
              {path.label && (
                <Popup>
                  <strong>{path.label}</strong>
                </Popup>
              )}
            </Polyline>
          ))}
          
          {/* Markers de départ et arrivée */}
          {startCoord && (
            <Marker position={startCoord}>
              <Popup><strong>🚉 {from || "Départ"}</strong></Popup>
            </Marker>
          )}
          {endCoord && (
            <Marker position={endCoord}>
              <Popup><strong>🏁 {to || "Arrivée"}</strong></Popup>
            </Marker>
          )}
          
          {/* Markers pour les correspondances et arrêts */}
          {markers.map((marker, idx) => {
            let icon = "⚬";
            let prefix = "Passage";

            if (marker.isTransfer) {
              icon = "🔄";
              prefix = "Correspondance";
            } else if (marker.isBoarding) {
              icon = "🔼";
              prefix = "Montée";
            } else if (marker.isAlighting) {
              icon = "🔽";
              prefix = "Descente";
            }

            return (
              <Marker key={idx} position={marker.position}>
                <Popup><strong>{icon} {prefix} - {marker.label}</strong></Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );

  return (
    <>
      <MiniMap />
      {isFullscreen && <FullscreenMap />}
    </>
  );
}

