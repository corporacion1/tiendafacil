import { useState, useEffect } from 'react';

export interface GeolocationData {
  latitude: number;
  longitude: number;
}

export interface GeolocationState {
  location: GeolocationData | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = (watch = false) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState({
        location: null,
        error: 'Geolocalización no soportada',
        loading: false,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        error: null,
        loading: false,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Error desconocido';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permiso de geolocalización denegado';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Ubicación no disponible';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado';
          break;
      }
      setState({
        location: null,
        error: errorMessage,
        loading: false,
      });
    };

    const options = {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 0,
    };

    let watchId: number | undefined;
    if (watch) {
      watchId = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        options
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        options
      );
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch]);

  return state;
};
