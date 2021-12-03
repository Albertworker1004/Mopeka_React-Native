let APP_VERSION

function getShopLink() {
  const country = window.navigator.language.split('-')[1].toLowerCase()
  if (SHOP_URLS.hasOwnProperty(country)) {
    return SHOP_URLS[country]
  }
  return SHOP_URLS.default
}

// LINKS
const HELP_URL = 'https://mopeka.com/instruction/'
const SHOP_URL = 'https://mopeka.com/shop/'
const SHOP_URLS = {
  default: 'https://mopeka.com/shop/',
}

// BRANDING
const APP_TITLE = 'Tankcheck ✓'

// ENDPOINTS
const INFLUX_ENDPOINT = 'https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms'
