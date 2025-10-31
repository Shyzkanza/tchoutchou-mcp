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

  // Extraire les coordonnées de départ et d'arrivée
  const getCoordinates = () => {
    const coords: Array<[number, number]> = [];
    
    journey.sections.forEach((section) => {
      if (section.type === "public_transport" && section.from?.stop_point) {
        const fromCoord = section.from.stop_point.coord;
        if (fromCoord) {
          coords.push([parseFloat(fromCoord.lat), parseFloat(fromCoord.lon)]);
        }
      }
      
      if (section.type === "public_transport" && section.to?.stop_point) {
        const toCoord = section.to.stop_point.coord;
        if (toCoord) {
          coords.push([parseFloat(toCoord.lat), parseFloat(toCoord.lon)]);
        }
      }
    });

    return coords.length >= 2 ? coords : null;
  };

  const coordinates = getCoordinates();

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
        <Polyline positions={coordinates} color="#0066cc" weight={3} />
        <Marker position={coordinates[0]}>
          <Popup>{from || "Départ"}</Popup>
        </Marker>
        <Marker position={coordinates[coordinates.length - 1]}>
          <Popup>{to || "Arrivée"}</Popup>
        </Marker>
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
        <MapContainer
          center={center}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={coordinates} color="#0066cc" weight={4} />
          <Marker position={coordinates[0]}>
            <Popup>
              <strong>{from || "Départ"}</strong>
            </Popup>
          </Marker>
          <Marker position={coordinates[coordinates.length - 1]}>
            <Popup>
              <strong>{to || "Arrivée"}</strong>
            </Popup>
          </Marker>
          {/* Markers intermédiaires */}
          {coordinates.slice(1, -1).map((coord, idx) => (
            <Marker key={idx} position={coord}>
              <Popup>Étape {idx + 1}</Popup>
            </Marker>
          ))}
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

