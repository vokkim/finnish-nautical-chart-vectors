const express = require('express')
const path = require('path')
const tilestrata = require('tilestrata')
const tilestrataPlugin = require('./plugin')
const layers = require('./layers')

const port = parseInt(process.env.PORT || 3000)

const app = express()
const strata = tilestrata()

strata.layer('mylayer').route('tile.mvt')
  .use(tilestrataPlugin({
    layers,
    pgConfig: {
      host: 'localhost',
      user: 'postgres',
      database: 'merikartta',
      port: '5432'
    }
  }))

app.use(tilestrata.middleware({
  server: strata,
  prefix: '/map'
}))

app.use('/glyphs/*', express.static(path.join(__dirname, '../assets/glyphs.pbf')))
app.use('/assets', express.static(path.join(__dirname, '../assets')))
app.use('/', express.static(path.join(__dirname, '../dist')))

app.listen(port, () => {
  console.log(`App listening on port http://localhost:${port}/`)
})
