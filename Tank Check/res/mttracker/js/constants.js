let APP_VERSION

function getShopLink() {
  const country = window.navigator.language.split('-')[1].toLowerCase()
  if (SHOP_URLS.hasOwnProperty(country)) {
    return SHOP_URLS[country]
  }
  return SHOP_URLS.default
}

// LINKS
const HELP_URL = 'https://www.boc.com.au/shop/en/au/boc-mt-tracker-bbq-gasm1001354-p'
const SHOP_URL = 'https://www.boc.com.au/shop/en/au/mt-tracker-bbq'
const SHOP_URLS = {
  defualt: 'https://www.boc.com.au/shop/en/au/mt-tracker-bbq',
}

// BRANDING
const APP_TITLE = 'MT Tracker BBQ'

// ENDPOINTS
const INFLUX_ENDPOINT = 'https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms'
