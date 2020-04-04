const TY_JNR = {
  '1': 'Merimajakka',
  '2': 'Sektoriloisto',
  '3': 'Linjamerkki',
  '4': 'Suuntaloisto',
  '5': 'Apuloisto',
  '6': 'Muu',
  '7': 'Reunamerkki',
  '8': 'Tutkamerkki',
  '9': 'Poiju',
  '10': 'Viitta',
  '11': 'Tunnusmajakka',
  '13': 'Kummeli'
}
const NAVL_TYYP = {
  '0': 'Tuntematon',
  '1': 'Vasen',
  '2': 'Oikea',
  '3': 'Pohjois',
  '4': 'Etela',
  '5': 'Lansi',
  '6': 'Itä',
  '7': 'Karimerkki',
  '8': 'Turvavesimerkki',
  '9': 'Erikoismerkki'
}

const RAKT_TYYP = {
  '6': 'Fasadivalo',
  '7': 'Levykummeli',
  '9': 'Radiomasto',
  '15': 'Reunakummeli',
  '17': 'Rajamerkki',
  '18': 'Rajalinjamerkki'
}

const kohdeluokkaToType = {
  // paikannimi
  48112: 'kunta',
  48111: 'kaupunki',
  48120: 'kyla',
  36490: 'muu-vesisto',
  35070: 'saari',
  35060: 'niemi',
  16101: 'turvalaite',
  // hylky
  16721: 'hylky-syvyys-tuntematon',
  16722: 'hylky-syvyys-tunnettu',
  16712: 'hylky-pinnalla',
}

module.exports = {
  TY_JNR,
  NAVL_TYYP,
  RAKT_TYYP,
  kohdeluokkaToType
}