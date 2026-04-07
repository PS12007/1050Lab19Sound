/* ============================================================
   EcoEcho — data.js
   State, 2-device setup, real Device 1 data from sound_log.xlsx
   ============================================================ */

// ── Real data from sound_log.xlsx (embedded) ─────────────────
// Columns: timestamp (string), decibel, hz
const SOUND_LOG_RAW = [{"ts": "4/6/2026 19:02", "db": 38.4, "hz": 4179.7}, {"ts": "4/6/2026 19:02", "db": 36.23, "hz": 2851.6}, {"ts": "4/6/2026 19:02", "db": 41.1, "hz": 2187.5}, {"ts": "4/6/2026 19:02", "db": 38.9, "hz": 3066.4}, {"ts": "4/6/2026 19:02", "db": 37.56, "hz": 4648.4}, {"ts": "4/6/2026 19:02", "db": 37.19, "hz": 4492.2}, {"ts": "4/6/2026 19:02", "db": 38.07, "hz": 3847.7}, {"ts": "4/6/2026 19:02", "db": 42.43, "hz": 3925.8}, {"ts": "4/6/2026 19:02", "db": 42.4, "hz": 4843.8}, {"ts": "4/6/2026 19:02", "db": 41.34, "hz": 4101.6}, {"ts": "4/6/2026 19:02", "db": 40.98, "hz": 4355.5}, {"ts": "4/6/2026 19:02", "db": 46.57, "hz": 3574.2}, {"ts": "4/6/2026 19:02", "db": 42.3, "hz": 2109.4}, {"ts": "4/6/2026 19:02", "db": 41.75, "hz": 2109.4}, {"ts": "4/6/2026 19:02", "db": 45.3, "hz": 2363.3}, {"ts": "4/6/2026 19:02", "db": 41.03, "hz": 4257.8}, {"ts": "4/6/2026 19:02", "db": 51.25, "hz": 2597.7}, {"ts": "4/6/2026 19:02", "db": 44.84, "hz": 4023.4}, {"ts": "4/6/2026 19:03", "db": 49.82, "hz": 1250.0}, {"ts": "4/6/2026 19:03", "db": 42.32, "hz": 3847.7}, {"ts": "4/6/2026 19:03", "db": 41.5, "hz": 4433.6}, {"ts": "4/6/2026 19:03", "db": 50.22, "hz": 1699.2}, {"ts": "4/6/2026 19:03", "db": 81.22, "hz": 1640.6}, {"ts": "4/6/2026 19:03", "db": 43.44, "hz": 4882.8}, {"ts": "4/6/2026 19:03", "db": 39.37, "hz": 4882.8}, {"ts": "4/6/2026 19:03", "db": 38.92, "hz": 4160.2}, {"ts": "4/6/2026 19:03", "db": 39.89, "hz": 4824.2}, {"ts": "4/6/2026 19:03", "db": 37.82, "hz": 4023.4}, {"ts": "4/6/2026 19:03", "db": 43.41, "hz": 2890.6}, {"ts": "4/6/2026 19:03", "db": 37.41, "hz": 4082.0}, {"ts": "4/6/2026 19:03", "db": 47.73, "hz": 1328.1}, {"ts": "4/6/2026 19:03", "db": 38.65, "hz": 3984.4}, {"ts": "4/6/2026 19:03", "db": 42.42, "hz": 2089.8}, {"ts": "4/6/2026 19:03", "db": 47.61, "hz": 996.1}, {"ts": "4/6/2026 19:03", "db": 37.89, "hz": 4257.8}, {"ts": "4/6/2026 19:03", "db": 38.17, "hz": 3183.6}, {"ts": "4/6/2026 19:03", "db": 38.09, "hz": 3691.4}, {"ts": "4/6/2026 19:03", "db": 45.0, "hz": 2714.8}, {"ts": "4/6/2026 19:03", "db": 37.57, "hz": 4492.2}, {"ts": "4/6/2026 19:03", "db": 51.39, "hz": 1894.5}, {"ts": "4/6/2026 19:03", "db": 41.69, "hz": 4316.4}, {"ts": "4/6/2026 19:03", "db": 43.19, "hz": 3496.1}, {"ts": "4/6/2026 19:03", "db": 41.36, "hz": 3593.8}, {"ts": "4/6/2026 19:03", "db": 42.77, "hz": 4277.3}, {"ts": "4/6/2026 19:03", "db": 38.15, "hz": 3007.8}, {"ts": "4/6/2026 19:03", "db": 41.5, "hz": 2207.0}, {"ts": "4/6/2026 19:03", "db": 42.85, "hz": 3320.3}, {"ts": "4/6/2026 19:03", "db": 40.64, "hz": 3515.6}, {"ts": "4/6/2026 19:04", "db": 40.63, "hz": 3613.3}, {"ts": "4/6/2026 19:04", "db": 38.93, "hz": 3027.3}, {"ts": "4/6/2026 19:04", "db": 38.87, "hz": 3925.8}, {"ts": "4/6/2026 19:04", "db": 48.01, "hz": 3613.3}, {"ts": "4/6/2026 19:04", "db": 37.3, "hz": 4316.4}, {"ts": "4/6/2026 19:04", "db": 37.41, "hz": 3847.7}, {"ts": "4/6/2026 19:04", "db": 37.37, "hz": 3789.1}, {"ts": "4/6/2026 19:04", "db": 37.46, "hz": 4296.9}, {"ts": "4/6/2026 19:04", "db": 38.12, "hz": 3945.3}, {"ts": "4/6/2026 19:04", "db": 37.47, "hz": 4433.6}, {"ts": "4/6/2026 19:04", "db": 37.57, "hz": 4433.6}, {"ts": "4/6/2026 19:04", "db": 41.89, "hz": 3554.7}, {"ts": "4/6/2026 19:04", "db": 37.94, "hz": 3418.0}, {"ts": "4/6/2026 19:04", "db": 37.93, "hz": 2617.2}, {"ts": "4/6/2026 19:04", "db": 40.69, "hz": 1718.8}, {"ts": "4/6/2026 19:04", "db": 41.56, "hz": 4277.3}, {"ts": "4/6/2026 19:04", "db": 42.13, "hz": 2011.7}, {"ts": "4/6/2026 19:04", "db": 38.53, "hz": 3496.1}, {"ts": "4/6/2026 19:04", "db": 39.77, "hz": 4511.7}, {"ts": "4/6/2026 19:04", "db": 46.64, "hz": 2988.3}, {"ts": "4/6/2026 19:04", "db": 39.5, "hz": 2441.4}, {"ts": "4/6/2026 19:04", "db": 38.53, "hz": 4882.8}, {"ts": "4/6/2026 19:04", "db": 38.07, "hz": 4335.9}, {"ts": "4/6/2026 19:04", "db": 40.13, "hz": 3808.6}, {"ts": "4/6/2026 19:04", "db": 37.52, "hz": 4160.2}, {"ts": "4/6/2026 19:04", "db": 37.91, "hz": 3906.2}, {"ts": "4/6/2026 19:04", "db": 39.77, "hz": 3418.0}, {"ts": "4/6/2026 19:04", "db": 40.56, "hz": 3574.2}, {"ts": "4/6/2026 19:04", "db": 38.74, "hz": 3906.2}, {"ts": "4/6/2026 19:04", "db": 37.51, "hz": 3964.8}, {"ts": "4/6/2026 19:05", "db": 38.3, "hz": 2968.8}, {"ts": "4/6/2026 19:05", "db": 38.9, "hz": 3828.1}, {"ts": "4/6/2026 19:05", "db": 37.94, "hz": 3984.4}, {"ts": "4/6/2026 19:05", "db": 39.06, "hz": 3730.5}, {"ts": "4/6/2026 19:05", "db": 38.25, "hz": 4570.3}, {"ts": "4/6/2026 19:05", "db": 38.14, "hz": 3925.8}, {"ts": "4/6/2026 19:05", "db": 37.64, "hz": 4277.3}, {"ts": "4/6/2026 19:05", "db": 38.17, "hz": 3984.4}, {"ts": "4/6/2026 19:05", "db": 38.11, "hz": 4453.1}, {"ts": "4/6/2026 19:05", "db": 37.91, "hz": 4335.9}, {"ts": "4/6/2026 19:05", "db": 38.17, "hz": 4355.5}, {"ts": "4/6/2026 19:05", "db": 40.24, "hz": 4199.2}, {"ts": "4/6/2026 19:05", "db": 38.92, "hz": 2578.1}, {"ts": "4/6/2026 19:05", "db": 38.26, "hz": 3906.2}, {"ts": "4/6/2026 19:05", "db": 38.43, "hz": 3945.3}, {"ts": "4/6/2026 19:05", "db": 37.79, "hz": 4335.9}, {"ts": "4/6/2026 19:05", "db": 38.34, "hz": 3300.8}, {"ts": "4/6/2026 19:05", "db": 37.77, "hz": 3281.2}, {"ts": "4/6/2026 19:05", "db": 37.07, "hz": 4648.4}, {"ts": "4/6/2026 19:05", "db": 36.75, "hz": 3828.1}, {"ts": "4/6/2026 19:05", "db": 38.07, "hz": 4257.8}, {"ts": "4/6/2026 19:05", "db": 38.82, "hz": 3769.5}, {"ts": "4/6/2026 19:05", "db": 45.5, "hz": 1933.6}, {"ts": "4/6/2026 19:05", "db": 39.05, "hz": 4492.2}, {"ts": "4/6/2026 19:05", "db": 40.02, "hz": 3125.0}, {"ts": "4/6/2026 19:05", "db": 48.08, "hz": 2890.6}, {"ts": "4/6/2026 19:05", "db": 47.18, "hz": 2246.1}, {"ts": "4/6/2026 19:05", "db": 37.97, "hz": 3261.7}, {"ts": "4/6/2026 19:05", "db": 40.52, "hz": 3398.4}, {"ts": "4/6/2026 19:05", "db": 38.63, "hz": 3593.8}, {"ts": "4/6/2026 19:06", "db": 38.53, "hz": 3710.9}, {"ts": "4/6/2026 19:06", "db": 43.83, "hz": 2089.8}, {"ts": "4/6/2026 19:06", "db": 38.38, "hz": 4414.1}, {"ts": "4/6/2026 19:06", "db": 42.99, "hz": 4394.5}, {"ts": "4/6/2026 19:06", "db": 42.27, "hz": 1894.5}, {"ts": "4/6/2026 19:06", "db": 44.2, "hz": 1835.9}, {"ts": "4/6/2026 19:06", "db": 38.96, "hz": 4003.9}, {"ts": "4/6/2026 19:06", "db": 42.09, "hz": 2031.2}, {"ts": "4/6/2026 19:06", "db": 46.52, "hz": 1406.2}, {"ts": "4/6/2026 19:06", "db": 38.77, "hz": 3085.9}, {"ts": "4/6/2026 19:06", "db": 37.07, "hz": 3769.5}, {"ts": "4/6/2026 19:06", "db": 40.02, "hz": 1777.3}, {"ts": "4/6/2026 19:06", "db": 37.46, "hz": 3574.2}, {"ts": "4/6/2026 19:06", "db": 42.78, "hz": 2812.5}, {"ts": "4/6/2026 19:06", "db": 44.14, "hz": 1914.1}, {"ts": "4/6/2026 19:06", "db": 37.99, "hz": 3496.1}, {"ts": "4/6/2026 19:06", "db": 49.84, "hz": 1406.2}, {"ts": "4/6/2026 19:06", "db": 37.71, "hz": 4160.2}, {"ts": "4/6/2026 19:06", "db": 41.73, "hz": 2929.7}, {"ts": "4/6/2026 19:06", "db": 40.04, "hz": 2421.9}, {"ts": "4/6/2026 19:06", "db": 51.04, "hz": 1328.1}, {"ts": "4/6/2026 19:06", "db": 42.57, "hz": 2148.4}, {"ts": "4/6/2026 19:06", "db": 38.32, "hz": 4570.3}, {"ts": "4/6/2026 19:06", "db": 43.18, "hz": 2207.0}, {"ts": "4/6/2026 19:06", "db": 49.73, "hz": 1503.9}, {"ts": "4/6/2026 19:06", "db": 41.86, "hz": 2265.6}, {"ts": "4/6/2026 19:06", "db": 37.49, "hz": 3945.3}, {"ts": "4/6/2026 19:06", "db": 39.4, "hz": 4043.0}, {"ts": "4/6/2026 19:06", "db": 38.07, "hz": 3710.9}, {"ts": "4/6/2026 19:06", "db": 36.81, "hz": 3886.7}, {"ts": "4/6/2026 19:07", "db": 39.96, "hz": 2558.6}, {"ts": "4/6/2026 19:07", "db": 39.58, "hz": 3710.9}, {"ts": "4/6/2026 19:07", "db": 39.14, "hz": 2441.4}, {"ts": "4/6/2026 19:07", "db": 40.9, "hz": 2714.8}, {"ts": "4/6/2026 19:07", "db": 44.53, "hz": 3476.6}, {"ts": "4/6/2026 19:07", "db": 37.71, "hz": 4043.0}, {"ts": "4/6/2026 19:07", "db": 42.2, "hz": 2656.2}, {"ts": "4/6/2026 19:07", "db": 42.44, "hz": 2968.8}, {"ts": "4/6/2026 19:07", "db": 39.21, "hz": 4140.6}, {"ts": "4/6/2026 19:07", "db": 38.96, "hz": 3769.5}, {"ts": "4/6/2026 19:07", "db": 38.17, "hz": 3847.7}, {"ts": "4/6/2026 19:07", "db": 37.9, "hz": 3007.8}, {"ts": "4/6/2026 19:02", "db": 37.58, "hz": 1464.8}, {"ts": "4/6/2026 19:02", "db": 41.01, "hz": 1992.2}, {"ts": "4/6/2026 19:02", "db": 39.05, "hz": 2949.2}, {"ts": "4/6/2026 19:02", "db": 36.44, "hz": 4375.0}, {"ts": "4/6/2026 19:02", "db": 38.4, "hz": 3906.2}, {"ts": "4/6/2026 19:02", "db": 38.95, "hz": 4179.7}, {"ts": "4/6/2026 19:02", "db": 39.57, "hz": 4257.8}, {"ts": "4/6/2026 19:02", "db": 36.68, "hz": 4375.0}, {"ts": "4/6/2026 19:02", "db": 35.06, "hz": 3281.2}, {"ts": "4/6/2026 19:02", "db": 37.45, "hz": 3730.5}, {"ts": "4/6/2026 19:02", "db": 31.4, "hz": 3281.2}, {"ts": "4/6/2026 19:02", "db": 36.18, "hz": 4453.1}, {"ts": "4/6/2026 19:02", "db": 36.45, "hz": 3476.6}, {"ts": "4/6/2026 19:02", "db": 38.31, "hz": 3125.0}, {"ts": "4/6/2026 19:02", "db": 39.48, "hz": 3574.2}, {"ts": "4/6/2026 19:02", "db": 47.09, "hz": 1015.6}, {"ts": "4/6/2026 19:02", "db": 29.63, "hz": 39.1}, {"ts": "4/6/2026 19:02", "db": 47.53, "hz": 2148.4}, {"ts": "4/6/2026 19:03", "db": 38.08, "hz": 3164.1}, {"ts": "4/6/2026 19:03", "db": 37.09, "hz": 3222.7}, {"ts": "4/6/2026 19:03", "db": 41.14, "hz": 2793.0}, {"ts": "4/6/2026 19:03", "db": 35.63, "hz": 2890.6}, {"ts": "4/6/2026 19:03", "db": 37.0, "hz": 4277.3}, {"ts": "4/6/2026 19:03", "db": 38.34, "hz": 2812.5}, {"ts": "4/6/2026 19:03", "db": 38.06, "hz": 4003.9}, {"ts": "4/6/2026 19:03", "db": 31.64, "hz": 3906.2}, {"ts": "4/6/2026 19:03", "db": 32.6, "hz": 3632.8}, {"ts": "4/6/2026 19:03", "db": 35.81, "hz": 3457.0}, {"ts": "4/6/2026 19:03", "db": 37.53, "hz": 3710.9}, {"ts": "4/6/2026 19:03", "db": 37.95, "hz": 3085.9}, {"ts": "4/6/2026 19:03", "db": 39.29, "hz": 3671.9}, {"ts": "4/6/2026 19:03", "db": 36.53, "hz": 4160.2}, {"ts": "4/6/2026 19:03", "db": 41.35, "hz": 2812.5}, {"ts": "4/6/2026 19:03", "db": 55.18, "hz": 2168.0}, {"ts": "4/6/2026 19:03", "db": 32.98, "hz": 3789.1}, {"ts": "4/6/2026 19:03", "db": 33.98, "hz": 4218.8}, {"ts": "4/6/2026 19:03", "db": 51.58, "hz": 2265.6}, {"ts": "4/6/2026 19:03", "db": 39.92, "hz": 2226.6}, {"ts": "4/6/2026 19:03", "db": 36.73, "hz": 3418.0}, {"ts": "4/6/2026 19:03", "db": 37.0, "hz": 4101.6}, {"ts": "4/6/2026 19:03", "db": 40.72, "hz": 2031.2}, {"ts": "4/6/2026 19:03", "db": 37.42, "hz": 3281.2}, {"ts": "4/6/2026 19:03", "db": 36.76, "hz": 4179.7}, {"ts": "4/6/2026 19:03", "db": 37.79, "hz": 3828.1}, {"ts": "4/6/2026 19:03", "db": 41.69, "hz": 3632.8}, {"ts": "4/6/2026 19:03", "db": 38.44, "hz": 4355.5}, {"ts": "4/6/2026 19:03", "db": 39.8, "hz": 3398.4}, {"ts": "4/6/2026 19:03", "db": 39.99, "hz": 4121.1}, {"ts": "4/6/2026 19:04", "db": 40.47, "hz": 3203.1}, {"ts": "4/6/2026 19:04", "db": 64.5, "hz": 1601.6}, {"ts": "4/6/2026 19:04", "db": 37.94, "hz": 1855.5}, {"ts": "4/6/2026 19:04", "db": 37.43, "hz": 4062.5}, {"ts": "4/6/2026 19:04", "db": 36.57, "hz": 4140.6}, {"ts": "4/6/2026 19:04", "db": 36.7, "hz": 3867.2}, {"ts": "4/6/2026 19:04", "db": 36.48, "hz": 3085.9}, {"ts": "4/6/2026 19:04", "db": 36.1, "hz": 4296.9}, {"ts": "4/6/2026 19:04", "db": 36.69, "hz": 3320.3}, {"ts": "4/6/2026 19:04", "db": 38.85, "hz": 3769.5}, {"ts": "4/6/2026 19:04", "db": 38.01, "hz": 3339.8}, {"ts": "4/6/2026 19:04", "db": 40.28, "hz": 4648.4}, {"ts": "4/6/2026 19:04", "db": 36.78, "hz": 3964.8}, {"ts": "4/6/2026 19:04", "db": 38.18, "hz": 2636.7}, {"ts": "4/6/2026 19:04", "db": 36.54, "hz": 3886.7}, {"ts": "4/6/2026 19:04", "db": 35.6, "hz": 3476.6}, {"ts": "4/6/2026 19:04", "db": 40.11, "hz": 4121.1}, {"ts": "4/6/2026 19:04", "db": 43.41, "hz": 1953.1}, {"ts": "4/6/2026 19:04", "db": 36.39, "hz": 4140.6}, {"ts": "4/6/2026 19:04", "db": 35.39, "hz": 3476.6}, {"ts": "4/6/2026 19:04", "db": 36.5, "hz": 4511.7}, {"ts": "4/6/2026 19:04", "db": 37.14, "hz": 4062.5}, {"ts": "4/6/2026 19:04", "db": 39.94, "hz": 3652.3}, {"ts": "4/6/2026 19:04", "db": 35.66, "hz": 4121.1}, {"ts": "4/6/2026 19:04", "db": 37.95, "hz": 3593.8}, {"ts": "4/6/2026 19:04", "db": 37.87, "hz": 78.1}, {"ts": "4/6/2026 19:04", "db": 35.72, "hz": 4277.3}, {"ts": "4/6/2026 19:04", "db": 36.17, "hz": 4257.8}, {"ts": "4/6/2026 19:04", "db": 34.67, "hz": 4316.4}, {"ts": "4/6/2026 19:04", "db": 34.01, "hz": 4140.6}, {"ts": "4/6/2026 19:05", "db": 40.41, "hz": 2910.2}, {"ts": "4/6/2026 19:05", "db": 33.67, "hz": 4043.0}, {"ts": "4/6/2026 19:05", "db": 33.69, "hz": 4062.5}, {"ts": "4/6/2026 19:05", "db": 33.62, "hz": 3574.2}, {"ts": "4/6/2026 19:05", "db": 35.99, "hz": 4062.5}, {"ts": "4/6/2026 19:05", "db": 33.3, "hz": 4765.6}, {"ts": "4/6/2026 19:05", "db": 35.94, "hz": 3593.8}, {"ts": "4/6/2026 19:05", "db": 34.38, "hz": 4394.5}, {"ts": "4/6/2026 19:05", "db": 36.01, "hz": 4062.5}, {"ts": "4/6/2026 19:05", "db": 34.26, "hz": 4296.9}, {"ts": "4/6/2026 19:05", "db": 38.04, "hz": 3769.5}, {"ts": "4/6/2026 19:05", "db": 38.33, "hz": 3750.0}, {"ts": "4/6/2026 19:05", "db": 35.82, "hz": 3671.9}, {"ts": "4/6/2026 19:05", "db": 39.3, "hz": 2871.1}, {"ts": "4/6/2026 19:05", "db": 35.41, "hz": 3867.2}, {"ts": "4/6/2026 19:05", "db": 34.21, "hz": 4023.4}, {"ts": "4/6/2026 19:05", "db": 36.58, "hz": 4062.5}, {"ts": "4/6/2026 19:05", "db": 46.48, "hz": 1171.9}, {"ts": "4/6/2026 19:05", "db": 42.02, "hz": 3203.1}, {"ts": "4/6/2026 19:05", "db": 39.75, "hz": 2832.0}, {"ts": "4/6/2026 19:05", "db": 36.78, "hz": 2031.2}, {"ts": "4/6/2026 19:05", "db": 36.19, "hz": 3925.8}, {"ts": "4/6/2026 19:05", "db": 40.09, "hz": 3808.6}, {"ts": "4/6/2026 19:05", "db": 42.32, "hz": 2773.4}, {"ts": "4/6/2026 19:05", "db": 35.71, "hz": 4472.7}, {"ts": "4/6/2026 19:05", "db": 35.54, "hz": 4257.8}, {"ts": "4/6/2026 19:05", "db": 43.73, "hz": 1171.9}, {"ts": "4/6/2026 19:05", "db": 36.14, "hz": 4003.9}, {"ts": "4/6/2026 19:05", "db": 36.83, "hz": 4121.1}, {"ts": "4/6/2026 19:05", "db": 46.54, "hz": 1718.8}, {"ts": "4/6/2026 19:06", "db": 45.57, "hz": 2324.2}, {"ts": "4/6/2026 19:06", "db": 38.38, "hz": 3613.3}, {"ts": "4/6/2026 19:06", "db": 36.94, "hz": 4121.1}, {"ts": "4/6/2026 19:06", "db": 39.62, "hz": 3281.2}, {"ts": "4/6/2026 19:06", "db": 37.21, "hz": 4335.9}, {"ts": "4/6/2026 19:06", "db": 37.62, "hz": 3359.4}, {"ts": "4/6/2026 19:06", "db": 36.47, "hz": 4453.1}, {"ts": "4/6/2026 19:06", "db": 40.65, "hz": 3867.2}, {"ts": "4/6/2026 19:06", "db": 37.24, "hz": 4375.0}, {"ts": "4/6/2026 19:06", "db": 35.74, "hz": 1230.5}, {"ts": "4/6/2026 19:06", "db": 43.27, "hz": 2246.1}, {"ts": "4/6/2026 19:06", "db": 46.78, "hz": 1855.5}, {"ts": "4/6/2026 19:06", "db": 42.54, "hz": 1757.8}, {"ts": "4/6/2026 19:06", "db": 35.58, "hz": 3320.3}, {"ts": "4/6/2026 19:06", "db": 31.8, "hz": 3847.7}, {"ts": "4/6/2026 19:06", "db": 32.29, "hz": 2812.5}, {"ts": "4/6/2026 19:06", "db": 33.15, "hz": 3203.1}, {"ts": "4/6/2026 19:06", "db": 36.97, "hz": 2207.0}, {"ts": "4/6/2026 19:06", "db": 36.16, "hz": 1953.1}, {"ts": "4/6/2026 19:06", "db": 37.94, "hz": 2519.5}, {"ts": "4/6/2026 19:06", "db": 40.16, "hz": 4043.0}, {"ts": "4/6/2026 19:06", "db": 42.74, "hz": 1601.6}, {"ts": "4/6/2026 19:06", "db": 38.83, "hz": 2343.8}, {"ts": "4/6/2026 19:06", "db": 36.61, "hz": 3378.9}, {"ts": "4/6/2026 19:06", "db": 35.77, "hz": 3691.4}, {"ts": "4/6/2026 19:06", "db": 41.49, "hz": 1953.1}, {"ts": "4/6/2026 19:06", "db": 30.06, "hz": 3496.1}, {"ts": "4/6/2026 19:06", "db": 32.0, "hz": 4179.7}, {"ts": "4/6/2026 19:06", "db": 36.06, "hz": 2519.5}, {"ts": "4/6/2026 19:06", "db": 35.81, "hz": 4277.3}, {"ts": "4/6/2026 19:07", "db": 37.43, "hz": 3066.4}, {"ts": "4/6/2026 19:07", "db": 35.31, "hz": 3886.7}, {"ts": "4/6/2026 19:07", "db": 37.37, "hz": 4003.9}, {"ts": "4/6/2026 19:07", "db": 39.87, "hz": 2773.4}, {"ts": "4/6/2026 19:07", "db": 35.16, "hz": 2968.8}, {"ts": "4/6/2026 19:07", "db": 39.14, "hz": 3730.5}, {"ts": "4/6/2026 19:07", "db": 35.23, "hz": 3554.7}, {"ts": "4/6/2026 19:07", "db": 36.35, "hz": 3496.1}, {"ts": "4/6/2026 19:07", "db": 36.03, "hz": 3828.1}, {"ts": "4/6/2026 19:07", "db": 54.63, "hz": 2871.1}, {"ts": "4/6/2026 19:07", "db": 44.69, "hz": 2070.3}, {"ts": "4/6/2026 19:07", "db": 31.58, "hz": 2793.0}];

