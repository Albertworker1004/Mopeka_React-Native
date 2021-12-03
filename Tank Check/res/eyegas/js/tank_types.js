var app_brand = 'eyegas'
var tank_min_offset = 0.0381
var sensor_max_height = [0.591, 999.99] // index is sensor type --- 0 = 20# original device (2ms) and 1 = 40# device (5ms)
var arb_tank_vertical = { type: 'arbitrary', label: 'arbitrary', vertical: true, height: 0.254 }
var arb_tank_horizontal = { type: 'arbitrary', label: 'arbitrary', vertical: false, height: 0.254 }
var c_adjustment = 1.0 // adjust for speed of sound (or rather height since its all a scaler).  This was added to adjust Yonnke up by 8% in South Africa
var scale_factor = 1.0 // Added to scale the entered height down to a 80% fill equivalent. affects arbitrary tank height. So 80% fill results in 100%

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

  // Latin America
  mx: [
    { type: '20kg', label: '20kg, Vertical', vertical: true, height: 0.606 },
    { type: '30kg', label: '30kg, Vertical', vertical: true, height: 0.838 },
    { type: '40kg', label: '40kg, Vertical', vertical: true, height: 1.16 },
    { type: '45kg', label: '45kg, Vertical', vertical: true, height: 1.008 },

    { type: '120L', label: '120L, Horizontal', vertical: false, height: 0.432 },
    { type: '180L', label: '180L, Horizontal', vertical: false, height: 0.432 },
    { type: '300L', label: '300L, Horizontal', vertical: false, height: 0.54 },
    { type: '500L', label: '500L, Horizontal', vertical: false, height: 0.54 },
  ],

  // Latin America
  // es tank type remaining for backwards compatiblity. if you remove this. sensors added before the addition of new south american regions will
  // that are still using this will fail to load
  es: [{ type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.246 }],

  // Chile
  cl: [
    { type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.246 },
    { type: '11kg', label: '11kg, Vertical', vertical: true, height: 0.305 },
    { type: '15kg', label: '15kg, Vertical', vertical: true, height: 0.291 },
    { type: '45kg', label: '45kg, Vertical', vertical: true, height: 0.763 },
    { type: '450L', label: '450L, Vertical', vertical: true, height: 0.94 },
    { type: '470L', label: '450/500L, Vertical', vertical: true, height: 1.02 },

    // for horizontal tanks, 'height' = diameter - see here https://www.lykinsenergy.com/Uploads/files/Tank_Specifications.png
    // From Manuel/Reese email: Jan 21, 2019, 3:21 PM
    { type: '1000L', label: '1000L, Horizontal', vertical: false, height: 0.83 },
    { type: '2000L', label: '2000L, Horizontal', vertical: false, height: 1.02 },
    { type: '4000L', label: '4000L, Horizontal', vertical: false, height: 1.02 },
  ],

  // Argentina
  ar: [
    { type: '2kg', label: '2kg, Vertical', vertical: true, height: 0.14 },
    { type: '3kg', label: '3kg, Vertical', vertical: true, height: 0.185 },
    { type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.224 },
    { type: '10kg', label: '10kg, Vertical', vertical: true, height: 0.286 },
    { type: '15kg', label: '15kg, Vertical', vertical: true, height: 0.415 },
    { type: '30kg', label: '30kg, Vertical', vertical: true, height: 0.752 },
    { type: '45kg', label: '45kg, Vertical', vertical: true, height: 0.752 },
    { type: '500L', label: '500L, Vertical', vertical: true, height: 1.01 },

    { type: '1000L', label: '1000L, Horizontal', vertical: false, height: 0.83 },
    { type: '2000L', label: '2000L, Horizontal', vertical: false, height: 1.17 },
    { type: '4000L', label: '4000L, Horizontal', vertical: false, height: 1.17 },
    { type: '7000L', label: '7000L, Horizontal', vertical: false, height: 1.16 },
  ],

  // South Africa
  za: [
    { type: '3kg', label: '3kg, Vertical', vertical: true, height: 0.202 },
    { type: '4.5kg', label: '4.5kg, Vertical', vertical: true, height: 0.228 },
    { type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.245 },
    //  { type: "6kg", label: "6kg, Vertical", vertical: true, height: 1.  }, note: has 0 for height
    { type: '7kg', label: '7kg, Vertical', vertical: true, height: 0.292 },
    { type: '9kg', label: '9kg, Vertical', vertical: true, height: 0.302 },
    { type: '12kg', label: '12kg, Vertical', vertical: true, height: 0.414 },
    { type: '14kg', label: '14kg, Vertical', vertical: true, height: 0.459 },
    { type: '19kg', label: '19kg, Vertical', vertical: true, height: 0.591 },
    { type: '48kg', label: '48kg, Vertical', vertical: true, height: 0.962 },
  ],

  // Brazil specific
  br: [
    { type: '2kg', label: '2kg, Vertical', vertical: true, height: 0.12 },
    { type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.154 },
    { type: '8kg', label: '8kg, Vertical', vertical: true, height: 0.22 },
    { type: '13kg', label: '13kg, Vertical', vertical: true, height: 0.2275 },
    { type: '20kg', label: '20kg, Vertical', vertical: true, height: 0.426 },
    { type: '45kg', label: '45kg, Vertical', vertical: true, height: 0.742 },
    { type: '90kg', label: '90kg, Vertical', vertical: true, height: 0.674 },
    { type: '125kg', label: '125kg, Vertical', vertical: true, height: 0.9 },
    { type: '190kg', label: '190kg, Vertical', vertical: true, height: 0.94 },
    { type: '500kg', label: '500kg, Vertical', vertical: true, height: 1.53 },
    { type: '1000kg', label: '1000kg, Vertical', vertical: true, height: 2.7 },
    { type: '2000kg', label: '2000kg, Vertical', vertical: true, height: 4.74 },

    { type: '500kg', label: '500kg, Horizontal', vertical: false, height: 0.78 },
    { type: '1000kg', label: '1000kg, Horizontal', vertical: false, height: 1.01 },
    { type: '2000kg', label: '2000kg, Horizontal', vertical: false, height: 1.01 },
  ],

  // Colombia specific
  co: [
    { type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.168 },
    { type: '9kg', label: '9kg, Vertical', vertical: true, height: 0.25 },
    { type: '15kg', label: '15kg, Vertical', vertical: true, height: 0.378 },
    { type: '18kg', label: '18kg, Vertical', vertical: true, height: 0.437 },
    { type: '45kg', label: '45kg, Vertical', vertical: true, height: 0.749 },
    { type: '120gal', label: '120gal, Vertical', vertical: true, height: 0.94 },

    { type: '250gal', label: '250gal, Horizontal', vertical: false, height: 0.76 },
    { type: '500gal', label: '500gal, Horizontal', vertical: false, height: 9.0 }, // Height seems odd, but is what is specified from the excel sheet
    { type: '1000gal', label: '1000gal, Horizontal', vertical: false, height: 1.04 },
    { type: '2000gal', label: '2000gal, Horizontal', vertical: false, height: 1.37 },
  ],

  // Ecuador specific
  ec: [
    { type: '3kg', label: '3kg, Vertical', vertical: true, height: 0.143 },
    { type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.19 },
    { type: '10kg', label: '10kg, Vertical', vertical: true, height: 0.247 },
    { type: '15kg', label: '15kg, Vertical', vertical: true, height: 0.353 },
    { type: '45kg', label: '45kg, Vertical', vertical: true, height: 0.722 },
    { type: '450L', label: '450L, Vertical', vertical: true, height: 1.05 },

    { type: '2000L', label: '2000L, Horizontal', vertical: false, height: 1.115 },
    { type: '4000L', label: '4000L, Horizontal', vertical: false, height: 0.992 },
    { type: '7000L', label: '7000L, Horizontal', vertical: false, height: 1.01 },
    { type: '7500L', label: '7500L, Horizontal', vertical: false, height: 0.992 },
    { type: '8000L', label: '8000L, Horizontal', vertical: false, height: 1.01 },
    { type: '100000L', label: '100000L, Horizontal', vertical: false, height: 1.719 },
  ],

  // Uruguay specific
  uy: [
    { type: '13kg', label: '13kg, Vertical', vertical: true, height: 0.266 },
    { type: '45kg', label: '45kg, Vertical', vertical: true, height: 0.815 },
    { type: '190kg', label: '190kg, Vertical', vertical: true, height: 1.01 },

    { type: '1000kg', label: '1000kg, Horizontal', vertical: false, height: 1.07 },
    { type: '2000kg', label: '2000kg, Horizontal', vertical: false, height: 1.11 },
    { type: '3500kg', label: '3500kg, Horizontal', vertical: false, height: 1.17 },
  ],

  // Peru specific
  pe: [
    { type: '3kg', label: '3kg, Vertical', vertical: true, height: 0.143 }, // adder per Jose Pablo request on 4/6/18 - Total high: 38.5 cm, 100% set in. 31.0 cm
    { type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.213 },
    { type: '10kg', label: '10kg, Vertical', vertical: true, height: 0.276 },
    { type: '15kg', label: '15kg, Vertical', vertical: true, height: 0.276 },
    { type: '45kg', label: '45kg, Vertical', vertical: true, height: 0.276 },
    { type: '120gal', label: '120gal, Vertical', vertical: true, height: 1.0 },

    { type: '120gal', label: '120gal, Horizontal', vertical: false, height: 0.58 },
    { type: '250gal', label: '250gal, Horizontal', vertical: false, height: 0.77 },
    { type: '500gal', label: '500gal, Horizontal', vertical: false, height: 0.88 },
    { type: '1000gal', label: '1000gal, Horizontal', vertical: false, height: 0.97 },
    { type: '2000gal', label: '2000gal, Horizontal', vertical: false, height: 1.47 },
    { type: '4000gal', label: '4000gal, Horizontal', vertical: false, height: 1.47 },
    { type: '6000gal', label: '6000gal, Horizontal', vertical: false, height: 1.76 },
    { type: '8000gal', label: '8000gal, Horizontal', vertical: false, height: 1.96 },
  ],

  // Paraguay specific
  py: [
    { type: '5kg', label: '5kg, Vertical', vertical: true, height: 0.154 },
    { type: '10kg', label: '10kg, Vertical', vertical: true, height: 0.276 },
    { type: '13kg', label: '13kg, Vertical', vertical: true, height: 0.228 },
    { type: '45kg', label: '45kg, Vertical', vertical: true, height: 0.742 },

    { type: '1000L', label: '1000L, Horizontal', vertical: false, height: 0.98 },
    { type: '2500L', label: '2500L, Horizontal', vertical: false, height: 1.17 },
    { type: '4000L', label: '4000L, Horizontal', vertical: false, height: 1.17 },
    { type: '5000L', label: '5000L, Horizontal', vertical: false, height: 1.17 },
    { type: '7000L', label: '7000L, Horizontal', vertical: false, height: 1.17 },
    { type: '8000L', label: '8000L, Horizontal', vertical: false, height: 1.17 },
    { type: '10000L', label: '10000L, Horizontal', vertical: false, height: 1.46 },
    { type: '13000L', label: '13000L, Horizontal', vertical: false, height: 1.46 },
    { type: '16000L', label: '16000L, Horizontal', vertical: false, height: 1.46 },
    { type: '19000L', label: '19000L, Horizontal', vertical: false, height: 1.46 },
  ],

  // Europe
  eu: [
    { type: '6kg', label: '6kg', vertical: true, height: 0.42 * 0.8 }, //0.336
    { type: '11kg', label: '11kg', vertical: true, height: 0.4572 * 0.8 }, //0.366
    { type: '12kg', label: '12kg', vertical: true, height: 0.4 }, //0.400 - requested for Israel (Gal) by Jason on 04/17/18
    { type: '14kg', label: '14kg', vertical: true, height: 0.5842 * 0.8 }, //0.467
    { type: '18kg', label: '18kg', vertical: true, height: 0.7366 * 0.8 }, //0.589
    { type: '48kg', label: '48kg', vertical: true, height: 1.0 }, //1.000 - requested for Israel (Gal) by Jason on 04/17/18
  ],

  // Isreal
  il: [
    // adder per Jason on email 04/17/2018
    { type: '5kg', label: '5kg', vertical: true, height: 0.3 }, //0.300
    //{ type: "6kg",  label: "6kg",  vertical: true, height: 0.420*0.8 },    //0.336
    //{ type: "11kg", label: "11kg", vertical: true, height: 0.4572*0.8 },   //0.366
    { type: '12kg', label: '12kg', vertical: true, height: 0.39 }, //0.390
    //{ type: "14kg", label: "14kg", vertical: true, height: 0.5842*0.8 },   //0.467
    //{ type: "18kg", label: "18kg", vertical: true, height: 0.7366*0.8 },   //0.589
    { type: '48kg', label: '48kg', vertical: true, height: 1.025 }, //1.025
  ],

  // Australia and New Zealand
  au: [
    { type: '4.5kg', label: '4.5kg', vertical: true, height: 0.38 * 0.8 },
    { type: '6kg', label: '6kg', vertical: true, height: 0.42 * 0.8 },
    { type: '9kg', label: '9kg', vertical: true, height: 0.465 * 0.8 },
    { type: '11kg', label: '11kg', vertical: true, height: 0.4572 * 0.8 },
    { type: '14kg', label: '14kg', vertical: true, height: 0.5842 * 0.8 },
    { type: '18kg', label: '18kg', vertical: true, height: 0.7366 * 0.8 },
  ],

  // South Korea
  kr: [
    { type: '3kg', label: '3kg', vertical: true, height: 0.215 },
    { type: '5kg', label: '5kg', vertical: true, height: 0.235 },
    { type: '10kg', label: '10kg', vertical: true, height: 0.39 },
    { type: '20kg', label: '20kg', vertical: true, height: 0.69 },
  ],
  // Philippines (jason request 4/15/2021)
  ph: [
    { type: '2.7kg', label: '2.7kg (Powerkalan)', vertical: true, height: 0.24 * 0.8 },
    { type: '11kg', label: '11kg', vertical: true, height: 0.402 * 0.8 },
    { type: '22kg', label: '22kg', vertical: true, height: 0.749 * 0.8 },
    { type: '50kg', label: '50kg', vertical: true, height: 1.088 * 0.8 },
  ],
}
