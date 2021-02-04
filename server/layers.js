// Return values from range [min, max] depending on tile zoom level.
// Return 0 if tile zoom level is maxZoom or greater.
function linearTolerance(maxZoom, min, max) {
  return (z) => z < maxZoom ? Math.round(Math.max(0, maxZoom - z) * (Math.abs(max - min) / maxZoom)) : 0
}

const syvyyskayraTolerance = linearTolerance(12, 10, 50)

const simplify = (toleranceFn) => (z) => {
  const tolerance = toleranceFn(z)
  if (tolerance === 0) {
    return null
  }
  return {tolerance, preserveCollapsed: false}
}

const layers = [
  {
    layer: 'syvyysalueet',
    table: 'syvyysalueet',
    extent: 4096,
    fields: ['typedepr', 'water'],
    buffer: 256,
    minZoom: 6
  },
  {
    layer: 'syvyysalueet',
    table: 'syvyysalueet_lowres',
    extent: 1024,
    fields: ["'white' AS water"],
    buffer: 128,
    minZoom: 1,
    maxZoom: 6
  },
  {
    layer: 'syvyyskayra10m',
    table: 'syvyyskayra',
    extent: 4096,
    fields: ['valdco::int'],
    buffer: 30,
    minZoom: 10,
    filter: 'valdco::int > 6',
    simplify: simplify(syvyyskayraTolerance)
  },
  {
    layer: 'syvyyskayra5m',
    table: 'syvyyskayra',
    extent: 4096,
    fields: ['valdco::int'],
    buffer: 30,
    filter: 'valdco::int = 6',
    minZoom: 11,
    simplify: simplify(syvyyskayraTolerance)
  },
  {
    layer: 'syvyyskayra3m',
    table: 'syvyyskayra',
    extent: 4096,
    fields: ['valdco::int'],
    buffer: 30,
    filter: 'valdco::int < 6',
    minZoom: 11,
    simplify: simplify(syvyyskayraTolerance)
  },
  {
    layer: 'paikannimi',
    table: 'paikannimi',
    extent: 256,
    fields: ['teksti_fin', 'teksti_swe', 'kirjasinkoko::int'],
    filter: 'kirjasinkoko::int > 330',
    buffer: 10,
    minZoom: 6,
    maxZoom: 9
  },
  {
    layer: 'paikannimi',
    table: 'paikannimi',
    extent: 256,
    fields: ['teksti_fin', 'teksti_swe', 'kirjasinkoko::int'],
    filter: 'kirjasinkoko::int > 295',
    buffer: 10,
    minZoom: 9,
    maxZoom: 10
  },
  {
    layer: 'paikannimi',
    table: 'paikannimi',
    extent: 256,
    fields: ['teksti_fin', 'teksti_swe', 'kirjasinkoko::int'],
    filter: 'kirjasinkoko::int > 200',
    buffer: 10,
    minZoom: 10,
    maxZoom: 12
  },
  {
    layer: 'paikannimi',
    table: 'paikannimi',
    extent: 1024,
    fields: ['teksti_fin', 'teksti_swe', 'kirjasinkoko::int'],
    buffer: 256,
    minZoom: 12,
    clip: false
  },
  {
    layer: 'syvyyspiste',
    table: 'syvyyspiste',
    extent: 1024,
    fields: ['depth::float', 'typesound::int'],
    buffer: 30,
    minZoom: 13
  },
  {
    layer: 'taululinja',
    table: 'taululinja',
    extent: 256,
    fields: ['suunta::float'],
    buffer: 10,
    minZoom: 10
  },
  {
    layer: 'vaylat-veneilyn-runkovayla',
    table: 'vaylat',
    extent: 1024,
    fields: ['kulkusyv1'],
    filter: "vayla_lk = 'VL4: Veneilyn runkoväylä'",
    buffer: 64,
    minZoom: 3
  },
  {
    layer: 'vaylat-primary',
    table: 'vaylat',
    extent: 1024,
    fields: ['kulkusyv1'],
    filter: "vayla_lk = ANY('{VL1: Kauppamerenkulun pääväylä, VL2: Kauppamerenkulun 2-lk väylä}'::varchar[])",
    buffer: 64,
    minZoom: 1
  },
  {
    layer: 'vaylat-secondary',
    table: 'vaylat',
    extent: 1024,
    fields: ['kulkusyv1'],
    filter: "vayla_lk = ANY('{VL4: Veneilyn runkoväylä, VL3: Hyötyliikenteen matalaväylä, VL5: Paikallisveneväylä}'::varchar[])",
    buffer: 64,
    minZoom: 3
  },
  {
    layer: 'vaylat-dashed',
    table: 'vaylat',
    extent: 1024,
    fields: ['kulkusyv1'],
    filter: "vayla_lk = 'VL6: Venereitti'",
    buffer: 64,
    minZoom: 8
  },
  {
    layer: 'vaylaalueet',
    table: 'vaylaalueet',
    extent: 1024,
    fields: [],
    filter: "vayalue_sy != '' AND vayalue_sy::numeric >= 9",
    buffer: 10,
    minZoom: 8
  },
  {
    layer: 'vesikivi',
    table: 'vesikivi',
    extent: 4096,
    fields: ['kohdeluokka'],
    buffer: 30,
    minZoom: 11
  },
  {
    layer: 'hylky',
    table: 'hylky',
    extent: 512,
    fields: ['type', 'teksti'],
    buffer: 10,
    minZoom: 12
  },
  {
    layer: 'rantarakenteet',
    table: 'rantarakenteet',
    extent: 4096,
    fields: [],
    buffer: 10,
    minZoom: 12
  },
  {
    layer: 'masto',
    table: 'masto',
    extent: 256,
    fields: [],
    buffer: 10,
    minZoom: 11
  },
  {
    layer: 'ankkuripaikka',
    table: 'ankkuripaikka',
    extent: 256,
    fields: [],
    buffer: 10,
    minZoom: 11
  },
  {
    layer: 'turvalaitteet',
    table: 'turvalaitteet',
    extent: 4096,
    fields: ['type'],
    buffer: 10,
    minZoom: 10
  },
  {
    layer: 'maa',
    table: 'background',
    extent: 256,
    fields: [],
    buffer: 0,
    minZoom: 6
  },
  {
    layer: 'maa',
    table: 'ground_area',
    extent: 256,
    fields: [],
    buffer: 0,
    minZoom: 1,
    maxZoom: 6
  }
]
module.exports = layers
