import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import area from '@turf/area';
import { polygon } from '@turf/helpers';
import { Activity, Bike, Check, CircleHelp, Compass, Flag, Footprints, LocateFixed, MapPinned, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Timer, Trophy, Zap } from 'lucide-react';

type Point = [number, number];
type Mode = 'Walk' | 'Run' | 'Cycle';
const START: Point = [18.5204, 73.8567];
const CLOSE_METERS = 80;
const rad = (n:number) => n * Math.PI / 180;
function distance(a:Point,b:Point) { const R=6371000, dLat=rad(b[0]-a[0]), dLon=rad(b[1]-a[1]), la1=rad(a[0]), la2=rad(b[0]); const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
function fmtDist(n:number) { return n>=1000 ? `${(n/1000).toFixed(2)} km` : `${Math.round(n)} m`; }
function fmtTime(n:number) { const h=Math.floor(n/3600).toString().padStart(2,'0'), m=Math.floor(n%3600/60).toString().padStart(2,'0'), s=Math.floor(n%60).toString().padStart(2,'0'); return h==='00'?`${m}:${s}`:`${h}:${m}:${s}`; }
function fmtArea(n:number) { return n>=1e6?`${(n/1e6).toFixed(2)} km²`:`${Math.round(n).toLocaleString()} m²`; }
function calcArea(points:Point[]) { const closed=[...points]; if (closed.length<4) return 0; if (distance(closed[0],closed[closed.length-1])>0.5) closed.push(closed[0]); try { return area(polygon([closed.map(([lat,lon])=>[lon,lat])])); } catch { return 0; } }
function Recenter({point,zoom}:{point:Point;zoom:number}) { const map=useMap(); useEffect(()=>{map.flyTo(point,zoom,{duration:.5});},[map,point,zoom]); return null; }
function Stat({icon,label,value,green=false}:{icon:React.ReactNode;label:string;value:string;green?:boolean}) { return <div className={`stat ${green?'green':''}`}><div className="stat-label">{icon}{label}</div><strong>{value}</strong></div>; }

export default function App() {
 const [mode,setMode]=useState<Mode>('Walk'), [status,setStatus]=useState<'idle'|'recording'|'paused'>('idle');
 const [route,setRoute]=useState<Point[]>([]), [territory,setTerritory]=useState<Point[]>([]), [center,setCenter]=useState<Point>(START);
 const [distanceM,setDistanceM]=useState(0), [elapsed,setElapsed]=useState(0), [message,setMessage]=useState('Your next adventure starts here.');
 const [gpsError,setGpsError]=useState(''), [claimedArea,setClaimedArea]=useState(0), [captures,setCaptures]=useState(0), [zoom,setZoom]=useState(15);
 const watch=useRef<number|null>(null), start=useRef<number|null>(null);
 const active=status!=='idle';
 const stopWatch=()=>{ if(watch.current!==null){navigator.geolocation?.clearWatch(watch.current);watch.current=null;} };
 useEffect(()=>{if(status!=='recording')return; const id=window.setInterval(()=>{if(start.current!==null)setElapsed(Math.floor((Date.now()-start.current)/1000));},500);return()=>clearInterval(id);},[status]);
 useEffect(()=>()=>stopWatch(),[]);
 const addPoint=(p:Point)=>setRoute(old=>{if(!old.length){setCenter(p);return[p];}const d=distance(old[old.length-1],p);if(d>150){setGpsError('Ignored a large GPS jump. Keep moving for a cleaner route.');return old;}if(d<2)return old;setDistanceM(v=>v+d);setCenter(p);setGpsError('');return [...old,p];});
 const startActivity=()=>{if(!navigator.geolocation){setGpsError('Geolocation is not available. Use Demo Route instead.');return;}setGpsError('');setMessage('Requesting location permission…');navigator.geolocation.getCurrentPosition(pos=>{const p:Point=[pos.coords.latitude,pos.coords.longitude];setRoute([p]);setTerritory([]);setDistanceM(0);setElapsed(0);setCenter(p);start.current=Date.now();setStatus('recording');setMessage('GPS tracking is live. Move around to record your route.');setZoom(17);watch.current=navigator.geolocation.watchPosition(next=>{if(status!=='paused')addPoint([next.coords.latitude,next.coords.longitude]);},e=>setGpsError(`GPS error: ${e.message}`),{enableHighAccuracy:true,maximumAge:1500,timeout:15000});},e=>{setGpsError(`${e.message}. Allow location access or use Demo Route.`);setMessage('Location access is needed for real GPS tracking.');},{enableHighAccuracy:true,timeout:15000,maximumAge:0});};
 const togglePause=()=>{if(status==='recording'){stopWatch();setStatus('paused');setMessage('Activity paused.');}else if(status==='paused'){setStatus('recording');setMessage('Activity resumed.');watch.current=navigator.geolocation.watchPosition(p=>addPoint([p.coords.latitude,p.coords.longitude]),e=>setGpsError(e.message),{enableHighAccuracy:true,maximumAge:1500,timeout:15000});}};
 const capture=(points:Point[],demo=false)=>{if(points.length<4){setMessage('Not enough route points. Load the demo route or record more points.');return;}const gap=distance(points[0],points[points.length-1]);if(gap>CLOSE_METERS){setMessage(`Loop not closed: start and finish are ${Math.round(gap)} m apart. No territory claimed.`);return;}const a=calcArea(points);if(!Number.isFinite(a)||a<100){setMessage('Loop area is too small or invalid. No territory claimed.');return;}const closed=[...points];if(distance(closed[0],closed[closed.length-1])>.5)closed.push(closed[0]);setTerritory(closed);setClaimedArea(v=>v+a);setCaptures(v=>v+1);setMessage(`${demo?'Demo territory':'Territory'} captured! About ${fmtArea(a)} added to your score.`);};
 const demoPoints=()=>{const [lat,lon]=center;const y=.00058,x=.00078;return [[lat-y,lon-x],[lat-y,lon+x],[lat+y,lon+x],[lat+y,lon-x],[lat-y,lon-x]] as Point[];};
 const loadDemo=()=>{stopWatch();const p=demoPoints();let d=0;for(let i=1;i<p.length;i++)d+=distance(p[i-1],p[i]);setRoute(p);setTerritory([]);setDistanceM(d);setElapsed(222);setStatus('idle');setMessage('Demo route loaded. Claim the territory to test the game loop.');setGpsError('');setZoom(16);};
 const claimDemo=()=>{const p=demoPoints();let d=0;for(let i=1;i<p.length;i++)d+=distance(p[i-1],p[i]);setRoute(p);setDistanceM(d);setElapsed(222);setStatus('idle');capture(p,true);};
 const finish=()=>{stopWatch();setStatus('idle');capture(route);};
 const reset=()=>{stopWatch();setStatus('idle');setRoute([]);setTerritory([]);setDistanceM(0);setElapsed(0);setClaimedArea(0);setCaptures(0);setGpsError('');setMessage('Reset complete. Ready for your next route.');start.current=null;setCenter(START);setZoom(15);};
 const routeLL=useMemo(()=>route.map(([lat,lon])=>[lat,lon] as [number,number]),[route]);
 const territoryLL=useMemo(()=>territory.map(([lat,lon])=>[lat,lon] as [number,number]),[territory]);
 return <div className="shell">
  <aside className="sidebar"><div className="brand"><div className="brand-mark"><Compass size={23}/></div><div><b>TERRITORY<span>RUN</span></b><small>CLAIM YOUR GROUND</small></div></div>
   <div className="profile"><div className="avatar">TR</div><div><b>Trail Rookie</b><small>LEVEL 01 · EXPLORER</small></div><i/></div>
   <div className="section-label">YOUR GAME</div><nav><a className="nav active" href="#map"><MapPinned size={18}/>Territory map <em>LIVE</em></a><a className="nav" href="#activity"><Activity size={18}/>Activity</a><a className="nav" href="#stats"><Trophy size={18}/>My stats</a></nav>
   <div className="quest"><div className="quest-top">WEEKLY QUEST <Zap size={15}/></div><b>Touch grass.</b><p>Record your first route to start claiming territory.</p><div className="progress"><span style={{width:captures?'100%':'8%'}}/></div><small>{captures?'1 / 1 ROUTES · COMPLETE':'0 / 1 ROUTES · START'}</small></div>
   <div className="side-foot"><ShieldCheck size={14}/> Independent prototype · v0.1</div>
  </aside>
  <main className="main"><header className="topbar"><div>GAME WORLD <span>/</span> <b>YOUR TERRITORY</b></div><div className="top-right"><label><i/> PROTOTYPE MODE</label><button title="Help" onClick={()=>setMessage('Tip: load a demo route to test territory capture without GPS movement.')}><CircleHelp size={18}/></button><div className="avatar small">TR</div></div></header>
   <section className="heading"><div><div className="eyebrow"><Sparkles size={14}/> THE OUTDOORS IS YOUR PLAYGROUND</div><h1>Claim your <span>territory.</span></h1><p>Every route is a chance to expand your world. Get out there.</p></div><button className="reset" onClick={reset}><RotateCcw size={15}/> Reset session</button></section>
   <section className="stats" id="stats"><Stat icon={<Footprints size={15}/>} label="DISTANCE" value={fmtDist(distanceM)}/><Stat icon={<Timer size={15}/>} label="DURATION" value={fmtTime(elapsed)}/><Stat icon={<MapPinned size={15}/>} label="TERRITORY CLAIMED" value={fmtArea(claimedArea)} green/><Stat icon={<Flag size={15}/>} label="CAPTURES" value={String(captures).padStart(2,'0')}/></section>
   <section className="game-grid"><div className="map-panel" id="map"><div className="panel-head"><div><b><i className="pulse"/> WORLD MAP</b><small>Explore. Loop. Capture.</small></div><div className="map-online"><i/> MAP ONLINE <button title="Zoom in" onClick={()=>setZoom(z=>Math.min(19,z+1))}><LocateFixed size={16}/></button></div></div>
    <div className="map-wrap"><MapContainer center={center} zoom={zoom} scrollWheelZoom className="map"><Recenter point={center} zoom={zoom}/><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{territoryLL.length>=4&&<Polygon positions={territoryLL} pathOptions={{color:'#6df6c5',weight:2.5,fillColor:'#3ce5ad',fillOpacity:.28}}><Tooltip permanent direction="center">YOUR TERRITORY</Tooltip></Polygon>}{routeLL.length>=2&&<Polyline positions={routeLL} pathOptions={{color:'#a89bff',weight:4,opacity:.95}}/>}<CircleMarker center={center} radius={7} pathOptions={{color:'#fff',weight:3,fillColor:'#8c7cff',fillOpacity:1}}><Tooltip>Current map point</Tooltip></CircleMarker></MapContainer><div className="legend"><span><i className="route-key"/> YOUR ROUTE</span><span><i className="territory-key"/> CLAIMED AREA</span></div><div className="coords"><LocateFixed size={12}/> {center[0].toFixed(4)}°, {center[1].toFixed(4)}°</div></div>
    <div className="map-foot"><span><i/> {territory.length?'Territory secured':'Unclaimed zone'}</span><span>MAP DATA © OPENSTREETMAP</span></div></div>
    <div className="activity-column"><div className="activity-panel" id="activity"><div className="panel-head"><div><b>ACTIVITY TRACKER</b><small>Make every move count.</small></div><span className={`status ${status==='recording'?'recording':''}`}><i/>{status==='recording'?'RECORDING':status==='paused'?'PAUSED':'READY'}</span></div>
     <div className="modes">{(['Walk','Run','Cycle'] as Mode[]).map(m=>{const Icon=m==='Walk'?Footprints:m==='Run'?Activity:Bike;return <button key={m} disabled={active} className={mode===m?'selected':''} onClick={()=>setMode(m)}><Icon size={17}/>{m}</button>;})}</div>
     <div className="readout"><small>SESSION DISTANCE</small><strong>{fmtDist(distanceM)}</strong><span>{route.length} GPS points recorded</span></div>
     <div className="actions">{status==='idle'?<button className="primary" onClick={startActivity}><Play size={16} fill="currentColor"/> Start activity</button>:<button className="primary" onClick={togglePause}>{status==='paused'?<Play size={16} fill="currentColor"/>:<Pause size={16}/>} {status==='paused'?'Resume activity':'Pause activity'}</button>}<button className="finish" disabled={!active} onClick={finish}><Flag size={15}/> Finish & capture</button></div>
     <button className="demo-route" onClick={loadDemo}><Sparkles size={15}/> Load demo route <span>↗</span></button><button className="demo-capture" onClick={claimDemo}><Check size={15}/> Claim demo territory</button>
     <div className={`message ${gpsError?'error':''}`}><i>{gpsError?'!':'i'}</i><span>{gpsError||message}</span></div>
    </div><div className="how"><div><Zap size={18}/></div><section><b>How to capture</b><p>Record a route that loops back to its starting point. Close the loop to claim the area inside.</p></section></div></div>
   </section>
   <section className="bottom"><div className="bottom-card"><div className="bottom-icon purple"><Trophy size={18}/></div><div><small>YOUR RANK</small><b>Rookie Explorer</b><span>Keep moving to level up</span></div><div className="rank"><div><i style={{width:captures?'35%':'6%'}}/></div><small>LEVEL 1</small></div></div><div className="bottom-card"><div className="bottom-icon green"><ShieldCheck size={18}/></div><div><small>GAME STATUS</small><b>{territory.length?'Territory captured':'Ready to explore'}</b><span>{territory.length?'Your first zone is on the map':'Your first capture awaits'}</span></div><Check className="status-check" size={20}/></div></section>
   <footer><span>Territory Run is an independent prototype, not affiliated with INTVL.</span><span>Built for movement <b>♥</b></span></footer>
  </main>
 </div>;
}
