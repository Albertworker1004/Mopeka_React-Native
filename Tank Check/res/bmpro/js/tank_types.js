var app_brand = 'bmpro'
var tank_min_offset = 0.0381
var sensor_max_height = [0.59, 999.99] // index is sensor type --- 0 = 20# original device (2ms) and 1 = 40# device (5ms)
var arb_tank_vertical = { type: 'arbitrary', label: 'arbitrary', vertical: true, height: 0.254 }
var arb_tank_horizontal = { type: 'arbitrary', label: 'arbitrary', vertical: false, height: 0.254 }
var c_adjustment = 1.0 // adjust for speed of sound (or rather height since its all a scaler).  This was added to adjust Yonnke up by 8% in South Africa
var scale_factor = 0.78 // Added to scale the entered height down to a 80% fill equivalent. affects arbitrary tank height. So 80% fill results in 100%

var propane_ratio = {
  default: 1.0,
  nz: 0.6,
}

var tank_types = {
  // North America
  en: [
    { type: '20lb', label: '20 lb, Vertical', vertical: true, height: 0.254 }, //10 inches
    { type: '30lb', label: '30 lb, Vertical', vertical: true, height: 0.381 }, //15 inches
    { type: '40lb', label: '40 lb, Vertical', vertical: true, height: 0.508 }, //20 inches
    { type: '100lb', label: '100 lb, Vertical', vertical: true, height: 0.8128 }, //32 inches
    { type: '120galv', label: '120 gal, Vertical', vertical: true, height: 1.2192 * 0.8 }, //48 inches - changed to 80% on 4/9/18

    // for horizontal tanks, 'height' = diameter - see here https://www.lykinsenergy.com/Uploads/files/Tank_Specifications.png
    { type: '120galh', label: '120 gal, Horizontal', vertical: false, height: 0.6096 }, //24 inches
    { type: '150gal', label: '150 gal, Horizontal', vertical: false, height: 0.6096 }, //24 inches
    { type: '250gal', label: '250 gal, Horizontal', vertical: false, height: 0.762 }, //30 inches
    { type: '500gal', label: '500 gal, Horizontal', vertical: false, height: 0.9398 }, //37 inches
    { type: '1000gal', label: '1000 gal, Horizontal', vertical: false, height: 1.0414 }, //41 inches
  ],

  // Australia and New Zealand
  au: [
    { type: '3.7kg', label: '3.7kg', vertical: true, height: 0.235 },
    { type: '8.5kg', label: '8.5kg', vertical: true, height: 0.342 },
  ],
}
