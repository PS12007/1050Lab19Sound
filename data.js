/* ============================================================
   EcoEcho — data.js
   State, 2-device setup, Hz integration, CSV parsing, export
   TODO: Replace data-fetching functions with real API / BT calls
   ============================================================ */

const AppState = {
  selectedNodeId: 'N001',
  currentPage: 'overview',
  theme: 'dark',
  settings: {
    sampleRate: '44.1 kHz', bitDepth: '24-bit', channel: 'Mono',
    gain: 0, lowCut: 80, highCut: 20000, syncInterval: '30 min',
    gpsFromMeta: true, btAutoReconnect: true,
    warnDb: 70, critDb: 85, spikeDetection: true, notifSound: false,
    campusName: 'EcoEcho Research',
    mapLat: 43.0096, mapLng: -81.2737,
    retention: '30 days', scheduleMode: 'quickstart',
    activePreset: 'fullday', customBlocks: []
  },
  bluetooth: { connected: false, deviceName: null, signalStrength: 0, lastSync: null },
  recentExports: [],
  // Uploaded CSV data for Device 1
  csvRows: []   // { ts: Date, db: number, hz: number }
};

// ── 2 Devices only ───────────────────────────────────────────
const NODES = [
  {
    id: 'N001', name: 'Device 1',
    location: 'Upload CSV to populate with real data',
    lat: 43.0103, lng: -81.2756,
    sensor: 'INMP441 MEMS Mic (I2S)', firmware: 'v2.3.1', uptime: '—',
    battery: 72, solar: 68, sdUsed: 35, sdTotal: 32,
    status: 'active', lastSeen: new Date(Date.now() - 5 * 60000),
    timezone: 'America/Toronto', gps: '43.0103, -81.2756',
    notes: 'Primary device. Upload a CSV on the Recordings tab to replace mock data with real readings.'
  },
  {
    id: 'N002', name: 'Device 2',
    location: 'Reference monitoring location',
    lat: 43.0082, lng: -81.2733,
    sensor: 'INMP441 MEMS Mic (I2S)', firmware: 'v2.3.1', uptime: '9d 11h',
    battery: 91, solar: 88, sdUsed: 22, sdTotal: 32,
    status: 'active', lastSeen: new Date(Date.now() - 12 * 60000),
    timezone: 'America/Toronto', gps: '43.0082, -81.2733',
    notes: 'Secondary reference device using default dataset.'
  }
];

const SENSOR_TYPES = [
  { name: 'INMP441 MEMS Mic (I2S)', rate: '44.1 kHz', bits: '24-bit', freq: '60Hz–15kHz', notes: 'Primary recommended sensor. Digital I2S output, high SNR.' },
  { name: 'Analog Electret (3.5mm)', rate: '16 kHz', bits: '12-bit', freq: '100Hz–8kHz', notes: 'Budget option. Lower quality, analog noise floor.' },
  { name: 'USB Condenser', rate: '48 kHz', bits: '16-bit', freq: '20Hz–20kHz', notes: 'Highest quality but higher power draw.' }
];

// ── Realistic dB ─────────────────────────────────────────────
function realisticDb(hour, dow) {
  const we = dow === 0 || dow === 6;
  let b = 38;
  if (hour >= 6  && hour < 9)  b = we ? 42 : 58;
  if (hour >= 9  && hour < 12) b = we ? 48 : 66;
  if (hour >= 12 && hour < 14) b = we ? 52 : 72;
  if (hour >= 14 && hour < 17) b = we ? 50 : 64;
  if (hour >= 17 && hour < 20) b = we ? 55 : 60;
  if (hour >= 20 && hour < 23) b = we ? 48 : 44;
  return Math.max(28, Math.min(95, b + (Math.random() - 0.5) * 14));
}

// ── Realistic Hz (environment-related) ───────────────────────
function realisticHz(hour, dow) {
  // Higher Hz during busy hours (traffic, voices), lower at night (wind, ambient)
  const we = dow === 0 || dow === 6;
  let base = 250;
  if (hour >= 7  && hour < 9)  base = we ? 400 : 800;
  if (hour >= 9  && hour < 12) base = we ? 500 : 1200;
  if (hour >= 12 && hour < 14) base = we ? 600 : 1500;
  if (hour >= 14 && hour < 17) base = we ? 550 : 1100;
  if (hour >= 17 && hour < 20) base = we ? 650 : 900;
  if (hour >= 20 || hour < 6)  base = 200;
  return Math.max(50, Math.round(base + (Math.random() - 0.5) * base * 0.4));
}

