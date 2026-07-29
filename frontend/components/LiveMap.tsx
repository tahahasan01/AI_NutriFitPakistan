"use client";

// Interactive Leaflet map that draws a live GPS route, Strava-style.
// Loaded via next/dynamic with { ssr: false } so Leaflet never runs on the server.

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Pt = [number, number];

export default function LiveMap({
  points,
  here = null,
  accent = "#8b93f8",
  follow = true,
  className,
}: {
  points: Pt[];
  here?: Pt | null;
  accent?: string;
  follow?: boolean;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  const headRef = useRef<L.CircleMarker | null>(null);
  const startRef = useRef<L.CircleMarker | null>(null);
  const hereRef = useRef<L.CircleMarker | null>(null);
  const hereRingRef = useRef<L.CircleMarker | null>(null);
  const didFitRef = useRef(false);
  const didCenterHereRef = useRef(false);

  // Create the map once.
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      zoomControl: false,
      attributionControl: true,
      dragging: true,
      scrollWheelZoom: false,
    }).setView([30.3753, 69.3451], 5); // Pakistan default until first fix

    // Dark, low-key basemap (free, no API key) to match the app theme.
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);

    lineRef.current = L.polyline([], {
      color: accent, weight: 5, opacity: 0.95, lineJoin: "round", lineCap: "round",
    }).addTo(map);

    mapRef.current = map;
    // Leaflet needs a size recalc once the container has laid out.
    setTimeout(() => map.invalidateSize(), 60);

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-line react-hooks/exhaustive-deps
  }, []);

  // Keep the polyline stroke colour in sync with the activity kind.
  useEffect(() => {
    lineRef.current?.setStyle({ color: accent });
    headRef.current?.setStyle({ fillColor: accent, color: accent });
  }, [accent]);

  // Show the user's current position (before a route exists) and centre on it once.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Once a route is being recorded, the head marker takes over — drop the "here" dot.
    if (points.length > 0) {
      if (hereRef.current) { map.removeLayer(hereRef.current); hereRef.current = null; }
      if (hereRingRef.current) { map.removeLayer(hereRingRef.current); hereRingRef.current = null; }
      return;
    }
    if (!here) return;
    const ll = L.latLng(here[0], here[1]);
    if (!hereRingRef.current) {
      hereRingRef.current = L.circleMarker(ll, { radius: 14, color: "#38bdf8", weight: 1, opacity: 0.4, fillColor: "#38bdf8", fillOpacity: 0.15 }).addTo(map);
      hereRef.current = L.circleMarker(ll, { radius: 6, color: "#fff", weight: 2, fillColor: "#38bdf8", fillOpacity: 1 }).addTo(map);
    } else {
      hereRingRef.current.setLatLng(ll);
      hereRef.current?.setLatLng(ll);
    }
    // First fix: zoom in. Subsequent fixes: gently follow the moving dot.
    if (!didCenterHereRef.current) {
      map.setView(ll, 16);
      didCenterHereRef.current = true;
    } else if (follow) {
      map.panTo(ll, { animate: true, duration: 0.5 });
    }
  }, [here, points.length, follow]);

  // Push new points to the map.
  useEffect(() => {
    const map = mapRef.current, line = lineRef.current;
    if (!map || !line) return;

    const latlngs = points.map((p) => L.latLng(p[0], p[1]));
    line.setLatLngs(latlngs);

    if (latlngs.length === 0) return;
    const head = latlngs[latlngs.length - 1];

    // start marker
    if (!startRef.current) {
      startRef.current = L.circleMarker(latlngs[0], {
        radius: 6, color: "#fff", weight: 2, fillColor: "#22c55e", fillOpacity: 1,
      }).addTo(map);
    } else {
      startRef.current.setLatLng(latlngs[0]);
    }
    // current-position marker
    if (!headRef.current) {
      headRef.current = L.circleMarker(head, {
        radius: 7, color: accent, weight: 3, fillColor: accent, fillOpacity: 1,
      }).addTo(map);
    } else {
      headRef.current.setLatLng(head);
    }

    if (!didFitRef.current && latlngs.length >= 2) {
      map.fitBounds(line.getBounds(), { padding: [30, 30], maxZoom: 17 });
      didFitRef.current = true;
    } else if (follow) {
      map.panTo(head, { animate: true, duration: 0.5 });
      if (map.getZoom() < 15) map.setZoom(16);
    }
  }, [points, follow, accent]);

  return <div ref={elRef} className={className} style={{ background: "rgb(var(--paper-warm))" }} />;
}
