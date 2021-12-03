let APP_VERSION

function getShopLink() {
  const country = window.navigator.language.split('-')[1].toLowerCase()
  if (SHOP_URLS.hasOwnProperty(country)) {
    return SHOP_URLS[country]
  }
  return SHOP_URLS.default
}

// LINKS
const HELP_URL = 'https://teambmpro.com/wp-content/uploads/191111_D-SmartSense.pdf'
const SHOP_URL = 'https://teambmpro.com/products/lpg-gas-level-monitor-smartsense'
const SHOP_URLS = {
  default: 'https://teambmpro.com/products/lpg-gas-level-monitor-smartsense',
}

// BRANDING
const APP_TITLE = 'SmartSense'

// ENDPOINTS
const INFLUX_ENDPOINT = 'https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms'