// ── Generate sessions (3 per node, each with 12 samples) ─────
function generateSessions(nodeId) {
  const now = new Date();
  const times = [
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 0, 0)
  ];

  return times.map((t, idx) => {
    const h = t.getHours(), dow = t.getDay();
    const avgDb = realisticDb(h, dow);
    const avgHz = realisticHz(h, dow);
    let peakDb = 0, peakHz = 0;
    const samples = [];

    for (let s = 0; s < 12; s++) {
      const ts  = new Date(t.getTime() + s * 5 * 60000);
      const db  = Math.max(28, avgDb + (Math.random() - 0.5) * 12);
      const hz  = Math.max(50, avgHz + (Math.random() - 0.5) * avgHz * 0.3);
      if (db > peakDb) peakDb = db;
      if (hz > peakHz) peakHz = hz;
      samples.push({
        sampleNum: s + 1,
        timestamp: ts,
        db: Math.round(db * 10) / 10,
        hz: Math.round(hz),
        freqPeak: Math.round(hz)
      });
    }

    const hzValues = samples.map(s => s.hz);
    return {
      id: `${nodeId}-S${String(idx + 1).padStart(2,'0')}`,
      nodeId,
      timestamp: t,
      duration: '1h 00m',
      avgDb:  Math.round(avgDb * 10) / 10,
      peakDb: Math.round(peakDb * 10) / 10,
      avgHz:  Math.round(hzValues.reduce((a,b)=>a+b,0)/hzValues.length),
      peakHz: Math.round(peakHz),
      samples,
      fileSize: `${(Math.random() * 30 + 8).toFixed(1)} MB`,
      hasSpike: peakDb > AppState.settings.critDb
    };
  });
}

let ALL_SESSIONS = [];

function initData() {
  ALL_SESSIONS = [];
  NODES.forEach(n => ALL_SESSIONS.push(...generateSessions(n.id)));
  ALL_SESSIONS.sort((a, b) => b.timestamp - a.timestamp);
}

// ── CSV → Device 1 Sessions ───────────────────────────────────
// Called after user uploads CSV. Replaces N001 sessions with real data.
function loadCsvIntoDevice1(rows) {
  AppState.csvRows = rows;

  // Remove old N001 sessions
  ALL_SESSIONS = ALL_SESSIONS.filter(s => s.nodeId !== 'N001');

  // Group rows into hourly sessions
  const byHour = {};
  rows.forEach(r => {
    const key = `${r.ts.getFullYear()}-${r.ts.getMonth()}-${r.ts.getDate()}-${r.ts.getHours()}`;
    if (!byHour[key]) byHour[key] = [];
    byHour[key].push(r);
  });

  let idx = 0;
  Object.entries(byHour).forEach(([, hourRows]) => {
    const dbs  = hourRows.map(r => r.db);
    const hzs  = hourRows.map(r => r.hz);
    const avgDb  = dbs.reduce((a,b)=>a+b,0)/dbs.length;
    const peakDb = Math.max(...dbs);
    const avgHz  = hzs.reduce((a,b)=>a+b,0)/hzs.length;
    const peakHz = Math.max(...hzs);

    const samples = hourRows.map((r, si) => ({
      sampleNum: si + 1,
      timestamp: r.ts,
      db: r.db,
      hz: r.hz,
      freqPeak: r.hz
    }));

    ALL_SESSIONS.push({
      id: `N001-CSV${String(idx++).padStart(3,'0')}`,
      nodeId: 'N001',
      timestamp: hourRows[0].ts,
      duration: '1h 00m',
      avgDb:  Math.round(avgDb * 10) / 10,
      peakDb: Math.round(peakDb * 10) / 10,
      avgHz:  Math.round(avgHz),
      peakHz: Math.round(peakHz),
      samples,
      fileSize: `${(hourRows.length * 0.08).toFixed(1)} KB`,
      hasSpike: peakDb > AppState.settings.critDb,
      fromCsv: true
    });
  });

  ALL_SESSIONS.sort((a, b) => b.timestamp - a.timestamp);

  // Update Device 1 node info
  const node = NODES.find(n => n.id === 'N001');
  if (node) {
    node.location = `CSV upload · ${rows.length} readings`;
    node.uptime = '—';
    node.lastSeen = rows[rows.length - 1]?.ts || new Date();
  }
}

