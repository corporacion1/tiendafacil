"use client";

import { useEffect, useState, useRef, useCallback } from 'react';

interface DeliveryMapPreviewProps {
  destinationLat: number;
  destinationLon: number;
  onClick?: () => void;
  className?: string;
}

const DeliveryMapPreview = ({
  destinationLat,
  destinationLon,
  onClick,
  className = ''
}: DeliveryMapPreviewProps) => {
  const isMountedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [L, setL] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const initMap = useCallback((L: any) => {
    if (!containerRef.current) return;

    const hasDestination = destinationLat && destinationLon;

    if (!hasDestination) return;

    const centerLat = destinationLat;
    const centerLon = destinationLon;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const mapInstance = L.map('delivery-map-preview', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false
    }).setView([centerLat, centerLon], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance);

    const destIcon = L.divIcon({
      html: `<div style="background-color: #22c55e; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      className: 'custom-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    markerRef.current = L.marker([destinationLat, destinationLon], {
      icon: destIcon
    }).addTo(mapInstance);

    mapInstanceRef.current = mapInstance;
  }, [destinationLat, destinationLon]);

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    const loadLeaflet = async () => {
      try {
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const leaflet = await import('leaflet');
        setL(leaflet.default);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!isLoaded || !L) return;

    initMap(L);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded, L, initMap]);

  if (!destinationLat || !destinationLon) {
    return (
      <div 
        className={`bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors ${className}`}
        style={{ height: '150px', minHeight: '150px' }}
        onClick={onClick}
      >
        <div className="text-center text-muted-foreground p-4">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm">Sin ubicación</p>
          <p className="text-xs opacity-75">Click para seleccionar en mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="delivery-map-preview"
      ref={containerRef}
      className={`rounded-lg cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${className}`}
      style={{ height: '150px', minHeight: '150px' }}
      onClick={onClick}
      title="Click para modificar ubicación"
    />
  );
};

export default DeliveryMapPreview;