// Parse the raw strings into proper Date objects
const DEVICE1_ROWS = SOUND_LOG_RAW.map(r => ({
  ts: new Date(r.ts),
  db: r.db,
  hz: r.hz
}));

// ── App State ────────────────────────────────────────────────
const AppState = {
  selectedNodeId: 'N001',
  currentPage: 'overview',
  theme: 'dark',
  settings: {
    sampleRate: '44.1 kHz', bitDepth: '24-bit', channel: 'Mono',
    gain: 0, lowCut: 80, highCut: 20000,
    warnDb: 70, critDb: 85, spikeDetection: true,
    campusName: 'EcoEcho Research',
    mapLat: 43.0096, mapLng: -81.2737,
    scheduleMode: 'quickstart', activePreset: 'fullday', customBlocks: []
  },
  bluetooth: { connected: false, deviceName: null, signalStrength: 0, lastSync: null },
  recentExports: []
};

// ── 2 Devices ────────────────────────────────────────────────
const NODES = [
  {
    id: 'N001', name: 'Device 1',
    location: 'sound_log.xlsx · 300 readings',
    lat: 43.0103, lng: -81.2756,
    sensor: 'INMP441 MEMS Mic (I2S)', firmware: 'v2.3.1', uptime: '1d 0h',
    battery: 72, solar: 68, sdUsed: 35, sdTotal: 32,
    status: 'active', lastSeen: new Date(),
    timezone: 'America/Toronto', gps: '43.0103, -81.2756',
    notes: 'Real data from sound_log.xlsx upload.'
  },
  {
    id: 'N002', name: 'Device 2',
    location: 'Reference monitoring location',
    lat: 43.0082, lng: -81.2733,
    sensor: 'INMP441 MEMS Mic (I2S)', firmware: 'v2.3.1', uptime: '9d 11h',
    battery: 91, solar: 88, sdUsed: 22, sdTotal: 32,
    status: 'active', lastSeen: new Date(Date.now() - 12 * 60000),
    timezone: 'America/Toronto', gps: '43.0082, -81.2733',
    notes: 'Secondary device using simulated dataset.'
  }
];

