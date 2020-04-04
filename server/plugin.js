const pg = require('pg')
const SQL = require('sql-template-strings')
const zlib = require('zlib')

let pgPool

class StatusError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

module.exports = function({layers, pgConfig}) {
  function initialize(server, callback) {
    pgPool = new pg.Pool(pgConfig)
    pgPool.on('error', (err, client) => {
      console.error(`Postgres error: `, err.message)
    })
    callback(null)
  }

  function createLayerQuery({layer, table, extent, fields, tile, buffer, filter, minZoom = 0, maxZoom = 19, simplify, clip = true}) {
    if (tile.z < minZoom || tile.z >= maxZoom) {
      return null
    }
    const extentAsNumber = typeof extent === 'number' ? extent : extent(tile.z)
    const simplifyParams = simplify && simplify(tile.z)
    const selectWithSimplify = simplifyParams ? `ST_RemoveRepeatedPoints(ST_Simplify(b.geom, ${simplifyParams.tolerance}, ${simplifyParams.preserveCollapsed})) geom` : 'geom'
    const fieldsAsString = (fields && fields.length) ? `, ${fields.join(', ')}` : ''
    const filterString = filter && (typeof filter === 'string' ? filter : filter(tile))

    return `
      (
        SELECT
          ST_AsMVT(q, '${layer}', ${extentAsNumber}, 'geom') AS tile
          FROM (
            SELECT ${selectWithSimplify} ${fieldsAsString}
            FROM (
              WITH a AS (
                SELECT ST_AsMVTGeom(
                  ST_Transform(${table}.wkb_geometry, 3857),
                  ST_TileEnvelope(${tile.z}, ${tile.x}, ${tile.y}),
                  ${extentAsNumber},
                  ${buffer},
                  ${clip}) geom ${fieldsAsString}
                FROM ${table}
                WHERE ${filterString || ''} ${filterString ? 'AND' : ''}
                ST_Intersects(${table}.wkb_geometry, ST_Transform(ST_TileEnvelope(${tile.z}, ${tile.x}, ${tile.y}), 4326))
              )
              SELECT * FROM a WHERE geom IS NOT NULL
            ) AS b
          ) AS q
      )`
  }

  function serve(server, tile, callback) {
    const query = layers
      .map(data => createLayerQuery({...data, tile}))
      .filter(q => Boolean(q))
      .join(' UNION ')

    pgPool.query(query, (err, result) => {
      if (err) {
        console.log(`Postgres error: `, query, err.message)
        return callback(new StatusError(500, 'Query error'))
      }
      if (!result.rows || result.rows.length === 0 || !result.rows[0].tile) {
        return callback(new StatusError(204, 'Empty tile'))
      }
      const data = Buffer.concat(result.rows.map(row => row.tile))
      zlib.gzip(data, (err, result) => {
        if (!err) {
          callback(null, result, {'Content-Type': 'application/x-protobuf', 'Content-Encoding': 'gzip'})
        }
      })
    })
  }

  return {
    name: 'plugin',
    init: initialize,
    serve: serve
  }
}