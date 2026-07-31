import React, { useEffect, useRef, useState } from 'react';

export default function LiveLocationMap({ hasActiveOrder = false, destinationAddress = "", destinationCoords = null }) {
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const leafletMapRef = useRef(null);

  // Separate refs for Google and Leaflet user markers
  const googleUserMarkerRef = useRef(null);
  const leafletUserMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const initialCenteredRef = useRef(false);

  const [mapType, setMapType] = useState('google');
  const [currentCoords, setCurrentCoords] = useState(null);
  const [mapSearch, setMapSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationNotice, setLocationNotice] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Initialize Map Engine
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const defaultLat = 12.9716;
    const defaultLng = 77.5946;

    if (window.google && window.google.maps && !googleMapRef.current) {
      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: defaultLat, lng: defaultLng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        googleMapRef.current = map;
        setMapType('google');

        // Render destination marker ONLY if active order exists
        if (hasActiveOrder && destinationCoords && destinationAddress) {
          renderGoogleDestMarker(map, destinationCoords.lat, destinationCoords.lng, destinationAddress);
        }
      } catch (err) {
        console.warn('Google Maps fallback to Leaflet:', err);
        initLeaflet(defaultLat, defaultLng);
      }
    } else if (!googleMapRef.current && !leafletMapRef.current) {
      initLeaflet(defaultLat, defaultLng);
    }

    function initLeaflet(lat, lng) {
      if (window.L && !leafletMapRef.current) {
        const L = window.L;
        const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        leafletMapRef.current = map;
        setMapType('leaflet');

        if (hasActiveOrder && destinationCoords && destinationAddress) {
          const destIcon = L.divIcon({
            className: 'custom-dest-pin',
            html: `<div style="background-color: #ef4444; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destIcon })
            .addTo(map)
            .bindPopup(`<b>Destination:</b> ${destinationAddress}`);
        }
      }
    }

    function renderGoogleDestMarker(map, lat, lng, address) {
      destMarkerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `Destination: ${address}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        }
      });
    }

    // Resize listener for map responsiveness
    const handleResize = () => {
      if (googleMapRef.current) window.google.maps.event.trigger(googleMapRef.current, 'resize');
      if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasActiveOrder, destinationAddress, destinationCoords]);

  // Live Geolocation Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionDenied(true);
      setLocationNotice('Geolocation API is not supported by your browser. Use search below to set position manually.');
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      setCurrentCoords({ lat: latitude, lng: longitude });
      setPermissionDenied(false);
      setLocationNotice(null);

      // Auto-center map on first position fix
      if (!initialCenteredRef.current) {
        initialCenteredRef.current = true;
        if (googleMapRef.current) {
          googleMapRef.current.panTo({ lat: latitude, lng: longitude });
          googleMapRef.current.setZoom(14);
        } else if (leafletMapRef.current) {
          leafletMapRef.current.setView([latitude, longitude], 14);
        }
      }

      // Update Google Marker
      if (googleMapRef.current && window.google) {
        const latLng = { lat: latitude, lng: longitude };
        if (!googleUserMarkerRef.current) {
          googleUserMarkerRef.current = new window.google.maps.Marker({
            position: latLng,
            map: googleMapRef.current,
            title: 'Your Live Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#0f9d6e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }
          });
        } else {
          googleUserMarkerRef.current.setPosition(latLng);
        }
      }

      // Update Leaflet Marker
      if (leafletMapRef.current && window.L) {
        const L = window.L;
        if (!leafletUserMarkerRef.current) {
          const userIcon = L.divIcon({
            className: 'custom-user-pin',
            html: `<div style="background-color: #0f9d6e; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(15, 157, 110, 0.8);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          leafletUserMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(leafletMapRef.current)
            .bindPopup('<b>Your Live Location</b>');
        } else {
          leafletUserMarkerRef.current.setLatLng([latitude, longitude]);
        }
      }
    };

    const handleError = (err) => {
      console.warn('Geolocation notice:', err.message);
      if (err.code === 1) { // PERMISSION_DENIED
        setPermissionDenied(true);
        setLocationNotice('Location permission denied by browser. Please enable location permissions in browser settings, or use the search bar below to manually locate your position.');
      } else {
        setLocationNotice(`GPS Signal Note: ${err.message}`);
      }
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 12000
    });

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Functional Address Geocoding Search
  const handleMapSearch = async (e) => {
    e.preventDefault();
    const query = mapSearch.trim();
    if (!query) return;

    setSearching(true);
    setSearchError(null);

    // Google Geocoder
    if (googleMapRef.current && window.google && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query }, (results, status) => {
        setSearching(false);
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          googleMapRef.current.panTo(location);
          googleMapRef.current.setZoom(14);

          // Update/place marker at searched location as manual fallback position
          if (!googleUserMarkerRef.current) {
            googleUserMarkerRef.current = new window.google.maps.Marker({
              position: location,
              map: googleMapRef.current,
              title: results[0].formatted_address,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: '#0f9d6e',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              }
            });
          } else {
            googleUserMarkerRef.current.setPosition(location);
          }

          new window.google.maps.InfoWindow({
            content: `<div style="font-size:12px; font-weight:bold; color:#111827;">📍 ${results[0].formatted_address}</div>`
          }).open(googleMapRef.current, googleUserMarkerRef.current);

        } else {
          setSearchError(`Address search status: ${status}. Please enter a valid city or street name.`);
        }
      });
      return;
    }

    // Leaflet Geocoder Fallback (Nominatim)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const searchLat = parseFloat(data[0].lat);
        const searchLng = parseFloat(data[0].lon);

        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([searchLat, searchLng], 14);
          if (window.L) {
            if (!leafletUserMarkerRef.current) {
              const L = window.L;
              const userIcon = L.divIcon({
                className: 'custom-user-pin',
                html: `<div style="background-color: #0f9d6e; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(15, 157, 110, 0.8);"></div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              });
              leafletUserMarkerRef.current = L.marker([searchLat, searchLng], { icon: userIcon })
                .addTo(leafletMapRef.current)
                .bindPopup(`<b>${data[0].display_name}</b>`);
            } else {
              leafletUserMarkerRef.current.setLatLng([searchLat, searchLng]);
            }
          }
        }
      } else {
        setSearchError(`Location "${query}" not found.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Re-center map to live GPS position
  const handleRecenter = () => {
    if (currentCoords) {
      if (googleMapRef.current) {
        googleMapRef.current.panTo({ lat: currentCoords.lat, lng: currentCoords.lng });
        googleMapRef.current.setZoom(15);
      } else if (leafletMapRef.current) {
        leafletMapRef.current.setView([currentCoords.lat, currentCoords.lng], 15);
      }
    } else {
      alert('Live position not acquired yet. Use search bar to locate manually.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Google Maps Live Tracking & Route
          </h3>
          <p className="text-xs text-gray-500">
            {currentCoords ? `Live GPS: ${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : 'Waiting for GPS position...'}
          </p>
        </div>
        <button
          onClick={handleRecenter}
          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors shrink-0"
        >
          🎯 Re-center My GPS
        </button>
      </div>

      {/* Permission Warning Banner */}
      {locationNotice && (
        <div className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
          permissionDenied ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-amber-50 border border-amber-200 text-amber-800'
        }`}>
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{locationNotice}</span>
        </div>
      )}
      {searchError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-2">
          {searchError}
        </div>
      )}

      {/* Functional Geocoding Search Bar */}
      <form onSubmit={handleMapSearch} className="flex gap-2">
        <input
          type="text"
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          placeholder="Type city or address to search & re-center map (e.g. mangalore)..."
          className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-emerald-600 transition-all"
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
        >
          {searching ? (
            <span>Geocoding...</span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search Map</span>
            </>
          )}
        </button>
      </form>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-56 sm:h-64 md:h-80 lg:h-96 rounded-xl border border-gray-100 z-10 overflow-hidden bg-gray-100"
      ></div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow"></span>
          <span>Delivery Partner Live GPS</span>
        </div>
        {hasActiveOrder && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow"></span>
            <span>Active Customer Destination</span>
          </div>
        )}
      </div>
    </div>
  );
}
