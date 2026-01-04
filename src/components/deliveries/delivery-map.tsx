"use client";

import { useEffect, useState, useRef } from 'react';
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

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
    if (!L || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    
    if (mapInstanceRef.current) {
      return;
    }

    const hasDestination = destinationLat && destinationLon;
    const center: L.LatLngExpression = hasDestination ? [destinationLat, destinationLon] : [departureLat, departureLon];
    const zoom = hasDestination ? 15 : 13;

    const map = L.map(container).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const redIcon = L.divIcon({
      html: '<div style="background:#ef4444;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const greenIcon = L.divIcon({
      html: '<div style="background:#22c55e;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([departureLat, departureLon], { icon: redIcon })
      .addTo(map)
      .bindPopup('<b>📍 Partida</b>')
      .openPopup();

    if (hasDestination) {
      destMarkerRef.current = L.marker([destinationLat, destinationLon], { icon: greenIcon, draggable: true })
        .addTo(map)
        .bindPopup('<b>🎯 Destino</b><br>Arrastra para mover')
        .openPopup();
      setDestinationCoords({ lat: destinationLat, lng: destinationLon });

      destMarkerRef.current.on('dragend', () => {
        if (destMarkerRef.current) {
          const pos = destMarkerRef.current.getLatLng();
          setDestinationCoords({ lat: pos.lat, lng: pos.lng });
        }
      });
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;

      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng([lat, lng]);
      } else {
        destMarkerRef.current = L.marker([lat, lng], { icon: greenIcon, draggable: true })
          .addTo(map)
          .bindPopup('<b>🎯 Destino</b><br>Arrastra para mover')
          .openPopup();
        
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
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L, departureLat, departureLon, destinationLat, destinationLon]);

  const handleSave = () => {
    if (destinationCoords) {
      onSave(destinationCoords.lat, destinationCoords.lng);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p><span style={{color: '#ef4444'}}>●</span> Partida (fija) &nbsp;&nbsp; <span style={{color: '#22c55e'}}>●</span> Destino (clic para seleccionar)</p>
      </div>
      <div ref={mapContainerRef} style={{ height: '400px', width: '100%', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!destinationCoords}>Guardar</Button>
      </div>
    </div>
  );
}
