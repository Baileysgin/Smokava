'use client';

import { useEffect, useRef } from 'react';
import type { Restaurant } from '@/store/restaurantStore';

// Dynamic import for mapbox-gl to avoid SSR issues
let mapboxgl: any = null;
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl');
  require('mapbox-gl/dist/mapbox-gl.css');
}

interface MapViewProps {
  restaurants: Restaurant[];
}

export default function MapView({ restaurants }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxgl) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
    mapboxgl.accessToken = token;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [51.42, 35.80],
        zoom: 12
      });
    }

    // Add markers for each restaurant
    restaurants.forEach((restaurant) => {
      const [lng, lat] = restaurant.location.coordinates;

      const marker = new mapboxgl.Marker({ color: '#d4af37' })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div style="color: #1a1a1a;"><h3 style="font-weight: bold; margin-bottom: 4px;">${restaurant.nameFa}</h3><p style="font-size: 12px;">${restaurant.addressFa}</p></div>`)
        )
        .addTo(map.current);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [restaurants]);

  return <div ref={mapContainer} className="w-full h-full" style={{ direction: 'ltr' }} />;
}
