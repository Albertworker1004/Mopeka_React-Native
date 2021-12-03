let APP_VERSION

function getShopLink() {
  const country = window.navigator.language.split('-')[1].toLowerCase()
  if (SHOP_URLS.hasOwnProperty(country)) {
    return SHOP_URLS[country]
  }
  return SHOP_URLS.default
}

// LINKS
const HELP_URL = 'https://www.coastrv.com.au/bottlecheck'
const SHOP_URL = 'https://www.lci1.com/'
const SHOP_URLS = {
  default: 'https://www.lci1.com/',
  au: 'https://www.coastrv.com.au/stockists',
}

// BRANDING
const APP_TITLE = 'Lippert ✓'

// ENDPOINTS
const INFLUX_ENDPOINT = 'https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms'