// ── Parse EcoEcho CSV (timestamp, decibel, hz) ────────────────
// Row 1 = headers, skipped. Columns: timestamp | decibel | hz
function parseEcoCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Handle quoted or plain comma-separated
    const parts = lines[i].match(/(".*?"|[^,]+)(?:,|$)/g)?.map(p => p.replace(/^,|,$|"/g,'').trim()) || lines[i].split(',').map(p=>p.trim());
    if (parts.length < 2) continue;
    const ts  = new Date(parts[0]);
    const db  = parseFloat(parts[1]);
    const hz  = parts[2] ? parseFloat(parts[2]) : 500 + Math.random() * 500; // fallback if no hz column
    if (isNaN(ts.getTime()) || isNaN(db)) continue;
    rows.push({ ts, db: Math.round(db * 100)/100, hz: isNaN(hz) ? 500 : Math.round(hz) });
  }
  return rows.sort((a,b) => a.ts - b.ts);
}

// ── Getters ───────────────────────────────────────────────────
function getNodeSessions(nodeId, fromDate, toDate) {
  return ALL_SESSIONS.filter(s => {
    if (nodeId && s.nodeId !== nodeId) return false;
    if (fromDate && s.timestamp < fromDate) return false;
    if (toDate   && s.timestamp > toDate)   return false;
    return true;
  });
}

function getSpikeEvents(nodeId) {
  return ALL_SESSIONS
    .filter(s => s.hasSpike && (!nodeId || s.nodeId === nodeId))
    .slice(0, 20)
    .map(s => ({
      timestamp: s.timestamp, nodeId: s.nodeId, db: s.peakDb,
      desc: `Spike to ${s.peakDb}dB · avg Hz ${s.avgHz}`
    }));
}

// TODO: Replace with real API / BT data call
function getLiveDb(nodeId) {
  const node = NODES.find(n => n.id === nodeId);
  if (!node || node.status === 'offline') return 0;
  // If Device 1 has CSV data, use the most recent reading
  if (nodeId === 'N001' && AppState.csvRows.length) {
    const last = AppState.csvRows[AppState.csvRows.length - 1];
    return last.db + (Math.random() - 0.5) * 2;
  }
  const h = new Date().getHours(), dow = new Date().getDay();
  return Math.round(realisticDb(h, dow) * 10) / 10;
}

function getLiveHz(nodeId) {
  if (nodeId === 'N001' && AppState.csvRows.length) {
    const last = AppState.csvRows[AppState.csvRows.length - 1];
    return Math.round(last.hz + (Math.random() - 0.5) * 50);
  }
  const h = new Date().getHours(), dow = new Date().getDay();
  return realisticHz(h, dow);
}

// ── 24h/7d/30d chart data ────────────────────────────────────
function get24hHistory(nodeId) {
  const cutoff = new Date(Date.now() - 24 * 3600000);
  const sessions = getNodeSessions(nodeId, cutoff);
  const pts = [];
  sessions.forEach(s => s.samples.forEach(sp => pts.push({ t: sp.timestamp, db: sp.db, hz: sp.hz || sp.freqPeak || 500 })));
  return pts.sort((a,b) => a.t - b.t);
}

function getNdayHistory(nodeId, days) {
  const cutoff = new Date(Date.now() - days * 86400000);
  const sessions = getNodeSessions(nodeId, cutoff);
  const byDay = {};
  sessions.forEach(s => {
    const k = s.timestamp.toISOString().slice(0,10);
    if (!byDay[k]) byDay[k] = { dbs: [], hzs: [] };
    byDay[k].dbs.push(s.avgDb);
    byDay[k].hzs.push(s.avgHz || 500);
  });
  return Object.entries(byDay).map(([d, v]) => ({
    t: new Date(d),
    db: v.dbs.reduce((a,b)=>a+b,0)/v.dbs.length,
    hz: v.hzs.reduce((a,b)=>a+b,0)/v.hzs.length
  })).sort((a,b)=>a.t-b.t);
}

function getHzSummary(nodeId) {
  const sessions = getNodeSessions(nodeId);
  if (!sessions.length) return { avg: null, peak: null, low: null };
  const allHz = sessions.flatMap(s => s.samples.map(sp => sp.hz || sp.freqPeak || 500)).filter(Boolean);
  if (!allHz.length) return { avg: null, peak: null, low: null };
  return {
    avg:  Math.round(allHz.reduce((a,b)=>a+b,0)/allHz.length),
    peak: Math.max(...allHz),
    low:  Math.min(...allHz)
  };
}