const SENSOR_TYPES = [
  { name: 'INMP441 MEMS Mic (I2S)', rate: '44.1 kHz', bits: '24-bit', freq: '60Hz–15kHz', notes: 'Primary sensor. Digital I2S, high SNR.' },
  { name: 'Analog Electret (3.5mm)', rate: '16 kHz', bits: '12-bit', freq: '100Hz–8kHz', notes: 'Budget option.' },
  { name: 'USB Condenser', rate: '48 kHz', bits: '16-bit', freq: '20Hz–20kHz', notes: 'Highest quality.' }
];

// ── Simulated data for Device 2 ───────────────────────────────
function realisticDb(h, dow) {
  const we = dow === 0 || dow === 6;
  let b = 38;
  if (h >= 6  && h < 9)  b = we ? 42 : 58;
  if (h >= 9  && h < 12) b = we ? 48 : 66;
  if (h >= 12 && h < 14) b = we ? 52 : 72;
  if (h >= 14 && h < 17) b = we ? 50 : 64;
  if (h >= 17 && h < 20) b = we ? 55 : 60;
  if (h >= 20 || h < 6)  b = we ? 48 : 44;
  return Math.max(28, Math.min(95, b + (Math.random() - 0.5) * 14));
}
function realisticHz(h) {
  const base = h >= 7 && h < 20 ? 800 + h * 40 : 300;
  return Math.max(80, Math.round(base + (Math.random() - 0.5) * base * 0.4));
}

