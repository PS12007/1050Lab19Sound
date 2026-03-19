/* ============================================================
   CampusSound — data.js
   All mock data, state management, and data utilities
   TODO: Replace data-fetching functions with real API / BT calls
   ============================================================ */

// ── App State ────────────────────────────────────────────────
const AppState = {
  selectedNodeId: 'N001',
  currentPage: 'overview',
  theme: 'dark',
  settings: {
    sampleRate: '44.1 kHz',
    bitDepth: '24-bit',
    channel: 'Mono',
    gain: 0,
    lowCut: 80,
    highCut: 20000,
    syncInterval: '30 min',
    gpsFromMeta: true,
    btAutoReconnect: true,
    warnDb: 70,
    critDb: 85,
    spikeDetection: true,
    notifSound: false,
    campusName: 'University of Western Ontario',
    mapLat: 43.0096,
    mapLng: -81.2737,
    retention: '30 days',
    scheduleMode: 'quickstart',
    activePreset: 'fullday',
    customBlocks: []
  },
  bluetooth: {
    connected: false,
    deviceName: null,
    signalStrength: 0,
    lastSync: null
  },
  recentExports: []
};

// ── Nodes ────────────────────────────────────────────────────
const NODES = [
  {
    id: 'N001',
    name: 'Physics Building',
    location: 'Near Physics & Astronomy Building',
    lat: 43.0103, lng: -81.2756,
    sensor: 'INMP441 MEMS Mic (I2S)',
    firmware: 'v2.3.1',
    uptime: '14d 6h',
    battery: 68,
    solar: 74,
    sdUsed: 31,
    sdTotal: 32,
    status: 'active',
    lastSeen: new Date(Date.now() - 3 * 60000),
    timezone: 'America/Toronto',
    gps: '43.0103, -81.2756',
    notes: 'Primary monitoring node. Active since Sept 2024.'
  },
  {
    id: 'N002',
    name: 'University College',
    location: 'South Courtyard of University College',
    lat: 43.0082, lng: -81.2733,
    sensor: 'INMP441 MEMS Mic (I2S)',
    firmware: 'v2.3.1',
    uptime: '9d 11h',
    battery: 91,
    solar: 88,
    sdUsed: 22,
    sdTotal: 32,
    status: 'active',
    lastSeen: new Date(Date.now() - 8 * 60000),
    timezone: 'America/Toronto',
    gps: '43.0082, -81.2733',
    notes: 'High foot traffic zone. Good for voice/event classification.'
  },
  {
    id: 'N003',
    name: 'D.B. Weldon Library',
    location: 'East entrance, Weldon Library',
    lat: 43.0098, lng: -81.2715,
    sensor: 'Analog Electret (3.5mm)',
    firmware: 'v2.1.0',
    uptime: '2d 4h',
    battery: 22,
    solar: 18,
    sdUsed: 78,
    sdTotal: 32,
    status: 'warning',
    lastSeen: new Date(Date.now() - 45 * 60000),
    timezone: 'America/Toronto',
    gps: '43.0098, -81.2715',
    notes: 'Low battery — scheduled for maintenance. SD card nearly full.'
  },
  {
    id: 'N004',
    name: 'Thames Hall',
    location: 'North face of Thames Hall',
    lat: 43.0115, lng: -81.2770,
    sensor: 'USB Condenser',
    firmware: 'v2.2.5',
    uptime: '0d 0h',
    battery: 5,
    solar: 0,
    sdUsed: 45,
    sdTotal: 32,
    status: 'offline',
    lastSeen: new Date(Date.now() - 3 * 3600000),
    timezone: 'America/Toronto',
    gps: '43.0115, -81.2770',
    notes: 'Offline since 06:30. Possible power failure — check solar connections.'
  }
];

// ── Sensor Types ────────────────────────────────────────────
const SENSOR_TYPES = [
  { name: 'INMP441 MEMS Mic (I2S)', rate: '44.1 kHz', bits: '24-bit', freq: '60Hz–15kHz', notes: 'Primary recommended sensor. Digital I2S output, high SNR.' },
  { name: 'Analog Electret (3.5mm)', rate: '16 kHz', bits: '12-bit', freq: '100Hz–8kHz', notes: 'Budget option. Lower quality, analog noise floor.' },
  { name: 'USB Condenser', rate: '48 kHz', bits: '16-bit', freq: '20Hz–20kHz', notes: 'Highest quality but higher power draw.' }
];

