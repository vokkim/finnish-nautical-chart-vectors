#!/usr/bin/env node

/*
  Convert selected Väylä navigational data CSV files into GeoJSON.
*/

const csv = require('fast-csv')
const fs = require('fs')
const path = require('path')
const GeoJSON = require('geojson')
const {
  TY_JNR,
  NAVL_TYYP,
  RAKT_TYYP
} = require('./enums')

const DATA_BASE_PATH = path.resolve(path.join(__dirname, '../data/'))

const datasets = [
  {
    propsToCopy: ['DEPTH', 'TYPESOUND'],
    input: 'syvyyspiste.csv',
    output: 'syvyyspiste.geojson'
  },
  {
    propsToCopy: ['VAYLA_LK', 'KULKUSYV1'],
    input: 'vaylat.csv',
    output: 'vaylat.geojson'
  },
  {
    propsToCopy: ['VAYALUE_SY'],
    input: 'vaylaalueet.csv',
    output: 'vaylaalueet.geojson'
  },
  {
    propsToCopy: composeTurvalaitteetProps,
    input: 'turvalaitteet.csv',
    output: 'turvalaitteet.geojson'
  },
  {
    propsToCopy: ['VALDCO'],
    input: 'syvyyskayra.csv',
    output: 'syvyyskayra.geojson'
  },
  {
    propsToCopy: ['TYPEDEPR', 'MAXDEPTH'],
    input: 'syvyysalue.csv',
    output: 'syvyysalue.geojson'
  },
  {
    propsToCopy: ['SUUNTA', 'NAVLINJAT', 'GDO_GID'],
    input: 'taululinja.csv',
    output: 'taululinja.geojson'
  },
  {
    propsToCopy: ['FID','NAVLIN_TY','NAVLIN_SYV','NAVLIN_HAR','VERT_TASO','SADE','TOSISUUNTA','SUUNTA','GDO_GID','PITUUS','VAYLAT'],
    input: 'navigointilinjat.csv',
    output: 'navigointilinjat.geojson',
    filter: (row) => ['1', '2', '3'].includes(row.NAVLIN_TY)
  },
  {
    propsToCopy: [],
    input: 'rantarakenteet.csv',
    output: 'rantarakenteet.geojson'
  }
]

function composeTurvalaitteetProps(value) {
  const type = TY_JNR[value.TY_JNR] || ''
  const naviType = NAVL_TYYP[value.NAVL_TYYP] || ''
  const subtype = value.SUBTYPE
  const buildingType = RAKT_TYYP[value.RAKT_TYYP] || ''
  const light = value.VALAISTU === 'K' ? 'Valaistu' : ''
  return {type: [type, naviType, buildingType, subtype, light].join('-')}
}

function createGeoJSON(dataset, rows) {
  const result = GeoJSON.parse(rows, {
    Point: ['lat', 'lon'],
    LineString: 'line',
    MultiLineString: 'multiLine',
    Polygon: 'polygon',
    MultiPolygon: 'multiPolygon'
  })
  fs.writeFileSync(path.join(DATA_BASE_PATH, dataset.output), JSON.stringify(result))
  console.log(`${dataset.input}: finished ${dataset.output}!`)
}

function generator(dataset) {
  // Ugly mutate
  let rows = []

  function addRow(row) {
    let resultRow = {}
    if (rows.length % 10000 === 0 && rows.length > 0) {
      console.log(`${dataset.input}: processing row ${rows.length}`)
    }
    if (dataset.filter && !dataset.filter(row)) {
      return
    }
    try {
      if (row.SHAPE.indexOf('POINT') === 0) {
        const latlon = row.SHAPE.substring(7, row.SHAPE.length-1).split(' ').map(Number)
        resultRow.lat = latlon[0]
        resultRow.lon = latlon[1]
      } else if (row.SHAPE.indexOf('LINESTRING') === 0) {
        resultRow.line = flipLineStringValues(JSON.parse(
          row.SHAPE
            .substring(11, row.SHAPE.length)
            .replace(/\(/g, '[[')
            .replace(/\)/g, ']]')
            .replace(/,\s/g, '],[')
            .replace(/\s/g, ',')
        ))
      } else if (row.SHAPE.indexOf('MULTILINESTRING') === 0) {
        resultRow.multiLine = JSON.parse(
          row.SHAPE
            .substring(16, row.SHAPE.length)
            .replace(/\)\, \(/g, ']],[[')
            .replace(/\(\(/g, '[[[')
            .replace(/\)\)/g, ']]]')
            .replace(/,\s/g, '],[')
            .replace(/\s/g, ',')
        ).map(flipLineStringValues)
      } else if (row.SHAPE.indexOf('MULTIPOLYGON') === 0) {
          resultRow.multiPolygon = JSON.parse(
            row.SHAPE
              .substring(13, row.SHAPE.length)
              .replace(/\)\)\, \(\(/g, ']]],[[[')
              .replace(/\)\, \(/g, ']],[[')
              .replace(/\(\(\(/g, '[[[[')
              .replace(/\)\)\)/g, ']]]]')
              .replace(/,\s/g, '],[')
              .replace(/\s/g, ',')
          ).map(flipPolygonValues)
      } else if (row.SHAPE.indexOf('POLYGON') === 0) {
          resultRow.polygon = flipPolygonValues(JSON.parse(
            row.SHAPE
              .substring(8, row.SHAPE.length)
              .replace(/\(\(/g, '[[[')
              .replace(/\)\)/g, ']]]')
              .replace(/,\s/g, '],[')
              .replace(/\s/g, ',')
          ))
      }
    } catch(e) {
      console.error(e)
      console.log('SHAPE:', row.SHAPE)
      return
    }
    if (typeof dataset.propsToCopy === 'function') {
      resultRow = {...resultRow, ...dataset.propsToCopy(row)}
    } else {
      dataset.propsToCopy.forEach(propKey => {
        resultRow[propKey] = row[propKey]
      })
    }
    rows.push(resultRow)
  }

  function flipPolygonValues(polygonArray) {
    return polygonArray.map(flipLineStringValues)
  }

  function flipLineStringValues(lineStringArray) {
    return lineStringArray.map(values => ([values[1], values[0]]))
  }

  function run() {
    console.log(`Processing ${dataset.input}`)
    fs.createReadStream(path.join(DATA_BASE_PATH, dataset.input))
      .pipe(csv.parse({ headers: true }))
      .on('error', error => console.error(error))
      .on('data', row => {
        addRow(row, dataset)
      })
      .on('end', rowCount => {
        console.log(`${dataset.input}: parsed total ${rowCount} rows`)
        createGeoJSON(dataset, rows)
      })
  }

  return run
}

datasets.map(generator).forEach(run => run())