// ── Sessions ──────────────────────────────────────────────────
// Device 1: built from real DEVICE1_ROWS (grouped into hourly sessions)
// Device 2: simulated
let ALL_SESSIONS = [];

function buildDevice1Sessions() {
  // Group real rows by hour
  const byHour = {};
  DEVICE1_ROWS.forEach(r => {
    if (isNaN(r.ts)) return;
    const key = `${r.ts.getFullYear()}-${r.ts.getMonth()}-${r.ts.getDate()}-${r.ts.getHours()}`;
    if (!byHour[key]) byHour[key] = { ts: r.ts, rows: [] };
    byHour[key].rows.push(r);
  });

  const sessions = [];
  let idx = 0;
  Object.values(byHour).forEach(({ ts, rows }) => {
    const dbs = rows.map(r => r.db);
    const hzs = rows.map(r => r.hz);
    const avgDb  = dbs.reduce((a,b)=>a+b,0)/dbs.length;
    const avgHz  = hzs.reduce((a,b)=>a+b,0)/hzs.length;
    const peakDb = Math.max(...dbs);
    const peakHz = Math.max(...hzs);
    sessions.push({
      id: `N001-S${String(idx++).padStart(3,'0')}`,
      nodeId: 'N001',
      timestamp: ts,
      duration: `${rows.length} readings`,
      avgDb:  +avgDb.toFixed(2),
      peakDb: +peakDb.toFixed(2),
      avgHz:  +avgHz.toFixed(1),
      peakHz: +peakHz.toFixed(1),
      samples: rows.map((r, si) => ({ sampleNum: si+1, timestamp: r.ts, db: r.db, hz: r.hz, freqPeak: r.hz })),
      fileSize: `${(rows.length * 0.08).toFixed(1)} KB`,
      hasSpike: peakDb > AppState.settings.critDb,
      fromReal: true
    });
  });
  return sessions;
}

