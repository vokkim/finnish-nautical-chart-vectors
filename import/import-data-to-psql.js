#!/usr/bin/env node

const path = require('path')
const shell = require('shelljs')

const dbConfig = {
  db: 'merikartta',
  user: 'postgres'
}

const dataPath = path.resolve(__dirname, '../data')

const data = [
  ['background', 'ground-area-background.geojson'],
  ['ground_area', 'visible-ground-area-lowres.geojson'],
  ['syvyysalueet', 'syvyysalueet-dissolved-white.geojson'],
  ['syvyysalueet', 'syvyysalueet-dissolved-blue.geojson'],
  ['syvyysalueet_lowres', 'syvyysalueet-simplified.geojson'],
  ['syvyyskayra', 'syvyyskayra.geojson'],
  ['paikannimi', 'paikannimi-clipped.geojson'],
  ['syvyyspiste', 'syvyyspiste.geojson'],
  ['taululinja', 'taululinja_cleaned.geojson'],
  ['vaylat', 'vaylat.geojson'],
  ['vaylaalueet', 'vaylaalueet.geojson'],
  ['vesikivi', 'vesikivi-clipped.geojson'],
  ['ankkuripaikka', 'ankkuripaikka.geojson'],
  ['hylky', 'hylky.geojson'],
  ['rantarakenteet', 'rantarakenteet.geojson'],
  ['turvalaitteet', 'turvalaitteet.geojson']
]

for (const [table, file] of data) {
  console.log(`Importing "${file}" into table "${table}"`)
  shell.exec(`docker run --network host --env OGR_GEOJSON_MAX_OBJ_SIZE=1000 --rm -v ${dataPath}:/data osgeo/gdal:alpine-normal-latest ogr2ogr -f "PostgreSQL" PG:"host=host.docker.internal dbname=${dbConfig.db} user=${dbConfig.user}" "/data/${file}" -nln ${table}`)
}

console.log('Done!')
