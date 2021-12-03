let APP_VERSION

function getShopLink() {
  const country = window.navigator.language.split('-')[1].toLowerCase()
  if (SHOP_URLS.hasOwnProperty(country)) {
    return SHOP_URLS[country]
  }
  return SHOP_URLS.default
}

// LINKS
const HELP_URL = 'https://vertrax.com/tank-monitoring/'
const SHOP_URL = 'https://vertrax.com/tank-monitoring/'
const SHOP_URLS = {
  defualt: 'https://vertrax.com/tank-monitoring/',
}

// BRANDING
const APP_TITLE = 'Vertrax ✓'

// ENDPOINTS
const INFLUX_ENDPOINT = 'https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms'