function buildDevice2Sessions() {
  const now = new Date();
  const times = [
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 0, 0),
  ];
  return times.map((t, i) => {
    const h = t.getHours(), dow = t.getDay();
    const avgDb = realisticDb(h, dow);
    const avgHz = realisticHz(h);
    const samples = Array.from({length:12}, (_, s) => {
      const db = Math.max(28, avgDb + (Math.random()-0.5)*10);
      const hz = Math.max(80, avgHz + (Math.random()-0.5)*avgHz*0.3);
      return { sampleNum:s+1, timestamp:new Date(t.getTime()+s*5*60000), db:+db.toFixed(2), hz:Math.round(hz), freqPeak:Math.round(hz) };
    });
    const dbs = samples.map(s=>s.db), hzs = samples.map(s=>s.hz);
    return {
      id: `N002-S${String(i).padStart(2,'0')}`,
      nodeId: 'N002',
      timestamp: t,
      duration: '1h 00m',
      avgDb:  +(dbs.reduce((a,b)=>a+b,0)/dbs.length).toFixed(2),
      peakDb: +Math.max(...dbs).toFixed(2),
      avgHz:  +Math.round(hzs.reduce((a,b)=>a+b,0)/hzs.length),
      peakHz: Math.round(Math.max(...hzs)),
      samples,
      fileSize: `${(Math.random()*25+8).toFixed(1)} MB`,
      hasSpike: Math.max(...dbs) > AppState.settings.critDb
    };
  });
}

