#!/usr/bin/env node
/**
 * pnpm geo:build [path/to/ne_50m_admin_1_states_provinces.geojson]
 *
 * Builds public/geo/ru-regions.topo.json from Natural Earth 50m admin-1 (public domain,
 * https://www.naturalearthdata.com/): Russian federal subjects, simplified and quantized so the
 * file stays small. Properties kept: code (ISO 3166-2), name (Russian), name_en.
 * The source file is downloaded when no path is given.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { presimplify, quantile, simplify } from 'topojson-simplify';
import { topology } from 'topojson-server';

const SRC_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson';
const src = process.argv[2];

async function load() {
  if (src && existsSync(src)) return JSON.parse(readFileSync(src, 'utf8'));
  console.log(`downloading ${SRC_URL}`);
  const res = await fetch(SRC_URL);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  return res.json();
}

const geo = await load();
const features = geo.features
  .filter((f) => f.properties.iso_a2 === 'RU' && f.properties.iso_3166_2)
  .map((f) => ({ type: 'Feature', geometry: f.geometry, properties: { code: f.properties.iso_3166_2, name: f.properties.name_local || f.properties.name_ru || f.properties.name, name_en: f.properties.name } }));

let topo = topology({ regions: { type: 'FeatureCollection', features } }, 1e4);
topo = presimplify(topo);
topo = simplify(topo, quantile(topo, 0.35));
const out = resolve('public/geo/ru-regions.topo.json');
mkdirSync(resolve('public/geo'), { recursive: true });
writeFileSync(out, JSON.stringify(topo));
console.log(`wrote ${out}: ${features.length} regions, ${(Buffer.byteLength(JSON.stringify(topo)) / 1024).toFixed(0)} KB`);
