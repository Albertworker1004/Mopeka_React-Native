var lang_data = {
  // fw collapsible fields
  fw1: 'Update to',
  fw2: 'or tap here to choose a file from your device',
  fw3: 'Update using local file',
  fwUpgradeNow: 'Upgrade Now',
  fwCurrentVersionTitle: 'Current Version',
  fwStarted: 'Update started. Please stay within 10 ft/3m of sensor until process shows 100% complete.',
  fwSuccess: 'Firmware Update Successful',
  nofwUpdate: "You're all up-to-date!",
  loginFailedGeneric: 'Unexpected login problem. Check your login information.',
  loginFailed: 'Login Failed',
  registerFailed: 'User registration failed',
  UsernameExistsException: 'An account with the given email already exists.',
  invalidPassword: 'Invalid password',
  invalidEmail: 'Invalid email',
  passwordMismatch: 'Password mismatch',
  missingEmail: 'Please enter your email address',
  missingEmailMsg: 'An invalid email address was entered',
  emailLong: 'Sorry your email address is too long for our system to handle',
  minPassword: 'Please enter a password 6 characters or longer',
  passwordFormat: 'Password is formatted improperly',
  passwordConfirm: 'Please confirm your password',
  passwordNotMatch: 'Passwords do not match',
  propane: 'Propane',
  butane: 'Butane',
  checkFirmware: 'Checking for updates',
  account: 'Account',
  accountSensor: 'Account Sensors',
  signOut: 'Sign Out',
  refresh: 'Refresh',
  localAccount: 'Local + Account',
  accountOnly: 'Account Only',
  accountSensorFooter: 'All sensors synced locally to the app will be added to your account and listed above',
  bridge: 'Bridge',
  bridgeInfo: 'Bridge Information',
  wifiSettings: 'Wifi Settings',
  wifiName: 'Wifi Name',
  cloudSettings: 'Cloud Settings',
  save: 'Save',
  bulk: 'BULK',
  proSettings: 'Additonal tank settings available when connected to sensor',
  hour6: 'Every 6 Hours',
  hour12: 'Every 12 Hours',
  day1: 'Once a Day',
  day3: 'Every 3 Days',
  week: 'Once a Week',
  notificationsFreq: 'Notification Frequency',
  cancel: 'Cancel',
  email: 'Email',
  confirmEmail: 'Confirm Email',
  password: 'Password',
  confirmPassword: 'Confirm Password',

  signIn: 'Sign In',
  existingAccount: 'Already a user?',
  forgotPasswordPrompt: 'Forgot your password?',
  options: 'Options',
  groupSensors: 'Group Sensors',
  lowQualityAlert: `<b>Low Quality</b>: Tank empty or sensor is incorrectly positioned. <span className="text-red-900">(Tap for more info)</span>`,
  lowQuality: `Low Qaulity`,
  lowQuality_help: `The Quality indicator shown on a sensor’s home screen (3 star scale) is used to understand if the sensor’s ultrasonic measurement system is working correctly. Typically, if quality is low, (1 star or less) the sensor is mounted poorly: poorly positioned on the center bottom of tank, has debris on the tank in front of the rubber pad interfering with performance, or is lacking adequate sonic grease. Therefore, it is important to check Quality, especially during the first installation and setup. Typically, once installed correctly, with Quality at least 2 stars, it will not need change unless tank is disturbed such that it is no longer standing upright & level.`,
  lowBattery: `<b>Battery Low</b>: Consider replacing it soon. <span className="text-yellow-900">(Tap for more info)</span>`,
  updateToastText: 'Tanks settings updated',
  updateErrorToastText: 'Problem saving tank settings',

  additionalInfo: 'Additional Info',
  temperature: 'Temperature',

  sensorType: 'Sensor Type',

  acc:
    'This leveling tool can be used to ensure your sensor is installed in the correct horizontal position on the tank bottom.',

  new_device: 'Ny enhet',
  new_h20_device: 'Ny H20 enhet',
  tank_info: 'Flaskinfo',
  tank_level: 'Gasnivå',
  tank_settings: 'Inställningar',
  battery: 'Batteri',
  battery_level: 'Batterinivå',
  signal: 'Signal',
  quality: 'Quality',
  title: 'Mopeka ✓',
  name: 'name',
  level: 'level',
  scanning: 'Skannar',
  start_scan: 'Starta Skanning',
  tank_check_devices: 'Mopeka Enheter',
  device_name: 'Enhetsnamn:',
  tank_type: 'Flaskstorlek:',
  arbitrary: 'Annan storlek',
  tank_level_units: 'Enhet för nivå:',
  percent: 'Procent',
  inches: 'Tum',
  centimeters: 'Centimeter',
  voltage: 'Spänning',
  set_tank_height: 'Ställ in flaskhöjd',
  set_tank_height2: 'Ställ in flaskhöjd 2',
  signal_strength: 'Signalstyrka:',
  no_devices_message: 'Inga Mopeka enheter har lagts till.',
  first_time_message1:
    'You can purchase new Mopeka sensors and accessories from our <a href="#" onclick="window.open(\'' +
    getShopLink() +
    "', '_blank', 'location=yes')\">Online Store</a>. <br /><br /> For help syncing your sensor, please visit our <a href=\"#\" onclick=\"window.open('http://mopeka.com/shop/', '_blank', 'location=yes')\">Instructions Page</a>.",
  first_time_message2: '',
  menu: 'Meny',
  delete: 'Radera',
  forget_all: 'Glöm alla enheter',
  buy_sensors: 'Buy Sensors',
  help_page: 'Help Page',
  enable_filter: 'Sökfilter för enheter:',
  enabled: 'Aktiverat',
  demo_mode: 'Virtuell Demoenhet:',
  empty: 'Tom',
  register: 'Registrera',
  registerAccount: 'Registrera konto',
  check_bluetooth_msg: 'Kolla att Bluetooth är aktiverat och försök igen',
  check_bluetooth_title: 'Misslyckades med att initiera Bluetooth',
  loc_serv_msg:
    "App-privilegiet 'Plats' måste vara aktiverat för att Bluetooth Low Energy skanning skall kunna fungera. Detta är ett krav som Android ställer för alla telefoner med Android version 6.0 eller senare.",
  loc_serv_title: 'Platstjänsten är ej aktiverad',
  loc_prompt1:
    "'Platstjänsten' måste aktiveras för att Bluetooth skanning skall fungera korrekt med vissa telefoner med Android 6.0 eller senare. Din telefon kanske inte kan hitta sensorerna annars. Vill du öppna Android inställningarna för att aktivera den nu?",
  loc_title1: 'Platstjänst',
  loc_prompt2:
    'Du kommer inte att uppmanas igen. Har du problem att hitta dina sensorer kan du fortfarande slå på Platstjänsten manuellt i din telefons inställningar.',
  loc_title2: 'Glöm uppmaning',
  loc_prompt3: 'Du aktiverade inte Platstjänsten',
  filter_placeholder: 'Filtrerar enheter...',
  enable_filter_help:
    'Detta val aktiverar en sök/filter-ruta ovanför din lista av sensorer. Endast sensorer som matchar texten du matar in kommer att synas. Om du har massor av sensorer och flaskor kommer detta att underlätta för dig att hitta dem.',
  alarm_thresh: 'Tröskelnivå för larm:',
  alarm_thresh_help:
    'Sätt en tröskelnivå för när du vill ha ett larm för din flaska. När nivån går under detta värde får du en notifiering till din telefon (om det är aktiverat i huvudmenyn). Appen visar också en varningsikon och alternativ för att fylla din flaska.',
  notifications: 'Larm notifiering:',
  notifications_help:
    'Skicka en notifiering till din telefon när gasol-nivån sjunker under tröskelnivån. Denna tröskelnivå kan sättas i inställningarna för varje sensor. Observera att sensorn först måste läsa av ett värde över tröskelnivån 10 mätningar i rad innan larmet kan aktiveras. När sensorn sedan läser av ett värde under tröskelnivån minst fem gånger i rad så triggas larmet.',

  sort_preferences: 'Sort Preferences',
  sort_preferences_help:
    'Sorts the sensor list by the selected option. Name sorts alphabetical. Level sorts based on tank propane level in descending order',

  upload_data: 'Ladda upp Sensor Data:',
  upload_data_help:
    'Ladda upp sensor data till Mopeka för att hjälpa till med felsökning och förbättra våra sensorer. Ingen personlig identifierbar information förs över - bara din sensorinformation och telefonversion skickas. Datamängden är liten och kommer inte att skickas oftare än var 15:e minut när du är inom sensorns avläsningsavstånd.',
  sensor_info: 'Sensor Info',
  sensor_info_help:
    "Batteri: Visar hur mycket kapacitet som finns kvar i sensorbatteriet. Nivån kan sjunka i kall väderlek men kommer att återgå till normala nivåer när temperaturen ökar igen.\n\nSignal: Signalstyrkan för radiosignalen från den senaste avläsningen från sensorn\n\nKvalitet: Hur väl sensorn kan läsa nivån i flaskan. Se 'Flask Info' för tips om hjälp för att öka kvaliteten på avläsningen.",
  tank_info_help:
    'Visar nivån på ytan av gasolen eller procentuell fyllnadsnivå i din flaska. Om värdena verkar felaktiga eller hoppar, följ dessa steg för att öka kvaliteten på avläsningen. Dessa steg listas i viktighetsordning, så gå igenom dem ett och ett tills avläsningarna blir normala igen.\n\n1. Se till att flaskan står på ett helt plant underlag.\n\n2. Placera sensorn ordentligt direkt under centrum av botten på flaskan. På vissa flaskor finns en liten platt yta här.\n\n3. Se till att din flaska inte vilar på sensorn och att flaskan inte har skadat sensorn.  Använd de medskickade gummifötterna eller någon annan anordning för att skapa ett utrymme mellan sensorn och underlaget om din flaska kräver det.\n\n4. Torka av och möjligen även sandpappra av botten av flaskan där sensorn skall sitta.\n\n5. Se till att den lilla gummiringen på sensorn är rengjord och intakt och att magneterna sitter ordentligt på plats och inte är lösa.\n\n6. Vissa flaskor kan vara svårare att läsa av än andra pga skräp på insidan tillsammans med flera lager av färg och rost som har tillkommit med åren. Använd sensorn på en nyare flaska eller ett annat fabrikat om möjligt.',
  device_name_help:
    'Ge din sensor ett namn som gör det lätt att identifiera den. Detta namn sparas bara i din telefon, så om du använder flera telefoner måste du namnge den på alla telefoner.',
  tank_type_help:
    'Ange storleken på din flaska så att appen kan visa en procentuell fyllnadsnivå. För flasktyper som inte är uppräknade eller för horisontellt monterade flaskor behöver du mäta flaskans höjd och mata in den i "Annan storlek" fältet. För horisontellt monterade flaskor kommer procenttalet att visa den uppmätta höjden på gasol-nivån som en procentandel av den höjd du matat in i "Annan storlek" fältet.',
  tank_level_units_help:
    'Ändra vilka enheter som skall visas på huvudskärmen och detaljinformationsskärmarna för dina flaskor.',
  firmware_prefix: 'Mopeka',
  gas_mixture: 'Propane to Butane Ratio',
  gas_mixture_help:
    'Adjusting for the propane/butane ratio is typically not required. However, if you are in a region where Propane/Butane are mixed, select the appropriate % below. Changing the % only affects this sensor. If other sensors are synced to this device, each must be changed accordingly.',

  yes: 'Yes',
  no: 'No',
  never_again: 'Never ask again',

  // Notification title text
  notify_title: 'Tank level is low!',

  // Notification detail - 'sensor name' is at 10% - Tap for more info.
  notify_at: 'is at',
  notify_tap: 'Tap for more info.',

  // Time conversions
  second: 'second',
  minute: 'minute',
  hour: 'hour',
  day: 'day',
  month: 'month',
  year: 'year',
  updated: 'Updated',
  ago: 'ago',
  just_now: 'Updated just now',

  // Settings info
  update_rate: 'Update Rate:',
  change_update_rate: 'Hold the SYNC button for 5 seconds to toggle',
  fw_ver: 'Firmware Version:',
  dev_addr: 'Device Address:',
  tankRegionLabel: 'Cylinder Region Selection:',

  // Bridge (Gateway)
  login_page_msg: 'Skapa ett konto för att hantera dina sensorer över olika telefoner och surfplattor.',
  updateRate: 'Sensor Update Rate',
  updateRate_help:
    'This sets the minimum time (in minutes) that must pass before the gateway will write a new value to the cloud. The setting applies to each sensor',

  // Accelerometer
  accTitle: 'Sensor Leveling',
  accStep1: 'Step 1. Press the "Sync" button on your sensor to enable hyper update mode.',
  accStep2: 'Step 2. Place your sensor on a flat surface and then press:',
  accZeroSensor: 'Zero Sensor',
  accStep3: 'Step 3. Align your sensor on the bottom of your cylinder so that it is flat using the guide below:',
  accConfirmMsg:
    'This will recalibrate your sensor so that it thinks the current position is flat.  Make sure your sensor is on a flat surface and press OK.',
  accConfirmRezero: 'Confirm Rezero',
}