function initData() {
  ALL_SESSIONS = [...buildDevice1Sessions(), ...buildDevice2Sessions()];
  ALL_SESSIONS.sort((a,b) => b.timestamp - a.timestamp);
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
    .slice(0, 15)
    .map(s => ({ timestamp: s.timestamp, nodeId: s.nodeId, db: s.peakDb, hz: s.peakHz, desc: `Spike to ${s.peakDb}dB · ${s.peakHz}Hz` }));
}

function getLiveDb(nodeId) {
  if (nodeId === 'N001') {
    const last = DEVICE1_ROWS[DEVICE1_ROWS.length - 1];
    return last ? +(last.db + (Math.random()-0.5)*1.5).toFixed(2) : 40;
  }
  return +realisticDb(new Date().getHours(), new Date().getDay()).toFixed(2);
}

function getLiveHz(nodeId) {
  if (nodeId === 'N001') {
    const last = DEVICE1_ROWS[DEVICE1_ROWS.length - 1];
    return last ? Math.round(last.hz + (Math.random()-0.5)*50) : 500;
  }
  return realisticHz(new Date().getHours());
}

function get24hHistory(nodeId) {
  if (nodeId === 'N001') {
    // Use real rows directly (they are all from today)
    return DEVICE1_ROWS.filter(r => !isNaN(r.ts)).map(r => ({ t: r.ts, db: r.db, hz: r.hz }));
  }
  const cutoff = new Date(Date.now() - 24*3600000);
  const pts = [];
  getNodeSessions(nodeId, cutoff).forEach(s => s.samples.forEach(sp => pts.push({ t:sp.timestamp, db:sp.db, hz:sp.hz||500 })));
  return pts.sort((a,b)=>a.t-b.t);
}

