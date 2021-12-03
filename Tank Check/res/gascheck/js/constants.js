let APP_VERSION

function getShopLink() {
  const country = window.navigator.language.split('-')[1].toLowerCase()
  if (SHOP_URLS.hasOwnProperty(country)) {
    return SHOP_URLS[country]
  }
  return SHOP_URLS.default
}

// LINKS
const HELP_URL = 'http://gasnow.cl'
const SHOP_URL = 'http://gasnow.cl/#comprar'
const SHOP_URLS = {
  default: 'http://gasnow.cl/#comprar',
}

// BRANDING
const APP_TITLE = 'Gas ✓'

// ENDPOINTS
const INFLUX_ENDPOINT = 'https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms'