// ── Classification labels ────────────────────────────────────
const CLASSES = ['🐦 Birds', '🚗 Traffic', '💨 Wind', '🗣 Voices', '🏗 Construction', '🎵 Music'];
const CLASS_COLORS = {
  '🐦 Birds':        '#84cc16',
  '🚗 Traffic':      '#94a3b8',
  '💨 Wind':         '#38bdf8',
  '🗣 Voices':       '#f472b6',
  '🏗 Construction': '#f59e0b',
  '🎵 Music':        '#a78bfa'
};

// ── Generate realistic dB value ──────────────────────────────
function realisticDb(hour, dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  let base = 38;
  if (hour >= 6 && hour < 9)   base = isWeekend ? 42 : 58;
  if (hour >= 9 && hour < 12)  base = isWeekend ? 48 : 66;
  if (hour >= 12 && hour < 14) base = isWeekend ? 52 : 72;
  if (hour >= 14 && hour < 17) base = isWeekend ? 50 : 64;
  if (hour >= 17 && hour < 20) base = isWeekend ? 55 : 60;
  if (hour >= 20 && hour < 23) base = isWeekend ? 48 : 44;
  return Math.max(28, Math.min(95, base + (Math.random() - 0.5) * 14));
}

// ── Generate 30 days of hourly sessions for a node ──────────
function generateSessions(nodeId, days = 30) {
  const sessions = [];
  const now = new Date();
  let sessionId = 1;

  for (let d = days; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dow = date.getDay();

    for (let h = 6; h < 22; h++) { // Active hours only
      const sessionTime = new Date(date);
      sessionTime.setHours(h, 0, 0, 0);
      if (sessionTime > now) continue;

      // Generate 12 samples (every 5 min for one hour)
      const samples = [];
      const avgDb = realisticDb(h, dow);
      let peakDb = 0;

      for (let s = 0; s < 12; s++) {
        const ts = new Date(sessionTime.getTime() + s * 5 * 60000);
        const db = Math.max(28, avgDb + (Math.random() - 0.5) * 12);
        const cls = randomClass(h, dow);
        if (db > peakDb) peakDb = db;
        samples.push({
          sampleNum: s + 1,
          timestamp: ts,
          db: Math.round(db * 10) / 10,
          classification: cls,
          freqPeak: Math.round(200 + Math.random() * 3000)
        });
      }

      const dominantClass = samples
        .map(s => s.classification)
        .reduce((a, b, _, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b);

      const spikeEvent = peakDb > AppState.settings.critDb && Math.random() > 0.6;

      sessions.push({
        id: `S${String(sessionId++).padStart(4,'0')}`,
        nodeId,
        timestamp: sessionTime,
        duration: '1h 00m',
        avgDb: Math.round(avgDb * 10) / 10,
        peakDb: Math.round(peakDb * 10) / 10,
        dominantClass,
        samples,
        fileSize: `${(Math.random() * 40 + 10).toFixed(1)} MB`,
        hasSpike: spikeEvent
      });
    }
  }
  return sessions;
}

function randomClass(hour, dow) {
  const weights = {
    '🐦 Birds':        hour >= 5  && hour <= 9  ? 4 : 1,
    '🚗 Traffic':      hour >= 7  && hour <= 19 ? 3 : 1,
    '💨 Wind':         1,
    '🗣 Voices':       hour >= 9  && hour <= 20 ? 3 : 1,
    '🏗 Construction': hour >= 8  && hour <= 17 && dow >= 1 && dow <= 5 ? 2 : 0,
    '🎵 Music':        hour >= 11 && hour <= 22 ? 2 : 0
  };
  const pool = [];
  for (const [cls, w] of Object.entries(weights)) {
    for (let i = 0; i < w; i++) pool.push(cls);
  }
  if (pool.length === 0) return CLASSES[Math.floor(Math.random() * CLASSES.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Generate all sessions ────────────────────────────────────
// TODO: Replace with real API / BT data call
let ALL_SESSIONS = [];

function initData() {
  ALL_SESSIONS = [];
  NODES.forEach(n => {
    ALL_SESSIONS.push(...generateSessions(n.id, 30));
  });
  ALL_SESSIONS.sort((a, b) => b.timestamp - a.timestamp);
}

// ── Get sessions for a node ──────────────────────────────────
// TODO: Replace with real API / BT data call
function getNodeSessions(nodeId, fromDate, toDate) {
  return ALL_SESSIONS.filter(s => {
    if (nodeId && s.nodeId !== nodeId) return false;
    if (fromDate && s.timestamp < fromDate) return false;
    if (toDate && s.timestamp > toDate) return false;
    return true;
  });
}

// ── Get spike events ─────────────────────────────────────────
// TODO: Replace with real API / BT data call
function getSpikeEvents(nodeId) {
  return ALL_SESSIONS.filter(s => s.hasSpike && (!nodeId || s.nodeId === nodeId))
    .slice(0, 20)
    .map(s => ({
      timestamp: s.timestamp,
      nodeId: s.nodeId,
      db: s.peakDb,
      desc: generateSpikeDesc(s.peakDb, s.dominantClass)
    }));
}

function generateSpikeDesc(db, cls) {
  const descs = {
    '🏗 Construction': 'Possible construction activity',
    '🚗 Traffic':      'Heavy traffic event',
    '🗣 Voices':       'Crowd noise detected',
    '🎵 Music':        'Amplified music nearby',
    '🐦 Birds':        'Intense bird activity',
    '💨 Wind':         'Wind gust event'
  };
  const base = descs[cls] || 'Noise spike detected';
  return `Spike to ${db}dB — ${base}`;
}

// ── Get current live dB for selected node ────────────────────
// TODO: Replace with real BT/API live data call
function getLiveDb(nodeId) {
  const node = NODES.find(n => n.id === nodeId);
  if (!node || node.status === 'offline') return 0;
  const h = new Date().getHours();
  const dow = new Date().getDay();
  return Math.round(realisticDb(h, dow) * 10) / 10;
}

// ── Get 24h history (one value per sample = 12/hour) ─────────
// TODO: Replace with real API call
function get24hHistory(nodeId) {
  const now = new Date();
  const cutoff = new Date(now - 24 * 3600000);
  const sessions = getNodeSessions(nodeId, cutoff, now);
  const points = [];
  sessions.forEach(s => {
    s.samples.forEach(sp => {
      points.push({ t: sp.timestamp, db: sp.db });
    });
  });
  points.sort((a, b) => a.t - b.t);
  return points;
}

// ── Get 7d / 30d history (hourly average) ────────────────────
// TODO: Replace with real API call
function getNdayHistory(nodeId, days) {
  const now = new Date();
  const cutoff = new Date(now - days * 24 * 3600000);
  const sessions = getNodeSessions(nodeId, cutoff, now);
  const byDay = {};
  sessions.forEach(s => {
    const key = s.timestamp.toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(s.avgDb);
  });
  return Object.entries(byDay).map(([d, vals]) => ({
    t: new Date(d),
    db: vals.reduce((a, b) => a + b, 0) / vals.length
  })).sort((a, b) => a.t - b.t);
}

// ── Get FFT data ─────────────────────────────────────────────
// TODO: Replace with real FFT data from mic
function getFftData(nodeId) {
  const h = new Date().getHours();
  return {
    labels: ['Sub-bass\n20–60Hz', 'Bass\n60–250Hz', 'Low-mid\n250–500Hz', 'Mid\n500–2kHz', 'High-mid\n2–4kHz', 'Presence\n4–6kHz', 'Brilliance\n6–20kHz'],
    values: [
      Math.random() * 20 + 5,
      Math.random() * 40 + 20,
      Math.random() * 50 + 25,
      Math.random() * 60 + 30,
      Math.random() * 50 + 20,
      Math.random() * 35 + 10,
      Math.random() * 20 + 5
    ]
  };
}

// ── Get heatmap data ─────────────────────────────────────────
// TODO: Replace with real API call
function getHeatmapData(nodeId) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const data = [];
  for (let d = 0; d < 7; d++) {
    const row = [];
    for (let h = 0; h < 24; h++) {
      const isWeekend = d >= 5;
      row.push(Math.round(realisticDb(h, isWeekend ? 0 : 1)));
    }
    data.push({ day: days[d], values: row });
  }
  return data;
}

// ── Get trend data for all nodes ─────────────────────────────
// TODO: Replace with real API call
function getTrendData() {
  const result = {};
  NODES.forEach(node => {
    result[node.id] = getNdayHistory(node.id, 30);
  });
  return result;
}

// ── Import data from CSV or JSON ──────────────────────────────
function importData(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    let added = 0;
    try {
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        const sessions = Array.isArray(parsed) ? parsed : parsed.sessions || [];
        sessions.forEach(s => {
          s.timestamp = new Date(s.timestamp);
          if (s.samples) s.samples.forEach(sp => sp.timestamp = new Date(sp.timestamp));
          ALL_SESSIONS.unshift(s);
          added++;
        });
      } else {
        // CSV: timestamp, nodeId, avgDb, peakDb, dominantClass, fileSize
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].toLowerCase().split(',');
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',');
          if (vals.length < 3) continue;
          const row = {};
          headers.forEach((h, idx) => row[h.trim()] = (vals[idx] || '').trim());
          ALL_SESSIONS.unshift({
            id: `IMP${Date.now()}_${i}`,
            nodeId: row.nodeid || row.node || 'N001',
            timestamp: new Date(row.timestamp || row.time || Date.now()),
            avgDb: parseFloat(row.avgdb || row.avg_db || row.db || 0),
            peakDb: parseFloat(row.peakdb || row.peak_db || row.peak || 0),
            dominantClass: row.dominantclass || row.class || CLASSES[0],
            duration: row.duration || '1h 00m',
            fileSize: row.filesize || '—',
            samples: [],
            hasSpike: false
          });
          added++;
        }
      }
      ALL_SESSIONS.sort((a, b) => b.timestamp - a.timestamp);
      callback(null, added);
    } catch(err) {
      callback(err, 0);
    }
  };
  reader.readAsText(file);
}