function getNdayHistory(nodeId, days) {
  const cutoff = new Date(Date.now() - days*86400000);
  const byDay = {};
  getNodeSessions(nodeId, cutoff).forEach(s => {
    const k = s.timestamp.toISOString().slice(0,10);
    if (!byDay[k]) byDay[k] = { dbs:[], hzs:[] };
    byDay[k].dbs.push(s.avgDb);
    byDay[k].hzs.push(s.avgHz || 500);
  });
  return Object.entries(byDay).map(([d,v])=>({
    t: new Date(d),
    db: v.dbs.reduce((a,b)=>a+b,0)/v.dbs.length,
    hz: v.hzs.reduce((a,b)=>a+b,0)/v.hzs.length
  })).sort((a,b)=>a.t-b.t);
}

function getHzSummary(nodeId) {
  const src = nodeId === 'N001' ? DEVICE1_ROWS.map(r=>r.hz) : getNodeSessions(nodeId).flatMap(s=>s.samples.map(sp=>sp.hz||500));
  if (!src.length) return {avg:null,peak:null,low:null};
  return {
    avg:  Math.round(src.reduce((a,b)=>a+b,0)/src.length),
    peak: Math.round(Math.max(...src)),
    low:  Math.round(Math.min(...src))
  };
}

function getFftData(nodeId) {
  const hzs = nodeId === 'N001' ? DEVICE1_ROWS.map(r=>r.hz) : getNodeSessions(nodeId).flatMap(s=>s.samples.map(sp=>sp.hz||500));
  const total = hzs.length || 1;
  const bands = [
    hzs.filter(h=>h<=60).length,
    hzs.filter(h=>h>60&&h<=250).length,
    hzs.filter(h=>h>250&&h<=500).length,
    hzs.filter(h=>h>500&&h<=2000).length,
    hzs.filter(h=>h>2000&&h<=4000).length,
    hzs.filter(h=>h>4000&&h<=6000).length,
    hzs.filter(h=>h>6000).length,
  ];
  return {
    labels: ['Sub-bass\n<60Hz','Bass\n60–250Hz','Low-mid\n250–500Hz','Mid\n500–2kHz','High-mid\n2–4kHz','Presence\n4–6kHz','Brilliance\n6kHz+'],
    values: bands.map(b => +(b/total*100).toFixed(1))
  };
}

function getHeatmapData(nodeId) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return days.map((day, d) => ({
    day,
    values: Array.from({length:24}, (_,h) => Math.round(realisticDb(h, d>=5?0:1)))
  }));
}

function getTrendData() {
  const result = {};
  NODES.forEach(n => { result[n.id] = getNdayHistory(n.id, 30); });
  return result;
}

// ── WAV Export ────────────────────────────────────────────────
async function exportWav(nodeId, msPerReading, onProgress) {
  const SAMPLE_RATE = 22050; // lower sample rate = smaller file
  let readings = [];
  if (nodeId === 'N001') {
    readings = DEVICE1_ROWS.map(r => ({ db: r.db, hz: r.hz }));
  } else {
    getNodeSessions(nodeId).forEach(s => s.samples.forEach(sp => readings.push({ db: sp.db, hz: sp.hz || 440 })));
  }
  if (!readings.length) return null;

  const samplesPerReading = Math.floor(SAMPLE_RATE * msPerReading / 1000);
  const totalSamples = readings.length * samplesPerReading;
  const pcm = new Int16Array(totalSamples);

  for (let ri = 0; ri < readings.length; ri++) {
    const { db, hz } = readings[ri];
    const amp = Math.max(0.02, Math.min(0.9, (db - 20) / 80 * 0.9));
    const freq = Math.max(20, Math.min(SAMPLE_RATE / 2 - 1, hz));
    const offset = ri * samplesPerReading;
    for (let si = 0; si < samplesPerReading; si++) {
      const fade = si < samplesPerReading * 0.05 ? si / (samplesPerReading * 0.05)
                 : si > samplesPerReading * 0.95 ? (samplesPerReading - si) / (samplesPerReading * 0.05)
                 : 1;
      pcm[offset + si] = Math.round(amp * fade * Math.sin(2 * Math.PI * freq * si / SAMPLE_RATE) * 32767);
    }
    if (ri % 20 === 0) {
      onProgress(ri / readings.length);
      await new Promise(r => setTimeout(r, 0));
    }
  }
  onProgress(1);
  return encodeWav(pcm, SAMPLE_RATE, 1);
}

