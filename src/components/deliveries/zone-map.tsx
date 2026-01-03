"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ZoneMapProps {
  currentLat: number;
  currentLon: number;
  onSave: (lat: number, lon: number) => void;
  onCancel: () => void;
}

const ZoneMap = ({
  currentLat,
  currentLon,
  onSave,
  onCancel
}: ZoneMapProps) => {
  const isMountedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<any>(
    (currentLat && currentLon) ? { lat: currentLat, lng: currentLon } : null
  );
  const [L, setL] = useState<any>(null);

  const initMap = (L: any) => {
    // Clean up existing map
    const existingMap = (window as any).zoneMapInstance;
    if (existingMap) {
      existingMap.remove();
      (window as any).zoneMapInstance = null;
    }

    const startLat = currentLat || 10.4806;
    const startLon = currentLon || -66.9036;

    const mapContainer = document.getElementById('zone-map');
    if (!mapContainer) return;

    const mapInstance = L.map('zone-map').setView([startLat, startLon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    const customIcon = L.divIcon({
      html: `<div style="background-color: #3b82f6; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">📍</div>`,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    let marker: any = null;

    if (currentLat && currentLon) {
      marker = L.marker([currentLat, currentLon], {
        icon: customIcon,
        draggable: true
      }).addTo(mapInstance);
      marker.bindPopup('<b>📍 Centro de la Zona</b><br>Arrastra para mover').openPopup();
    }

    mapInstance.on('click', (e: any) => {
      if (!e || !e.latlng) return;

      const { lat, lng } = e.latlng;

      if (marker) {
        marker.setLatLng([lat, lng]);
        try {
          const position = marker.getLatLng();
          if (position) {
            setSelectedCoords({ lat: position.lat, lng: position.lng });
          }
        } catch (err) {
          console.error('Error getting marker position:', err);
        }
      } else {
        const newMarker = L.marker([lat, lng], {
          icon: customIcon,
          draggable: true
        }).addTo(mapInstance);
        newMarker.bindPopup('<b>📍 Centro de la Zona</b><br>Arrastra para mover').openPopup();
        marker = newMarker;
        setSelectedCoords({ lat, lng } as any);
      }
    });

    // Handle dragend event for marker
    const handleDragEnd = (e: any) => {
      if (!e || !e.target) return;
      const m = e.target as L.Marker;
      try {
        const position = m.getLatLng();
        if (position) {
          setSelectedCoords({ lat: position.lat, lng: position.lng } as any);
        }
      } catch (err) {
        console.error('Error getting marker position:', err);
      }
    };

    if (marker) {
      marker.off('dragend');
      marker.on('dragend', handleDragEnd);
    }

    (window as any).zoneMapInstance = mapInstance;
  };

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    const loadZoneLeaflet = async () => {
      try {
        // Load Leaflet CSS from CDN only if not already loaded
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Import Leaflet
        const leaflet = await import('leaflet');
        setL(leaflet.default);

        // Initialize map after short delay
        setTimeout(() => {
          initMap(leaflet.default);
        }, 100);

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    loadZoneLeaflet();
  }, [initMap]);

  useEffect(() => {
    if (!isLoaded || !L) return;

    initMap(L);

    return () => {
      const existingMap = (window as any).zoneMapInstance;
      if (existingMap) {
        existingMap.remove();
        (window as any).zoneMapInstance = null;
      }
    };
  }, [currentLat, currentLon, L, isLoaded, initMap]);

  const handleSave = () => {
    if (selectedCoords) {
      onSave(selectedCoords.lat, selectedCoords.lng);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Haz clic en el mapa para seleccionar el centro de la zona o arrastra el marcador azul.</p>
      </div>
      <div id="zone-map" style={{ height: '400px', width: '100%', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!selectedCoords}>
          Guardar Ubicación del Centro
        </Button>
      </div>
    </div>
  );
};

export default ZoneMap;
