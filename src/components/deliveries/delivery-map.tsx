"use client";

import { useEffect, useState, useRef, useId } from 'react';
import { Button } from '@/components/ui/button';

interface DeliveryMapProps {
  departureLat: number;
  departureLon: number;
  destinationLat: number;
  destinationLon: number;
  onSave: (lat: number, lon: number) => void;
  onCancel: () => void;
}

export default function DeliveryMap({
  departureLat,
  departureLon,
  destinationLat,
  destinationLon,
  onSave,
  onCancel
}: DeliveryMapProps) {
  const mapId = useId().replace(/:/g, '-');
  const mapContainerId = `delivery-map-${mapId}`;
  const mapInstanceRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [L, setL] = useState<any>(null);
  const initTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (L) return;

      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const leaflet = await import('leaflet');
      setL(leaflet);
    };

    loadLeaflet();
  }, [L]);

  useEffect(() => {
    if (!L || !departureLat || !departureLon) return;

    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initMap = () => {
      const mapContainer = document.getElementById(mapContainerId);
      if (!mapContainer) return;

      const rect = mapContainer.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        initTimeoutRef.current = setTimeout(initMap, 100);
        return;
      }

      mapContainer.style.position = 'relative';
      mapContainer.style.zIndex = '1';

      const hasDestination = destinationLat && destinationLon;
      const center = hasDestination ? [destinationLat, destinationLon] : [departureLat, departureLon];
      const zoom = hasDestination ? 15 : 13;

      const map = L.map(mapContainerId, {
        zoomControl: true,
        attributionControl: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        preferCanvas: true
      }).setView(center, zoom);

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 1,
        zIndex: 1
      }).addTo(map);

      tileLayer.getContainer().style.position = 'absolute';

      const redIcon = L.divIcon({
        html: '<div style="background:#ef4444;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);position:relative;z-index:1000;"></div>',
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      const greenIcon = L.divIcon({
        html: '<div style="background:#22c55e;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);position:relative;z-index:1000;"></div>',
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      const departureMarker = L.marker([departureLat, departureLon], { icon: redIcon })
        .addTo(map)
        .bindPopup('<b>📍 Partida</b>');

      setTimeout(() => {
        departureMarker.openPopup();
      }, 50);

      if (hasDestination) {
        destMarkerRef.current = L.marker([destinationLat, destinationLon], { icon: greenIcon, draggable: true })
          .addTo(map)
          .bindPopup('<b>🎯 Destino</b><br>Arrastra para mover');

        setTimeout(() => {
          destMarkerRef.current.openPopup();
        }, 50);

        setDestinationCoords({ lat: destinationLat, lng: destinationLon });

        destMarkerRef.current.on('dragend', () => {
          if (destMarkerRef.current) {
            const pos = destMarkerRef.current.getLatLng();
            setDestinationCoords({ lat: pos.lat, lng: pos.lng });
          }
        });
      }

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;

        if (destMarkerRef.current) {
          destMarkerRef.current.setLatLng([lat, lng]);
        } else {
          destMarkerRef.current = L.marker([lat, lng], { icon: greenIcon, draggable: true })
            .addTo(map)
            .bindPopup('<b>🎯 Destino</b><br>Arrastra para mover');

          setTimeout(() => {
            destMarkerRef.current.openPopup();
          }, 50);

          destMarkerRef.current.on('dragend', () => {
            if (destMarkerRef.current) {
              const pos = destMarkerRef.current.getLatLng();
              setDestinationCoords({ lat: pos.lat, lng: pos.lng });
            }
          });
        }

        map.setView([lat, lng], 15);
        setDestinationCoords({ lat, lng });
      });

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    };

    initTimeoutRef.current = setTimeout(initMap, 300);

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L, departureLat, departureLon, destinationLat, destinationLon, mapContainerId]);

  const handleSave = () => {
    if (destinationCoords) {
      onSave(destinationCoords.lat, destinationCoords.lng);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-4 flex-1">
      <div className="text-sm text-muted-foreground">
        <p><span style={{color: '#ef4444'}}>●</span> Partida (fija) &nbsp;&nbsp; <span style={{color: '#22c55e'}}>●</span> Destino (clic para seleccionar)</p>
      </div>
      <div
        id={mapContainerId}
        style={{
          height: '400px',
          width: '100%',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          position: 'relative',
          zIndex: 1
        }}
      />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!destinationCoords}>Guardar</Button>
      </div>
    </div>
  );
}
