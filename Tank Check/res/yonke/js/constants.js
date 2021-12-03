let APP_VERSION

function getShopLink() {
  const country = window.navigator.language.split('-')[1].toLowerCase()
  if (SHOP_URLS.hasOwnProperty(country)) {
    return SHOP_URLS[country]
  }
  return SHOP_URLS.default
}

// LINKS
const HELP_URL = 'http://www.yonkegas.com/index.php/help'
const SHOP_URL = 'http://www.yonkegas.com/index.php/order-online'
const SHOP_URLS = {
  default: 'http://www.yonkegas.com/index.php/order-online',
}

// BRANDING
const APP_TITLE = 'Yonke ✓'

// ENDPOINTS
const INFLUX_ENDPOINT = 'https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms'
