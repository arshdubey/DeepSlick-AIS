'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { FlyToInterpolator } from '@deck.gl/core';
import { GeoJsonLayer, PathLayer, ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE: any = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '&copy; Esri, HERE, Garmin, FAO, NOAA, USGS, EPA'
    },
    esrLabels: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256
    }
  },
  layers: [
    {
      id: 'esri-dark',
      type: 'raster',
      source: 'esri',
      minzoom: 0,
      maxzoom: 16
    },
    {
      id: 'esri-labels',
      type: 'raster',
      source: 'esrLabels',
      minzoom: 0,
      maxzoom: 16
    }
  ]
};

const SHIP_SVG = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path d="M32 8 L52 56 L32 48 L12 56 Z" fill="white"/></svg>`);
const SHIP_URL = `data:image/svg+xml;charset=utf-8,${SHIP_SVG}`;

export default function TacticalMap({ incidentId, timeScrub, forecastScrub, data, showDriftParticles }: { incidentId: string, timeScrub: number, forecastScrub: number, data: any, showDriftParticles?: boolean }) {
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  
  // The map is now fully uncontrolled for maximum scroll-wheel performance.
  // We use initialViewState instead of React state.
  const initialViewState = {
    longitude: incidentId === '994A' ? 72.8777 : 73.7136,
    latitude: incidentId === '994A' ? 19.0760 : 15.3173,
    zoom: 8,
    pitch: 0,
    bearing: 0
  };

  const { precomputedShips, minTime, duration } = useMemo(() => {
    if (!data || !data.ais) return { precomputedShips: [], minTime: 0, duration: 1 };
    
    const times = data.ais.map((d: any) => new Date(d.timestamp).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const duration = maxTime - minTime;
    
    // Pre-sort all pings chronologically
    const sorted = [...data.ais].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Group into ships
    const shipsMap: Record<string, any> = {};
    sorted.forEach((ping: any) => {
      const isCulprit = ping.is_culprit || ping.name === 'M/V OCEAN STAR' || ping.name === 'M/V CORAL';
      if (!shipsMap[ping.mmsi]) {
        shipsMap[ping.mmsi] = {
          mmsi: ping.mmsi,
          name: ping.name,
          is_culprit: isCulprit,
          pings: []
        };
      }
      shipsMap[ping.mmsi].pings.push({ ...ping, time: new Date(ping.timestamp).getTime(), is_culprit: isCulprit });
    });

    return { precomputedShips: Object.values(shipsMap), minTime, duration };
  }, [data?.ais]);

  const { aisPaths, aisLatest, aisFirst } = useMemo(() => {
    if (!precomputedShips || precomputedShips.length === 0) return { aisPaths: [], aisLatest: [], aisFirst: [] };
    
    // timeScrub goes from -36 to 0. minTime is -36h, minTime + duration is NOW (0).
    const fraction = (timeScrub + 36) / 36;
    const cutoffTime = minTime + (duration * fraction);
    
    const paths: any[] = [];
    const latest: any[] = [];
    const first: any[] = [];

    precomputedShips.forEach((ship: any) => {
      const validPings = ship.pings.filter((p: any) => p.time <= cutoffTime);
      if (validPings.length === 0) return;

      paths.push({
        path: validPings.map((p: any) => [p.lon, p.lat]),
        is_culprit: ship.is_culprit,
        mmsi: ship.mmsi,
        name: ship.name,
        type: validPings[0].type
      });

      const latestPing = validPings[validPings.length - 1];
      latest.push({
        ...latestPing,
        mmsi: ship.mmsi,
        name: ship.name
      });
      
      const firstPing = ship.pings[0];
      first.push({
        ...firstPing,
        mmsi: ship.mmsi,
        name: ship.name
      });
    });

    return { aisPaths: paths, aisLatest: latest, aisFirst: first };
  }, [precomputedShips, minTime, duration, timeScrub]);

  const activeHindcastParticles = useMemo(() => {
    if (!showDriftParticles || !data?.hindcast_particles) return [];
    // timeScrub goes from -36 to 0. 0 is NOW (step 0). -36 is -36h (step 72).
    const targetStep = Math.round(Math.abs(timeScrub) * 2);
    return data.hindcast_particles.filter((p: any) => Math.abs(p[2] - targetStep) <= 1);
  }, [data?.hindcast_particles, timeScrub, showDriftParticles]);

  const activeForecastParticles = useMemo(() => {
    if (!showDriftParticles || !data?.forecast_particles) return [];
    // forecastScrub goes from 0 to 36. 0 is NOW (step 0). 36 is +36h (step 72).
    const targetStep = Math.round(forecastScrub * 2);
    return data.forecast_particles.filter((p: any) => Math.abs(p[2] - targetStep) <= 1);
  }, [data?.forecast_particles, forecastScrub, showDriftParticles]);

  const layers = useMemo(() => [
    new GeoJsonLayer({
      id: 'slick-polygon',
      data: data?.slick,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthScale: 20,
      lineWidthMinPixels: 2,
      getFillColor: [160, 160, 180, 100],
      getLineColor: [255, 0, 0, 255],
      getLineWidth: 1
    }),
    new PathLayer({
      id: 'ais-paths',
      data: aisPaths,
      pickable: true,
      widthScale: 20,
      widthMinPixels: 2,
      getPath: (d: any) => d.path,
      getColor: (d: any) => d.is_culprit ? [255, 50, 50, 150] : [50, 255, 50, 100],
      getWidth: 2
    }),
    new ScatterplotLayer({
      id: 'ais-start-position',
      data: aisFirst,
      pickable: true,
      getPosition: (d: any) => [d.lon, d.lat],
      getFillColor: [255, 255, 255, 255],
      getLineColor: (d: any) => d.is_culprit ? [255, 50, 50, 255] : [50, 255, 50, 255],
      getLineWidth: 2,
      stroked: true,
      getRadius: 1000,
      radiusMinPixels: 2,
      radiusMaxPixels: 5
    }),
    new IconLayer({
      id: 'ais-latest-position',
      data: aisLatest,
      pickable: true,
      getPosition: (d: any) => [d.lon, d.lat],
      getIcon: (d: any) => ({
        url: SHIP_URL,
        width: 64,
        height: 64,
        mask: true
      }),
      getColor: (d: any) => d.is_culprit ? [255, 50, 50, 255] : [50, 255, 50, 255],
      getAngle: (d: any) => d.cog || 0,
      getSize: 32,
      sizeUnits: 'pixels',
      sizeScale: 1
    }),
    new ScatterplotLayer({
      id: 'hindcast-particles',
      data: activeHindcastParticles,
      getPosition: (d: any) => [d[0], d[1]], // [lon, lat]
      getFillColor: [0, 200, 255, 200], // Cyan glowing particles
      getRadius: 200,
      radiusMinPixels: 3,
      pickable: false,
    }),
    new ScatterplotLayer({
      id: 'forecast-particles',
      data: activeForecastParticles,
      getPosition: (d: any) => [d[0], d[1]], // [lon, lat]
      getFillColor: [255, 150, 0, 200], // Amber glowing particles
      getRadius: 200,
      radiusMinPixels: 3,
      pickable: false,
    })
  ], [data?.slick, activeHindcastParticles, activeForecastParticles, aisPaths, aisLatest, aisFirst]);

  const memoizedMap = useMemo(() => (
    <Map 
      mapStyle={MAP_STYLE} 
      interactive={false}
      style={{ width: '100%', height: '100%' }}
    />
  ), []);

  return (
    <div className="absolute inset-0 z-0">
      <DeckGL
        initialViewState={initialViewState}
        controller={{ dragPan: true, scrollZoom: true, dragRotate: false, doubleClickZoom: false, inertia: 200 }}
        layers={layers}
        pickingRadius={15}
        onHover={(info) => {
          setHoverInfo((prev: any) => {
            if (!prev?.object && !info.object) return prev;
            if (prev?.object && info.object && prev.object.mmsi === info.object.mmsi && prev.object.properties?.id === info.object.properties?.id) return prev;
            return info;
          });
        }}
      >
        {memoizedMap}
      </DeckGL>

      {/* Custom React Tooltip */}
      {hoverInfo && hoverInfo.object && (
        <div 
          className="absolute z-[9999] pointer-events-none bg-black/90 border border-slate-700 text-white p-3 rounded-lg text-sm shadow-2xl backdrop-blur-md"
          style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
        >
          {hoverInfo.object.mmsi ? (
            <>
              <div className="font-bold text-emerald-400 mb-1 border-b border-emerald-900 pb-1">Vessel: {hoverInfo.object.name}</div>
              <div className="text-slate-300">MMSI: {hoverInfo.object.mmsi}</div>
              <div className="text-slate-300">Type: {hoverInfo.object.type}</div>
              <div className="text-slate-300">Speed: {hoverInfo.object.sog?.toFixed(1)} kts</div>
            </>
          ) : hoverInfo.object.properties?.id ? (
            <>
              <div className="font-bold text-rose-400 mb-1 border-b border-rose-900 pb-1">Incident: {hoverInfo.object.properties.id}</div>
              <div className="text-slate-300">Area: {hoverInfo.object.properties.area_km2} km²</div>
            </>
          ) : null}
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-40 right-6 z-10 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg p-4 pointer-events-auto shadow-2xl">
        <h3 className="text-sm font-bold text-slate-300 tracking-widest uppercase mb-3 border-b border-slate-700 pb-2">Map Legend</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-4 h-4 text-emerald-400 fill-current">
              <path d="M32 8 L52 56 L32 48 L12 56 Z" />
            </svg>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">Current Position & Heading</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white border-[2px] border-emerald-400 rounded-full ml-0.5"></div>
            <span className="text-xs text-slate-400 uppercase tracking-widest">-36h Starting Point</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-[2px] bg-emerald-400/50"></div>
            <span className="text-xs text-slate-400 uppercase tracking-widest">Historical Route</span>
          </div>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-800">
            <div className="w-3 h-3 rounded-full bg-[rgba(0,200,255,0.8)] ml-0.5"></div>
            <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Past Source Tracing</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[rgba(255,150,0,0.8)] ml-0.5"></div>
            <span className="text-xs text-amber-400 uppercase tracking-widest font-bold">Future Drift Prediction</span>
          </div>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-800">
            <div className="w-3 h-3 rounded-sm bg-rose-500/80 border border-rose-500 ml-0.5"></div>
            <span className="text-xs text-rose-400 uppercase tracking-widest font-bold">Primary Suspect</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/80 border border-emerald-500 ml-0.5"></div>
            <span className="text-xs text-emerald-400 uppercase tracking-widest">Cleared Vessel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