// ── Export data ───────────────────────────────────────────────
function exportData(nodeIds, fromDate, toDate, includeRaw, includeEvents, includeFFT, format) {
  let sessions = ALL_SESSIONS.filter(s => {
    if (nodeIds.length && !nodeIds.includes(s.nodeId)) return false;
    if (fromDate && s.timestamp < fromDate) return false;
    if (toDate && s.timestamp > toDate) return false;
    return true;
  });

  let content, filename, mime;

  if (format === 'json') {
    const out = { exportedAt: new Date().toISOString(), sessions: [] };
    sessions.forEach(s => {
      const entry = {
        id: s.id, nodeId: s.nodeId,
        timestamp: s.timestamp.toISOString(),
        avgDb: s.avgDb, peakDb: s.peakDb,
        dominantClass: s.dominantClass,
        duration: s.duration, fileSize: s.fileSize
      };
      if (includeRaw && s.samples) entry.samples = s.samples.map(sp => ({
        sampleNum: sp.sampleNum,
        timestamp: sp.timestamp.toISOString(),
        db: sp.db, classification: sp.classification, freqPeak: sp.freqPeak
      }));
      if (includeEvents && s.hasSpike) entry.spikeEvent = true;
      out.sessions.push(entry);
    });
    content = JSON.stringify(out, null, 2);
    filename = `campussound_export_${Date.now()}.json`;
    mime = 'application/json';
  } else {
    const rows = [['SessionID','NodeID','Timestamp','AvgDB','PeakDB','DominantClass','Duration','FileSize']];
    sessions.forEach(s => {
      rows.push([s.id, s.nodeId, s.timestamp.toISOString(), s.avgDb, s.peakDb, s.dominantClass, s.duration, s.fileSize]);
      if (includeRaw && s.samples) {
        rows.push(['---SAMPLES---','SampleNum','Timestamp','DB','Classification','FreqPeak(Hz)','','']);
        s.samples.forEach(sp => {
          rows.push(['', sp.sampleNum, sp.timestamp.toISOString(), sp.db, sp.classification, sp.freqPeak, '', '']);
        });
      }
    });
    content = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    filename = `campussound_export_${Date.now()}.csv`;
    mime = 'text/csv';
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);

  const sizeKb = Math.round(content.length / 1024);
  AppState.recentExports.unshift({
    filename, date: new Date(), size: `${sizeKb} KB`, url
  });
  return filename;
}

