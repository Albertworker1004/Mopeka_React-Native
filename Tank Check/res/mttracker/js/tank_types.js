var app_brand = 'mttracker'
var tank_min_offset = 0.0381
var sensor_max_height = [0.59, 999.99] // index is sensor type --- 0 = 20# original device (2ms) and 1 = 40# device (5ms)
var arb_tank_vertical = { type: 'arbitrary', label: 'arbitrary', vertical: true, height: 0.254 }
var arb_tank_horizontal = { type: 'arbitrary', label: 'arbitrary', vertical: false, height: 0.254 }
var c_adjustment = 1.0 // adjust for speed of sound (or rather height since its all a scaler).  This was added to adjust Yonnke up by 8% in South Africa
var scale_factor = 1.0 // Added to scale the entered height down to a 80% fill equivalent. affects arbitrary tank height. So 80% fill results in 100%

var propane_ratio = {
  default: 1.0,
  nz: 0.6,
}

var tank_types = {
  /*en: [ { type: "20lb",    label: "20 lb, Vertical",      vertical: true,  height: 0.2540 }, //10 inches
            { type: "30lb",    label: "30 lb, Vertical",      vertical: true,  height: 0.3810 }, //15 inches
            { type: "40lb",    label: "40 lb, Vertical",      vertical: true,  height: 0.5080 }, //20 inches
            { type: "100lb",   label: "100 lb, Vertical",     vertical: true,  height: 0.8128 }, //32 inches
            { type: "120galv", label: "120 gal, Vertical",    vertical: true,  height: 1.2192*0.8 }, //48 inches - changed to 80% on 4/9/18

            // for horizontal tanks, 'height' = diameter - see here https://www.lykinsenergy.com/Uploads/files/Tank_Specifications.png
            { type: "120galh", label: "120 gal, Horizontal",  vertical: false, height: 0.6096 }, //24 inches
            { type: "150gal",  label: "150 gal, Horizontal",  vertical: false, height: 0.6096 }, //24 inches
            { type: "250gal",  label: "250 gal, Horizontal",  vertical: false, height: 0.7620 }, //30 inches
            { type: "500gal",  label: "500 gal, Horizontal",  vertical: false, height: 0.9398 }, //37 inches
            { type: "1000gal", label: "1000 gal, Horizontal", vertical: false, height: 1.0414 }  //41 inches
           ],

    // Latin America
    es: [ { type: "5kg",  label: "5kg, Vertical",  vertical: true, height: 0.246 },
            { type: "11kg", label: "11kg, Vertical", vertical: true, height: 0.305 },
            { type: "15kg", label: "15kg, Vertical", vertical: true, height: 0.291 },
            { type: "45kg", label: "45kg, Vertical", vertical: true, height: 1.00  },
            { type: "470L", label: "470L, Vertical", vertical: true, height: 0.94  },

            // for horizontal tanks, 'height' = diameter - see here https://www.lykinsenergy.com/Uploads/files/Tank_Specifications.png
            // From Manuel/Reese email: Jan 21, 2019, 3:21 PM
            { type: "1000L", label: "1000L, Horizontal",  vertical: false, height: 0.860 },
            { type: "2000L", label: "2000L, Horizontal",  vertical: false, height: 1.050 },
            { type: "4000L",  label: "4000L, Horizontal",  vertical: false, height: 1.050 },

          ],

    br: [  // Brazil specific
            { type: "13kg", label: "13kg", vertical: true, height: 0.2275 },    // adder per Jose Pablo request on 4/6/18 - Total high: 38.5 cm, 100% set in. 31.0 cm
          ],
    pe: [  // Peru specific
            { type: "10kg", label: "10kg", vertical: true, height: 0.2275 },    // adder per Jose Pablo request on 4/6/18 - Total high: 38.5 cm, 100% set in. 31.0 cm
          ],

    // Europe
    eu: [ { type: "6kg",  label: "6kg",  vertical: true, height: 0.420*0.8 },    //0.336
            { type: "11kg", label: "11kg", vertical: true, height: 0.4572*0.8 },   //0.366
            { type: "12kg", label: "12kg", vertical: true, height: 0.400 },        //0.400 - requested for Israel (Gal) by Jason on 04/17/18
            { type: "14kg", label: "14kg", vertical: true, height: 0.5842*0.8 },   //0.467
            { type: "18kg", label: "18kg", vertical: true, height: 0.7366*0.8 },   //0.589
            { type: "48kg", label: "48kg", vertical: true, height: 1.000 },        //1.000 - requested for Israel (Gal) by Jason on 04/17/18
          ],

    // Isreal
    il: [ // adder per Jason on email 04/17/2018
            { type: "5kg",  label: "5kg",  vertical: true, height: 0.300 },        //0.300
            //{ type: "6kg",  label: "6kg",  vertical: true, height: 0.420*0.8 },    //0.336
            //{ type: "11kg", label: "11kg", vertical: true, height: 0.4572*0.8 },   //0.366
            { type: "12kg", label: "12kg", vertical: true, height: 0.390 },        //0.390
            //{ type: "14kg", label: "14kg", vertical: true, height: 0.5842*0.8 },   //0.467
            //{ type: "18kg", label: "18kg", vertical: true, height: 0.7366*0.8 },   //0.589
            { type: "48kg", label: "48kg", vertical: true, height: 1.025 },        //1.025
          ],
*/
  en: [
    // must have english since it is always the default
    { type: '9kg', label: '9kg', vertical: true, height: 0.26 }, // From Daniel Mills email 9/12/18
    { type: '4kg', label: '4kg', vertical: true, height: 0.17 }, // From Daniel Mills email 9/13/18
  ],

  // Australia and New Zealand
  au: [
    { type: '9kg', label: '9kg', vertical: true, height: 0.26 }, // From Daniel Mills email 9/12/18
    { type: '4kg', label: '4kg', vertical: true, height: 0.17 }, // From Daniel Mills email 9/13/18
  ],
}
