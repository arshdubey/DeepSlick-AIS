'use client';

import React, { useState, useEffect } from 'react';
import EarthBackground from '@/components/EarthBackground';
import TacticalMap from '@/components/TacticalMap';
import { 
  Activity, 
  AlertTriangle, 
  Crosshair, 
  Map, 
  Navigation, 
  Radio, 
  Satellite, 
  ShieldAlert, 
  Ship,
  Wind,
  Loader2
} from 'lucide-react';

export default function MissionControl() {
  const [viewMode, setViewMode] = useState<'global' | 'tactical'>('global');
  const [activeIncident, setActiveIncident] = useState<'994A' | '993B'>('994A');
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [timeScrub, setTimeScrub] = useState(0);
  const [forecastScrub, setForecastScrub] = useState(0);
  const [showReport, setShowReport] = useState(false);
  
  // API State
  const [incidentsMeta, setIncidentsMeta] = useState<any[]>([]);
  const [tacticalData, setTacticalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showProbabilityCone, setShowProbabilityCone] = useState(true);

  // Fetch Dashboard Metadata
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/incidents')
      .then(res => res.json())
      .then(data => setIncidentsMeta(data.incidents))
      .catch(err => {
        console.error("Failed to fetch incidents:", err);
        setApiError("Backend connection failed.");
      });
  }, []);

  // Fetch heavy slick/AIS data when activeIncident changes
  useEffect(() => {
    setIsLoading(true);
    setApiError(null);
    fetch(`http://localhost:8000/api/v1/incidents/${activeIncident}`)
      .then(res => {
        if (!res.ok) throw new Error("API responded with an error");
        return res.json();
      })
      .then(data => {
        setTacticalData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch tactical data:", err);
        setApiError(err.message || "Failed to fetch data.");
        setIsLoading(false);
      });
  }, [activeIncident]);

  const getReportContent = () => {
    if (activeIncident === '994A') {
      return `# FORENSIC ATTRIBUTION REPORT
Incident: SLICK-994A
Date of Detection: 2026-09-14
Location: 19.0760 N, 72.8777 E
Area: 4.2 km²

## MetOcean Hindcast Data
- Wind Vector: 14.2 knots ↗
- Sea Current: 0.8 m/s ↘

## Primary Suspect
- Vessel Name: M/V OCEAN STAR
- IMO Number: 9123456
- Match Confidence: 94%
- Justification: Spatio-temporal trajectory intersection within 5km of hindcast particle envelope. Transponder gap detected during intersection window.

## Conclusion
High probability of deliberate discharge. Recommend immediate interdiction and port state control inspection.`;
    } else {
      return `# FORENSIC ATTRIBUTION REPORT
Incident: SLICK-993B
Date of Detection: 2026-09-14
Location: 15.3173 N, 73.7136 E
Area: 1.8 km²

## MetOcean Hindcast Data
- Wind Vector: 8.5 knots ↗
- Sea Current: 1.2 m/s →

## Primary Suspect
- Vessel Name: M/V CORAL
- IMO Number: 222222222
- Match Confidence: 87%
- Justification: Vessel track intersects origin of slick footprint during the estimated discharge window. 

## Conclusion
Moderate probability of deliberate discharge. Recommend further satellite SAR surveillance of vessel route.`;
    }
  };

  const downloadReport = () => {
    const blob = new Blob([getReportContent()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Report_${activeIncident}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden text-slate-50 font-mono">
      {/* Background Engine Toggle (Kept mounted for performance) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${viewMode === 'global' ? 'opacity-100 z-0' : 'opacity-0 -z-20 pointer-events-none'}`}>
        <EarthBackground isActive={viewMode === 'global'} />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-500 ${viewMode === 'tactical' ? 'opacity-100 z-0' : 'opacity-0 -z-20 pointer-events-none'}`}>
        {apiError ? (
          <div className="flex items-center justify-center w-full h-full bg-slate-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 bg-red-900/20 p-8 rounded-lg border border-red-500/30">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
              <p className="text-red-400 font-bold tracking-widest uppercase text-center">CONNECTION FAILURE</p>
              <p className="text-red-300 text-sm">{apiError}</p>
            </div>
          </div>
        ) : isLoading || !tacticalData ? (
          <div className="flex items-center justify-center w-full h-full bg-slate-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              <p className="text-cyan-400 tracking-widest uppercase animate-pulse">DOWNLOADING SATELLITE TELEMETRY...</p>
            </div>
          </div>
        ) : (
          <TacticalMap key={activeIncident} incidentId={activeIncident} timeScrub={timeScrub} forecastScrub={forecastScrub} data={tacticalData} showDriftParticles={showProbabilityCone} />
        )}
      </div>

      {/* Global UI Overlay Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Top Header */}
        <header className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg backdrop-blur-md">
              <Satellite className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                DEEPSLICK-AIS
              </h1>
              <p className="text-sm text-cyan-400/70 tracking-widest uppercase">
                Orbital Surveillance & Attribution Engine
              </p>
            </div>
            
            {/* Explicit Back to Home Button when in Tactical Map */}
            {viewMode === 'tactical' && (
              <button 
                onClick={() => setViewMode('global')}
                className="ml-6 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 rounded-md text-sm font-bold text-slate-200 uppercase tracking-widest transition-colors flex items-center gap-2 pointer-events-auto shadow-2xl backdrop-blur-md"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <div className="glass-panel flex items-center gap-3">
              <Radio className="w-5 h-5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-sm text-slate-400 uppercase tracking-wider">System Status</span>
                <span className="text-base text-emerald-400 font-bold">ONLINE & SECURE</span>
              </div>
            </div>
            <div className="glass-panel flex items-center gap-3">
              <Activity className="w-5 h-5 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-sm text-slate-400 uppercase tracking-wider">Active Scans</span>
                <span className="text-base text-cyan-400 font-bold">14 ORBITAL PASSES</span>
              </div>
            </div>
          </div>
        </header>

        {/* Middle Section (HUD Panels) - Only show on Global Dashboard */}
        {viewMode === 'global' && (
          <div className="flex justify-between items-stretch flex-1 my-6 pointer-events-none">
            
            {/* Left Panel: Incidents */}
            <div className="w-80 flex flex-col gap-4 pointer-events-auto">
              <div className="glass-panel h-full flex flex-col bg-black/60 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4 border-b border-cyan-500/20 pb-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <h2 className="text-base font-bold text-rose-500 tracking-widest uppercase">Detected Anomalies</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {/* Incident Card 1 */}
                  <div 
                    className={`group border rounded p-3 transition-all cursor-pointer ${activeIncident === '994A' ? 'bg-rose-500/20 border-rose-400 ring-1 ring-rose-400' : 'bg-rose-500/5 border-rose-500/30 hover:bg-rose-500/10'}`}
                    onClick={() => setActiveIncident('994A')}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold ${activeIncident === '994A' ? 'text-rose-300' : 'text-rose-400'}`}>SLICK-994A</span>
                      <span className="text-sm text-rose-400/70">2 MINS AGO</span>
                    </div>
                    <div className="text-sm text-slate-300 space-y-1 mb-2">
                      <p>Lat: 19.0760° N, Lon: 72.8777° E</p>
                      <p>Area: 4.2 km² (High Confidence)</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-sm text-cyan-400">
                        <Crosshair className="w-3 h-3" />
                        <span>Auto-Tracking</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveIncident('994A'); setViewMode('tactical'); }}
                        className={`px-2 py-1 bg-rose-500/30 hover:bg-rose-500/50 rounded text-sm font-bold text-rose-200 uppercase transition-all duration-300 ${activeIncident === '994A' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        View Map ↗
                      </button>
                    </div>
                  </div>

                  {/* Incident Card 2 */}
                  <div 
                    className={`group border rounded p-3 transition-all cursor-pointer ${activeIncident === '993B' ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400' : 'bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10'}`}
                    onClick={() => {
                      if (activeIncident !== '993B') {
                        setActiveIncident('993B');
                        setSystemMessage("Establishing connection to cold storage archive... Requesting SAR tiles and AIS logs for SLICK-993B.");
                        setTimeout(() => setSystemMessage(null), 5000);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold ${activeIncident === '993B' ? 'text-amber-300' : 'text-amber-400'}`}>SLICK-993B</span>
                      <span className="text-sm text-amber-400/70">4 HRS AGO</span>
                    </div>
                    <div className="text-sm text-slate-300 space-y-1 mb-2">
                      <p>Lat: 15.3173° N, Lon: 73.7136° E</p>
                      <p>Area: 1.8 km² (Medium Confidence)</p>
                    </div>
                    <div className="flex items-center justify-end mt-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveIncident('993B'); setViewMode('tactical'); }}
                        className={`px-2 py-1 bg-amber-500/30 hover:bg-amber-500/50 rounded text-sm font-bold text-amber-200 uppercase transition-all duration-300 ${activeIncident === '993B' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        View Map ↗
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: AIS & MetOcean */}
            <div className="w-80 flex flex-col gap-4 pointer-events-auto">
              {/* MetOcean Telemetry */}
              <div className="glass-panel bg-black/60 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3 border-b border-cyan-500/20 pb-2">
                  <Wind className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-cyan-400 tracking-widest uppercase">MetOcean Data</h2>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-black/40 p-2 rounded border border-cyan-500/10">
                    <p className="text-slate-400 text-sm">WIND VECTOR</p>
                    <p className="text-cyan-400 font-mono">{activeIncident === '994A' ? '14.2 knots ↗' : '8.5 knots ↗'}</p>
                  </div>
                  <div className="bg-black/40 p-2 rounded border border-cyan-500/10">
                    <p className="text-slate-400 text-sm">SEA CURRENT</p>
                    <p className="text-cyan-400 font-mono">{activeIncident === '994A' ? '0.8 m/s ↘' : '1.2 m/s →'}</p>
                  </div>
                </div>
              </div>

              {/* AIS Correlator */}
              <div className="glass-panel flex-1 flex flex-col bg-black/60 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3 border-b border-cyan-500/20 pb-2">
                  <Ship className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-emerald-400 tracking-widest uppercase">AIS Attribution</h2>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-sm text-slate-400 mb-2">TARGET SLICK-{activeIncident} PROBABLE SUSPECTS:</div>
                  <div className="flex items-center justify-between p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
                    <div>
                      <p className="text-sm font-bold text-emerald-400">{activeIncident === '994A' ? 'M/V OCEAN STAR' : 'M/V CORAL'}</p>
                      <p className="text-sm text-slate-400">IMO: {activeIncident === '994A' ? '9123456' : '222222222'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-emerald-400">{activeIncident === '994A' ? '94% Match' : '87% Match'}</p>
                      <p className="text-xs text-emerald-400/70">Trajectory Intersect</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReport(true)}
                  className="mt-4 w-full py-2 bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 rounded text-sm text-emerald-400 uppercase tracking-widest transition-colors font-bold pointer-events-auto"
                >
                  Generate Forensic Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Toast Notification */}
        {systemMessage && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
            <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] rounded px-6 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
              <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-sm text-amber-400 font-mono tracking-widest uppercase">
                {systemMessage}
              </span>
            </div>
          </div>
        )}

        {/* Forensic Report Modal */}
        {showReport && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-emerald-500/50 rounded-lg shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
                <h2 className="text-xl font-bold text-emerald-400 tracking-widest uppercase">Forensic Report Preview</h2>
                <button 
                  onClick={() => setShowReport(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto mb-6 p-4 bg-black/40 rounded border border-slate-800">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                  {getReportContent()}
                </pre>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowReport(false)}
                  className="px-4 py-2 border border-slate-600 rounded text-sm text-slate-300 hover:bg-slate-800 transition-colors uppercase tracking-widest font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={downloadReport}
                  className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 rounded text-sm text-emerald-400 uppercase tracking-widest transition-colors font-bold flex items-center gap-2"
                >
                  Save to Device
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tactical Controls - Middle Left */}
        {viewMode === 'tactical' && (
          <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 pointer-events-auto flex flex-col gap-4 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-5 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.15)] w-72">
            <h3 className="text-xs font-bold text-cyan-400 tracking-widest uppercase mb-1 border-b border-cyan-900 pb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Analysis Engines
            </h3>
            
            <div className="flex flex-col gap-5 mt-2">
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-slate-300 uppercase tracking-widest">SAR Segment</span>
                <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded text-xs text-emerald-400 font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  ONLINE
                </div>
              </div>
              
              <button 
                onClick={() => setShowProbabilityCone(!showProbabilityCone)}
                className={`relative overflow-hidden w-full px-5 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                  showProbabilityCone 
                    ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {showProbabilityCone && (
                  <div className="absolute inset-0 bg-cyan-400/10 animate-pulse"></div>
                )}
                <Crosshair className={`w-4 h-4 ${showProbabilityCone ? 'text-cyan-400' : 'text-slate-500'}`} />
                DRIFT ENGINE: {showProbabilityCone ? 'ACTIVE' : 'IDLE'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Footer / Timeline */}
        <footer className="glass-panel pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setViewMode('global')}
              className={`flex items-center gap-2 transition-colors ${viewMode === 'global' ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-400'}`}
            >
              <Map className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest font-bold">Global View</span>
            </button>
            <div className="h-4 w-[1px] bg-cyan-500/30"></div>
            <button 
              onClick={() => setViewMode('tactical')}
              className={`flex items-center gap-2 transition-colors ${viewMode === 'tactical' ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-400'}`}
            >
              <Navigation className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest font-bold">Tactical Layer (Deck.gl)</span>
            </button>
          </div>
          
          {viewMode === 'tactical' && (
            <div className="flex-1 max-w-xl mx-8 flex flex-col gap-3">
              {/* Hindcast Slider */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 uppercase tracking-widest w-28 text-right">Source Trace</span>
                <span className="text-xs text-slate-400 uppercase tracking-widest whitespace-nowrap">-36h</span>
                <input 
                  type="range" 
                  min="-36" 
                  max="0" 
                  step="1"
                  value={timeScrub}
                  onChange={(e) => setTimeScrub(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer" 
                />
                <span className="text-xs text-slate-400 uppercase tracking-widest whitespace-nowrap">NOW</span>
                <span className="text-xs text-cyan-400 uppercase tracking-widest whitespace-nowrap font-bold min-w-[40px]">
                  {timeScrub}h
                </span>
              </div>
              {/* Forecast Slider */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 uppercase tracking-widest w-28 text-right">Drift Forecast</span>
                <span className="text-xs text-slate-400 uppercase tracking-widest whitespace-nowrap">NOW</span>
                <input 
                  type="range" 
                  min="0" 
                  max="36" 
                  step="1"
                  value={forecastScrub}
                  onChange={(e) => setForecastScrub(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer" 
                />
                <span className="text-xs text-slate-400 uppercase tracking-widest whitespace-nowrap">+36h</span>
                <span className="text-xs text-amber-500 uppercase tracking-widest whitespace-nowrap font-bold min-w-[40px]">
                  +{forecastScrub}h
                </span>
              </div>
            </div>
          )}
          
        </footer>
      </div>
    </main>
  );
}
