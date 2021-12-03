#!/usr/bin/env node

/*jshint esnext: true */
var fs = require('fs-extra'),
  path = require('path'),
  rootDir = process.argv[2],
  platformPath = path.join(rootDir, 'platforms'),
  platform = process.env.CORDOVA_PLATFORMS,
  cliCommand = process.env.CORDOVA_CMDLINE,
  debug = false

console.log('before_prepare script')

function replaceInFiles(files, regexp, rep) {
  function proc(file) {
    var data = fs.readFileSync(file, 'utf8')
    var result = data.replace(regexp, rep)
    if (result !== data) {
      fs.writeFileSync(file, result, 'utf8')
    }
  }

  if (Array.isArray(files)) {
    files.forEach(proc)
  } else {
    proc(files)
  }
}

switch (platform) {
  case 'android':
    platformPath = path.join(platformPath, platform, 'assets', 'www')
    break
  case 'ios':
    platformPath = path.join(platformPath, platform, 'www')
    break
  default:
    console.error('Hook currently supports only Android and iOS')
    return
}

var shops = [
  'http://mopeka.com/shop/',
  'https://www.boc.com.au/shop/en/au/boc-mt-tracker-bbq-gasm1001354-p',
  'http://gasnow.cl/#comprar',
  'http://www.yonkegas.com/index.php/order-online',
  'https://vertrax.com/tank-monitoring/',
  'https://teambmpro.com/products/lpg-gas-level-monitor-smartsense',
  'https://www.lci1.com/',
  'http://buy.eyegas.co.za/',
]
var helps = [
  'http://mopeka.com/homepage/instructions/',
  'https://www.boc.com.au/shop/en/au/mt-tracker-bbq',
  'http://gasnow.cl',
  'http://www.yonkegas.com/index.php/help',
  'https://vertrax.com/tank-monitoring/',
  'https://teambmpro.com/products/lpg-gas-level-monitor-smartsense',
  'https://www.lci1.com/',
  'http://help.eyegas.co.za/',
]

var myshop
var myhelp

var config = 'config.xml'
var i18n = fs.readdirSync('www/i18n')
for (var i = 0; i < i18n.length; ++i) i18n[i] = 'www/i18n/' + i18n[i]

// All below regex will be replaced by the selected - must include all here
var brands_to_replace = [/(Mopeka|Gas|Vertrax|Yonke) ✓/g, /MT Tracker BBQ™/g, /SmartSense/g, /Bottlecheck/g]

function replaceBrands(new_brand_name) {
  var i
  for (i = 0; i < brands_to_replace.length; ++i) {
    replaceInFiles(i18n, brands_to_replace[i], new_brand_name)
  }
}

function replaceResDir(mydir) {
  fs.copySync('res/' + mydir + '/js', 'www/js')
  fs.copySync('res/' + mydir + '/img', 'www/img')
  fs.copySync('res/' + mydir + '/css', 'www/css')
  fs.copySync('res/' + mydir + '/i18n', 'www/i18n')
  fs.copySync('res/' + mydir + '/keys', 'keys/google')
}

