#!/usr/bin/env node

/*
  Convert selected Väylä navigational data CSV files into GeoJSON.
*/

const Papa = require('papaparse')
const fs = require('fs')
const path = require('path')
const GeoJSON = require('geojson')
const { Transform } = require('stream')

const {
  TY_JNR,
  NAVL_TYYP,
  RAKT_TYYP
} = require('./enums')

const DATA_BASE_PATH = path.resolve(path.join(__dirname, '../data/'))

const datasets = [
  {
    propsToCopy: ['DEPTH', 'QUASOU'],
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
    propsToCopy: ['DRVAL1', 'DRVAL2'],
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

function createGeoJSONString(row) {
  return JSON.stringify(GeoJSON.parse(row, {
    Point: ['lat', 'lon'],
    LineString: 'line',
    MultiLineString: 'multiLine',
    Polygon: 'polygon',
    MultiPolygon: 'multiPolygon'
  }))
}

function generator(dataset) {
  function mapRow(row) {
    let resultRow = {}

    // The column name depends on if the dataset is from vayla.fi (SHAPE) or traficom.fi (GEOM)
    let shape_row = (row.SHAPE === undefined) ? row.GEOM : row.SHAPE

    try {
      if (shape_row.indexOf('POINT') === 0) {
        const latlon = shape_row.substring(7, shape_row.length-1).split(' ').map(Number)
        resultRow.lat = latlon[0]
        resultRow.lon = latlon[1]
      } else if (shape_row.indexOf('LINESTRING') === 0) {
        resultRow.line = flipLineStringValues(JSON.parse(
          shape_row
            .substring(11, shape_row.length)
            .replace(/\(/g, '[[')
            .replace(/\)/g, ']]')
            .replace(/,\s/g, '],[')
            .replace(/\s/g, ',')
        ))
      } else if (shape_row.indexOf('MULTILINESTRING') === 0) {
        resultRow.multiLine = JSON.parse(
          shape_row
            .substring(16, shape_row.length)
            .replace(/\)\, \(/g, ']],[[')
            .replace(/\(\(/g, '[[[')
            .replace(/\)\)/g, ']]]')
            .replace(/,\s/g, '],[')
            .replace(/\s/g, ',')
        ).map(flipLineStringValues)
      } else if (shape_row.indexOf('MULTIPOLYGON') === 0) {
          resultRow.multiPolygon = JSON.parse(
            shape_row
              .substring(13, shape_row.length)
              .replace(/\)\)\, \(\(/g, ']]],[[[')
              .replace(/\)\, \(/g, ']],[[')
              .replace(/\(\(\(/g, '[[[[')
              .replace(/\)\)\)/g, ']]]]')
              .replace(/,\s/g, '],[')
              .replace(/\s/g, ',')
          ).map(flipPolygonValues)
      } else if (shape_row.indexOf('POLYGON') === 0) {
          resultRow.polygon = flipPolygonValues(JSON.parse(
            shape_row
              .substring(8, shape_row.length)
              .replace(/\(\(/g, '[[[')
              .replace(/\)\)/g, ']]]')
              .replace(/,\s/g, '],[')
              .replace(/\s/g, ',')
              .replace(/\)/g, ']') // Dirty patch for something like:  24.090503100010555)],[(62.0311209
              .replace(/\(/g, '[')
          ))
      }
    } catch(e) {
      console.error(e)
      console.log('SHAPE:', shape_row, 'in:', dataset.input)
      return
    }
    if (typeof dataset.propsToCopy === 'function') {
      resultRow = {...resultRow, ...dataset.propsToCopy(row)}
    } else {
      dataset.propsToCopy.forEach(propKey => {
        resultRow[propKey] = row[propKey]
      })
    }
    return resultRow
  }

  function flipPolygonValues(polygonArray) {
    return polygonArray.map(flipLineStringValues)
  }

  function flipLineStringValues(lineStringArray) {
    return lineStringArray.map(values => ([values[1], values[0]]))
  }

  function run() {
    console.log(`Processing ${dataset.input}`)
    let count = 0
    let lastPrint = Date.now()
    const readStream = fs.createReadStream(path.join(DATA_BASE_PATH, dataset.input))
      .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, {header: true}))
      .pipe(new Transform({
        objectMode: true,
        transform(row, encoding, callback) {
          if (dataset.filter && !dataset.filter(row)) {
            callback(null, '')
          } else {
            if (count % 10000 === 0 && count > 0) {
              console.log(`${dataset.input}: processing row ${count}`)
              console.log('took', Date.now() - lastPrint, 'ms')
              lastPrint = Date.now()
            }
            callback(null, (count > 0 ? ',' : '') + createGeoJSONString(mapRow(row)))
            count += 1
          }
        }
      }))
    const outputStream = fs.createWriteStream(path.join(DATA_BASE_PATH, dataset.output))
    outputStream.write('{"type":"FeatureCollection","features":[')
    readStream.pipe(outputStream, {end: false})
    readStream.on('end', () => {
      outputStream.end(']}')
      console.log(`${dataset.input}: parsed total ${count} rows`)
      console.log(`${dataset.input}: finished ${dataset.output}!`)
    })
  }

  return run
}

datasets.map(generator).forEach(run => run())
