var app_brand = 'yonke'
var tank_min_offset = 0.0 // TODO: WARNING!!! This will break reading between app and gateway
var sensor_max_height = [0.591, 999.99] // index is sensor type --- 0 = 20# original device (2ms) and 1 = 40# device (5ms)
var arb_tank_vertical = { type: 'arbitrary', label: 'arbitrary', vertical: true, height: 0.254 }
var arb_tank_horizontal = { type: 'arbitrary', label: 'arbitrary', vertical: false, height: 0.254 }
var c_adjustment = 1.08 // adjust for speed of sound (or rather height since its all a scaler).  This was added to adjust Yonnke up by 8% in South Africa
var scale_factor = 1.0 // Added to scale the entered height down to a 80% fill equivalent. affects arbitrary tank height. So 80% fill results in 100%

var propane_ratio = {
  default: 1.0,
  nz: 0.6,
}

var tank_types = {
  // South Africa
  za: [
    { type: '3kg', label: '3kg, Vertical', vertical: true, height: 0.194 },
    { type: '4.5kg', label: '4.5kg, Vertical', vertical: true, height: 0.208 },
    { type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.224 },
    //  { type: "6kg", label: "6kg, Vertical", vertical: true, height: 1.  }, note: has 0 for height
    { type: '7kg', label: '7kg, Vertical', vertical: true, height: 0.267 },
    { type: '9kg', label: '9kg, Vertical', vertical: true, height: 0.276 },
    { type: '12kg', label: '12kg, Vertical', vertical: true, height: 0.378 },
    { type: '14kg', label: '14kg, Vertical', vertical: true, height: 0.42 },
    { type: '19kg', label: '19kg, Vertical', vertical: true, height: 0.503 },
    { type: '48kg', label: '48kg, Vertical', vertical: true, height: 0.88 },
  ],
}