if (cliCommand.indexOf('--tankcheck') > -1) {
  myshop = 0
  myhelp = 0

  replaceResDir('tankcheck')

  // Update configs
  replaceInFiles(config, /(<name>)(.+)(<\/name>)/, '$1Tank ✓$3')
  replaceInFiles(config, /(<widget.+\sid=)"([^"]+)"/, '$1"com.mopeka.tankcheck"')
  replaceInFiles(config, /(\s*<icon\s+src=\"res\/)(.+)(\/icons)/g, '$1tankcheck$3')
  replaceInFiles(config, /(\s*<splash\s+src=\"res\/)(.+)(\/screens)/g, '$1tankcheck$3')

  replaceInFiles('www/index.html', /(<title>).*(<\/title>)/gi, '$1Mopeka Products$2')
  // TODO: add config file that we update
  // replaceInFiles("www/js/index.js", /\"https?:\/\/misc\.wirelessbites\.com\/write\?.*\"/ig, '"https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms"');

  replaceBrands('Mopeka ✓')
  replaceInFiles(i18n, /(\stitle\s*:\s*\')([^']+)(\',)/g, '$1Mopeka ✓$3')
} else if (cliCommand.indexOf('--yonke') > -1) {
  myshop = 3
  myhelp = 3

  replaceResDir('yonke')

  // Update configs
  replaceInFiles(config, /(<name>)(.+)(<\/name>)/, '$1Yonke ✓$3')
  replaceInFiles(config, /(<widget.+\sid=)"([^"]+)"/, '$1"com.mopeka.yonke"')
  replaceInFiles(config, /(\s*<icon\s+src=\"res\/)(.+)(\/icons)/g, '$1yonke$3')
  replaceInFiles(config, /(\s*<splash\s+src=\"res\/)(.+)(\/screens)/g, '$1yonke$3')

  replaceInFiles('www/index.html', /(<title>).*(<\/title>)/gi, '$1Yonke Gas$2')
  // TODO: add config file that we update
  // replaceInFiles("www/js/index.js", /\"https?:\/\/misc\.wirelessbites\.com\/write\?.*\"/ig, '"https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms"');

  replaceBrands('Yonke ✓')
  replaceInFiles(i18n, /(\stitle\s*:\s*\')([^']+)(\',)/g, '$1Yonke ✓$3')
} else if (cliCommand.indexOf('--gascheck') > -1) {
  myshop = 2
  myhelp = 2

  replaceResDir('gascheck')

  // Update configs
  replaceInFiles(config, /(<name>)(.+)(<\/name>)/, '$1Gas ✓ Check$3')
  replaceInFiles(config, /(<widget.+\sid=)"([^"]+)"/, '$1"com.mopeka.gascheck"')
  replaceInFiles(config, /(\s*<icon\s+src=\"res\/)(.+)(\/icons)/g, '$1gascheck$3')
  replaceInFiles(config, /(\s*<splash\s+src=\"res\/)(.+)(\/screens)/g, '$1gascheck$3')

  replaceInFiles('www/index.html', /(<title>).*(<\/title>)/gi, '$1GasNow$2')
  // TODO: add config file that we update
  // replaceInFiles("www/js/index.js", /\"https?:\/\/misc\.wirelessbites\.com\/write\?.*\"/ig, '"https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms"');

  replaceBrands('Gas ✓')
  replaceInFiles(i18n, /(\stitle\s*:\s*\')([^']+)(\',)/g, '$1Gas ✓$3')
} else if (cliCommand.indexOf('--mttracker') > -1) {
  myshop = 1
  myhelp = 1

  replaceResDir('mttracker')

  // Update configs
  replaceInFiles(config, /(<name>)(.+)(<\/name>)/, '$1MT Tracker BBQ$3')
  replaceInFiles(config, /(<widget.+\sid=)"([^"]+)"/, '$1"com.mopeka.mttracker"')
  replaceInFiles(config, /(\s*<icon\s+src=\"res\/)(.+)(\/icons)/g, '$1mttracker$3')
  replaceInFiles(config, /(\s*<splash\s+src=\"res\/)(.+)(\/screens)/g, '$1mttracker$3')

  replaceInFiles('www/index.html', /(<title>).*(<\/title>)/gi, '$1MT Tracker BBQ$2')
  // replaceInFiles("www/js/index.js", /\"https?:\/\/misc\.wirelessbites\.com\/write\?.*\"/ig, '"https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms"');

  replaceBrands('MT Tracker BBQ™')
  replaceInFiles(i18n, /(\stitle\s*:\s*\')([^']+)(\',)/g, '$1MT Tracker BBQ$3')
} else if (cliCommand.indexOf('--vertrax') > -1) {
  myshop = 4
  myhelp = 4

  replaceResDir('vertrax')

  // Update configs
  replaceInFiles(config, /(<name>)(.+)(<\/name>)/, '$1Vertrax ✓$3')
  replaceInFiles(config, /(<widget.+\sid=)"([^"]+)"/, '$1"com.mopeka.vertrax"')
  replaceInFiles(config, /(\s*<icon\s+src=\"res\/)(.+)(\/icons)/g, '$1vertrax$3')
  replaceInFiles(config, /(\s*<splash\s+src=\"res\/)(.+)(\/screens)/g, '$1vertrax$3')

  replaceInFiles('www/index.html', /(<title>).*(<\/title>)/gi, '$1Vertrax$2')
  // TODO: add config file that we update
  // replaceInFiles("www/js/index.js", /\"https?:\/\/misc\.wirelessbites\.com\/write\?.*\"/ig, '"https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms"');

  replaceBrands('Vertrax ✓')
  replaceInFiles(i18n, /(\stitle\s*:\s*\')([^']+)(\',)/g, '$1Vertrax ✓$3')
} else if (cliCommand.indexOf('--bmpro') > -1) {
  myshop = 5
  myhelp = 5

  replaceResDir('bmpro')

  // Update configs
  replaceInFiles(config, /(<name>)(.+)(<\/name>)/, '$1SmartSense$3')
  replaceInFiles(config, /(<widget.+\sid=)"([^"]+)"/, '$1"com.mopeka.bmpro"')
  replaceInFiles(config, /(\s*<icon\s+src=\"res\/)(.+)(\/icons)/g, '$1bmpro$3')
  replaceInFiles(config, /(\s*<splash\s+src=\"res\/)(.+)(\/screens)/g, '$1bmpro$3')

  replaceInFiles('www/index.html', /(<title>).*(<\/title>)/gi, '$1BMPRO$2')
  // TODO: add config file that we update
  // replaceInFiles("www/js/index.js", /\"https?:\/\/misc\.wirelessbites\.com\/write\?.*\"/ig, '"https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms"');

  replaceBrands('SmartSense')
  replaceInFiles(i18n, /(\stitle\s*:\s*\')([^']+)(\',)/g, '$1SmartSense$3')
} else if (cliCommand.indexOf('--lippert') > -1) {
  myshop = 6
  myhelp = 6

  replaceResDir('lippert')

  // Update configs
  replaceInFiles(config, /(<name>)(.+)(<\/name>)/, '$1Bottlecheck$3')
  replaceInFiles(config, /(<widget.+\sid=)"([^"]+)"/, '$1"com.mopeka.lippert"')
  replaceInFiles(config, /(\s*<icon\s+src=\"res\/)(.+)(\/icons)/g, '$1lippert$3')
  replaceInFiles(config, /(\s*<splash\s+src=\"res\/)(.+)(\/screens)/g, '$1lippert$3')

  replaceInFiles('www/index.html', /(<title>).*(<\/title>)/gi, '$1Bottlecheck$2')
  // TODO: add config file that we update
  // replaceInFiles("www/js/index.js", /\"https?:\/\/misc\.wirelessbites\.com\/write\?.*\"/ig, '"https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms"');

  replaceBrands('Lippert')
  replaceInFiles(i18n, /(\stitle\s*:\s*\')([^']+)(\',)/g, '$1Bottlecheck$3')
} else if (cliCommand.indexOf('--eyegas') > -1) {
  myshop = 7
  myhelp = 7

  replaceResDir('eyegas')

  // Update configs
  replaceInFiles(config, /(<name>)(.+)(<\/name>)/, '$1Eyegas$3')
  replaceInFiles(config, /(<widget.+\sid=)"([^"]+)"/, '$1"com.mopeka.eyegas"')
  replaceInFiles(config, /(\s*<icon\s+src=\"res\/)(.+)(\/icons)/g, '$1eyegas$3')
  replaceInFiles(config, /(\s*<splash\s+src=\"res\/)(.+)(\/screens)/g, '$1eyegas$3')

  replaceInFiles('www/index.html', /(<title>).*(<\/title>)/gi, '$1Eyegas$2')

  replaceBrands('eyegas')
  replaceInFiles(i18n, /(\stitle\s*:\s*\')([^']+)(\',)/g, '$1Eyegas$3')
} else {
  throw 'Unsupported app version - try --tankcheck, --gascheck, --vertrax, --bmpro, --lippert, or --mttracker, or --eyegas'
}

for (var i = 0; i < shops.length; ++i) {
  replaceInFiles(i18n, shops[i], shops[myshop])
  replaceInFiles('www/index.html', shops[i], shops[myshop])
}
for (var i = 0; i < helps.length; ++i) {
  replaceInFiles(i18n, helps[i], helps[myhelp])
  replaceInFiles('www/index.html', helps[i], helps[myhelp])
}