function getFftData(nodeId) {
  // Use real Hz distribution if CSV loaded for Device 1
  let values;
  if (nodeId === 'N001' && AppState.csvRows.length) {
    const hzs = AppState.csvRows.map(r => r.hz);
    const bands = [
      hzs.filter(h=>h<=60).length,
      hzs.filter(h=>h>60&&h<=250).length,
      hzs.filter(h=>h>250&&h<=500).length,
      hzs.filter(h=>h>500&&h<=2000).length,
      hzs.filter(h=>h>2000&&h<=4000).length,
      hzs.filter(h=>h>4000&&h<=6000).length,
      hzs.filter(h=>h>6000).length,
    ];
    const total = hzs.length || 1;
    values = bands.map(b => (b / total) * 100);
  } else {
    values = [
      Math.random()*20+5, Math.random()*40+20, Math.random()*50+25,
      Math.random()*60+30, Math.random()*50+20, Math.random()*35+10, Math.random()*20+5
    ];
  }
  return {
    labels: ['Sub-bass\n20–60Hz','Bass\n60–250Hz','Low-mid\n250–500Hz','Mid\n500–2kHz','High-mid\n2–4kHz','Presence\n4–6kHz','Brilliance\n6kHz+'],
    values
  };
}

function getHeatmapData(nodeId) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return days.map((day, d) => ({
    day,
    values: Array.from({length:24}, (_, h) => Math.round(realisticDb(h, d >= 5 ? 0 : 1)))
  }));
}

function getTrendData() {
  const result = {};
  NODES.forEach(n => { result[n.id] = getNdayHistory(n.id, 30); });
  return result;
}

// ── Export CSV/JSON ───────────────────────────────────────────
function exportData(nodeIds, fromDate, toDate, includeRaw, includeEvents, format) {
  let sessions = ALL_SESSIONS.filter(s => {
    if (nodeIds.length && !nodeIds.includes(s.nodeId)) return false;
    if (fromDate && s.timestamp < fromDate) return false;
    if (toDate   && s.timestamp > toDate)   return false;
    return true;
  });

  let content, filename, mime;

  if (format === 'json') {
    const out = { exportedAt: new Date().toISOString(), sessions: sessions.map(s => ({
      id: s.id, nodeId: s.nodeId,
      timestamp: s.timestamp.toISOString(),
      avgDb: s.avgDb, peakDb: s.peakDb,
      avgHz: s.avgHz, peakHz: s.peakHz,
      duration: s.duration, fileSize: s.fileSize,
      ...(includeRaw && s.samples ? { samples: s.samples.map(sp=>({ sampleNum:sp.sampleNum, timestamp:sp.timestamp.toISOString(), db:sp.db, hz:sp.hz||sp.freqPeak })) } : {}),
      ...(includeEvents && s.hasSpike ? { spikeEvent: true } : {})
    }))};
    content = JSON.stringify(out, null, 2);
    filename = `ecoecho_export_${Date.now()}.json`;
    mime = 'application/json';
  } else {
    const rows = [['SessionID','NodeID','Timestamp','AvgDB','PeakDB','AvgHz','PeakHz','Duration','FileSize']];
    sessions.forEach(s => {
      rows.push([s.id,s.nodeId,s.timestamp.toISOString(),s.avgDb,s.peakDb,s.avgHz||'',s.peakHz||'',s.duration,s.fileSize]);
      if (includeRaw && s.samples) {
        rows.push(['---SAMPLES---','SampleNum','Timestamp','DB','Hz','','','','']);
        s.samples.forEach(sp=>rows.push(['',sp.sampleNum,sp.timestamp.toISOString(),sp.db,sp.hz||sp.freqPeak,'','','','']));
      }
    });
    content = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    filename = `ecoecho_export_${Date.now()}.csv`;
    mime = 'text/csv';
  }

  const blob = new Blob([content], {type: mime});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  AppState.recentExports.unshift({ filename, date: new Date(), size: `${Math.round(content.length/1024)} KB`, url });
  return filename;
}