// ── Export schedule config ────────────────────────────────────
function exportConfig() {
  const config = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    campus: AppState.settings.campusName,
    settings: {
      sampleRate: AppState.settings.sampleRate,
      bitDepth: AppState.settings.bitDepth,
      channel: AppState.settings.channel,
      gain: AppState.settings.gain,
      lowCut: AppState.settings.lowCut,
      highCut: AppState.settings.highCut
    },
    schedule: {
      mode: AppState.settings.scheduleMode,
      activePreset: AppState.settings.activePreset,
      customBlocks: AppState.settings.customBlocks
    },
    alerts: {
      warnDb: AppState.settings.warnDb,
      critDb: AppState.settings.critDb,
      spikeDetection: AppState.settings.spikeDetection
    },
    note: 'This config file can be used to program multiple CampusSound recorders at once.'
  };
  const content = JSON.stringify(config, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `campussound_config_${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
}

// ── Format helpers ────────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}
function formatDateTime(date) {
  return date.toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(date) {
  const diff = Date.now() - date;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
}
function dbStatus(db) {
  if (db < 45) return { label: 'QUIET',     color: '#22c55e' };
  if (db < 60) return { label: 'MODERATE',  color: '#38bdf8' };
  if (db < 75) return { label: 'LOUD',      color: '#f59e0b' };
  return              { label: 'VERY LOUD', color: '#ef4444' };
}
function dbColor(db) {
  if (db < 45) return '#22c55e';
  if (db < 60) return '#38bdf8';
  if (db < 70) return '#f59e0b';
  if (db < 80) return '#f97316';
  return '#ef4444';
}

// Simulate next recording time
function nextRecordingTime() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return formatTime(next);
}
