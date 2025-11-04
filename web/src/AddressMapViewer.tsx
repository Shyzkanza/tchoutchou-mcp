import React, { useEffect, useRef } from 'react';
import { useMessageData } from './hooks';

// Leaflet will be loaded from CDN in the HTML
declare const L: any;

interface AddressMapData {
  latitude: number;
  longitude: number;
  label?: string;
  zoom: number;
}

export const AddressMapViewer: React.FC = () => {
  const data = useMessageData<AddressMapData>();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!data || !mapRef.current) return;

    // Initialize map if not already created
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [data.latitude, data.longitude],
        data.zoom
      );

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    } else {
      // Update map view if data changes
      mapInstanceRef.current.setView(
        [data.latitude, data.longitude],
        data.zoom
      );
    }

    // Remove old marker if exists
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    markerRef.current = L.marker([data.latitude, data.longitude]).addTo(
      mapInstanceRef.current
    );

    // Add popup if label provided
    if (data.label) {
      markerRef.current.bindPopup(data.label).openPopup();
    }

    // Cleanup function
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [data]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (!data) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading map data...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '12px',
          zIndex: 1000,
        }}
      >
        📍 {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
        {data.label && (
          <>
            <br />
            <strong>{data.label}</strong>
          </>
        )}
      </div>
    </div>
  );
};