// ── WAV Export ────────────────────────────────────────────────
// Converts dB+Hz readings into a PCM WAV file
async function exportWav(nodeId, msPerReading, onProgress) {
  const SAMPLE_RATE = 44100;
  const samples = [];

  // Get readings: prefer CSV rows for Device 1, else use sessions
  let readings = [];
  if (nodeId === 'N001' && AppState.csvRows.length) {
    readings = AppState.csvRows.map(r => ({ db: r.db, hz: r.hz }));
  } else {
    const sessions = getNodeSessions(nodeId);
    sessions.forEach(s => s.samples.forEach(sp => readings.push({ db: sp.db, hz: sp.hz || sp.freqPeak || 440 })));
  }

  if (!readings.length) return null;

  const samplesPerReading = Math.floor(SAMPLE_RATE * msPerReading / 1000);
  const totalSamples = readings.length * samplesPerReading;
  const buffer = new Float32Array(totalSamples);

  for (let ri = 0; ri < readings.length; ri++) {
    const { db, hz } = readings[ri];
    // Amplitude: map dB (20–100) to amplitude (0.01–0.9)
    const amp = Math.max(0.01, Math.min(0.9, (db - 20) / 80 * 0.9));
    const freq = Math.max(20, Math.min(20000, hz));
    const offset = ri * samplesPerReading;

    for (let si = 0; si < samplesPerReading; si++) {
      const t = si / SAMPLE_RATE;
      // Fade in/out 5% of each segment to avoid clicks
      const fade = si < samplesPerReading * 0.05
        ? si / (samplesPerReading * 0.05)
        : si > samplesPerReading * 0.95
          ? (samplesPerReading - si) / (samplesPerReading * 0.05)
          : 1;
      buffer[offset + si] = amp * fade * Math.sin(2 * Math.PI * freq * t);
    }

    if (ri % 10 === 0) {
      onProgress(ri / readings.length);
      await new Promise(r => setTimeout(r, 0)); // yield to UI
    }
  }

  onProgress(1);

  // Build WAV file
  const int16 = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    int16[i] = Math.round(Math.max(-1, Math.min(1, buffer[i])) * 32767);
  }

  const wavBuffer = encodeWav(int16, SAMPLE_RATE, 1);
  return wavBuffer;
}

function encodeWav(int16Samples, sampleRate, numChannels) {
  const bytesPerSample = 2;
  const dataLen = int16Samples.length * bytesPerSample;
  const wav = new ArrayBuffer(44 + dataLen);
  const view = new DataView(wav);

  function writeStr(offset, str) { for (let i=0;i<str.length;i++) view.setUint8(offset+i, str.charCodeAt(i)); }

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);          // chunk size
  view.setUint16(20, 1, true);           // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
  view.setUint16(32, numChannels * bytesPerSample, true); // block align
  view.setUint16(34, 16, true);          // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataLen, true);

  const dataView = new Int16Array(wav, 44);
  dataView.set(int16Samples);

  return wav;
}

// ── Export config ─────────────────────────────────────────────
function exportConfig() {
  const cfg = {
    version: '1.0', exportedAt: new Date().toISOString(),
    project: AppState.settings.campusName,
    settings: { sampleRate: AppState.settings.sampleRate, bitDepth: AppState.settings.bitDepth, channel: AppState.settings.channel, gain: AppState.settings.gain, lowCut: AppState.settings.lowCut, highCut: AppState.settings.highCut },
    schedule: { mode: AppState.settings.scheduleMode, activePreset: AppState.settings.activePreset, customBlocks: AppState.settings.customBlocks },
    alerts: { warnDb: AppState.settings.warnDb, critDb: AppState.settings.critDb, spikeDetection: AppState.settings.spikeDetection },
    note: 'This config can program multiple EcoEcho recorders at once.'
  };
  const blob = new Blob([JSON.stringify(cfg,null,2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ecoecho_config_${Date.now()}.json`; a.click();
}

// ── Helpers ───────────────────────────────────────────────────
function formatTime(d) { return d.toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit'}); }
function formatDate(d) { return d.toLocaleDateString('en-CA',{month:'short',day:'numeric'}); }
function formatDateTime(d) { return d.toLocaleString('en-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }
function timeAgo(d) {
  const diff = Date.now() - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
}
function dbStatus(db) {
  if (db < 45) return { label: 'QUIET',     color: '#7ab87a' };
  if (db < 60) return { label: 'MODERATE',  color: '#8fb98f' };
  if (db < 75) return { label: 'LOUD',      color: '#c9a85c' };
  return              { label: 'VERY LOUD', color: '#c97a6a' };
}
function dbColor(db) {
  if (db < 45) return '#7ab87a';
  if (db < 60) return '#8fb98f';
  if (db < 70) return '#c9a85c';
  if (db < 80) return '#c98a5c';
  return '#c97a6a';
}
function hzColor(hz) {
  if (hz < 200)  return '#7ab87a';
  if (hz < 500)  return '#8fb98f';
  if (hz < 1000) return '#b5c9a1';
  if (hz < 3000) return '#c9a85c';
  return '#c97a6a';
}
function nextRecordingTime() {
  const now = new Date(), next = new Date(now);
  next.setMinutes(0,0,0); next.setHours(next.getHours()+1);
  return formatTime(next);
}
function presetLabel(p) {
  return {dawn:'Dawn Chorus',fullday:'Full Day',night:'Night Only',peak:'Peak Activity'}[p] || 'Custom';
}
