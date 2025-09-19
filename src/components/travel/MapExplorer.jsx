// src/components/travel/MapExplorer.jsx
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../TravelResult.css"; // styles shared by result view

export default function MapExplorer({ center = [6.9271, 79.8612], places = [] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // initialize map once
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, { center, zoom: 11, preferCanvas: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }
  }, []); // only once

  useEffect(() => {
    if (!mapRef.current) return;
    if (center && center.length === 2) {
      mapRef.current.setView(center, 12);
    }

    // remove previous places layer if any
    if (mapRef.current._placesLayer) {
      mapRef.current.removeLayer(mapRef.current._placesLayer);
      mapRef.current._placesLayer = null;
    }

    const layer = L.layerGroup();
    places.forEach((p) => {
      // Overpass / Nominatim results: nodes have lat/lon, ways have center
      const lat = p.lat ?? p.center?.lat ?? p.latitude ?? null;
      const lon = p.lon ?? p.center?.lon ?? p.longitude ?? null;
      if (!lat || !lon) return;
      const name = p.tags?.name || p.display_name || p.name || "Place";
      const popup = `<strong>${name}</strong><br/>${p.type || p.tags?.amenity || ""}<br/>
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + "," + lon)}" target="_blank" rel="noreferrer">Open in Google Maps</a>`;
      const marker = L.marker([lat, lon]).bindPopup(popup);
      layer.addLayer(marker);
    });
    layer.addTo(mapRef.current);
    mapRef.current._placesLayer = layer;
  }, [places, center]);

  return <div ref={containerRef} style={{ width: "100%", height: "360px", borderRadius: 10, overflow: "hidden" }} />;
}