function encodeWav(samples, sampleRate, channels) {
  const bps = 2, dataLen = samples.length * bps;
  const buf = new ArrayBuffer(44 + dataLen);
  const v = new DataView(buf);
  const ws = (o, s) => { for (let i=0;i<s.length;i++) v.setUint8(o+i, s.charCodeAt(i)); };
  ws(0,'RIFF'); v.setUint32(4,36+dataLen,true); ws(8,'WAVE');
  ws(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true);
  v.setUint16(22,channels,true); v.setUint32(24,sampleRate,true);
  v.setUint32(28,sampleRate*channels*bps,true); v.setUint16(32,channels*bps,true);
  v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,dataLen,true);
  new Int16Array(buf,44).set(samples);
  return buf;
}

// ── CSV Import (user can still upload additional data) ────────
function parseEcoCsv(text) {
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  if (lines.length < 2) return null;
  const rows = [];
  for (let i=1; i<lines.length; i++) {
    const parts = lines[i].split(',').map(p=>p.trim().replace(/^"|"$/g,''));
    if (parts.length < 2) continue;
    const ts=new Date(parts[0]), db=parseFloat(parts[1]), hz=parts[2]?parseFloat(parts[2]):500;
    if (isNaN(ts)||isNaN(db)) continue;
    rows.push({ ts, db:+db.toFixed(2), hz:isNaN(hz)?500:+hz.toFixed(1) });
  }
  return rows.length ? rows.sort((a,b)=>a.ts-b.ts) : null;
}

// ── Data Export ───────────────────────────────────────────────
function exportData(nodeIds, fromDate, toDate, includeRaw, format) {
  let sessions = ALL_SESSIONS.filter(s => {
    if (nodeIds.length && !nodeIds.includes(s.nodeId)) return false;
    if (fromDate && s.timestamp < fromDate) return false;
    if (toDate   && s.timestamp > toDate)   return false;
    return true;
  });

  let content, filename, mime;
  if (format === 'json') {
    content = JSON.stringify({ exportedAt: new Date().toISOString(), sessions: sessions.map(s => ({
      id:s.id, nodeId:s.nodeId, timestamp:s.timestamp.toISOString(),
      avgDb:s.avgDb, peakDb:s.peakDb, avgHz:s.avgHz, peakHz:s.peakHz, duration:s.duration,
      ...(includeRaw && s.samples ? { samples: s.samples.map(sp=>({n:sp.sampleNum,ts:sp.timestamp.toISOString(),db:sp.db,hz:sp.hz})) } : {})
    }))}, null, 2);
    filename = `ecoecho_export_${Date.now()}.json`; mime = 'application/json';
  } else {
    const rows = [['SessionID','NodeID','Timestamp','AvgDB','PeakDB','AvgHz','PeakHz','Duration','FileSize']];
    sessions.forEach(s => {
      rows.push([s.id,s.nodeId,s.timestamp.toISOString(),s.avgDb,s.peakDb,s.avgHz,s.peakHz,s.duration,s.fileSize]);
      if (includeRaw && s.samples) {
        rows.push(['--SAMPLES--','#','Time','dB','Hz','','','','']);
        s.samples.forEach(sp => rows.push(['',sp.sampleNum,sp.timestamp.toISOString(),sp.db,sp.hz,'','','','']));
      }
    });
    content = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    filename = `ecoecho_export_${Date.now()}.csv`; mime = 'text/csv';
  }
  const url = URL.createObjectURL(new Blob([content],{type:mime}));
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
  AppState.recentExports.unshift({ filename, date:new Date(), size:`${Math.round(content.length/1024)} KB`, url });
  return filename;
}

function exportConfig() {
  const cfg = {
    version:'1.0', exportedAt:new Date().toISOString(),
    settings:{ sampleRate:AppState.settings.sampleRate, bitDepth:AppState.settings.bitDepth },
    schedule:{ mode:AppState.settings.scheduleMode, activePreset:AppState.settings.activePreset, customBlocks:AppState.settings.customBlocks },
    alerts:{ warnDb:AppState.settings.warnDb, critDb:AppState.settings.critDb },
    note:'EcoEcho config — programs multiple recorders at once.'
  };
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'}));
  a.download=`ecoecho_config_${Date.now()}.json`; a.click();
}

// ── Helpers ───────────────────────────────────────────────────
function formatTime(d)     { return d instanceof Date && !isNaN(d) ? d.toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit'}) : '—'; }
function formatDate(d)     { return d instanceof Date && !isNaN(d) ? d.toLocaleDateString('en-CA',{month:'short',day:'numeric'}) : '—'; }
function formatDateTime(d) { return d instanceof Date && !isNaN(d) ? d.toLocaleString('en-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'; }
function timeAgo(d) {
  const diff = Date.now() - d;
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
}
function dbStatus(db) {
  if (db < 45) return { label:'QUIET',     color:'#7ab87a' };
  if (db < 60) return { label:'MODERATE',  color:'#8fb98f' };
  if (db < 75) return { label:'LOUD',      color:'#c9a85c' };
  return             { label:'VERY LOUD', color:'#c97a6a' };
}
function dbColor(db) {
  if (db < 45) return '#7ab87a';
  if (db < 60) return '#8fb98f';
  if (db < 70) return '#c9a85c';
  if (db < 80) return '#c98a5c';
  return '#c97a6a';
}
function hzColor(hz) {
  if (!hz)     return 'var(--text3)';
  if (hz < 500)  return '#8fb98f';
  if (hz < 2000) return '#b5c9a1';
  if (hz < 5000) return '#c9a85c';
  return '#c98a5c';
}
function presetLabel(p) {
  return {dawn:'Dawn Chorus',fullday:'Full Day',night:'Night Only',peak:'Peak Activity'}[p]||'Custom';
}
function nextRecordingTime() {
  const n=new Date(), nx=new Date(n); nx.setMinutes(0,0,0); nx.setHours(nx.getHours()+1);
  return formatTime(nx);
}
