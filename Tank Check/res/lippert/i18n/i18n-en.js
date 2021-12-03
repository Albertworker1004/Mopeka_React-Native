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

  new_device: 'New LPG Device',
  new_h20_device: 'New water sensor',
  new_pro_h20_device: 'Pro H2O',
  tank_info: 'Tank Info',
  tank_level: 'Tank Level',
  tank_settings: 'Settings',
  battery: 'Battery',
  battery_level: 'Battery Level',
  signal: 'Signal',
  quality: 'Quality',
  title: 'Mopeka ✓',
  name: 'name',
  level: 'level',
  scanning: 'Scanning',
  start_scan: 'Start Scan',
  tank_check_devices: 'Mopeka ✓ Devices',
  device_name: 'Device Name',
  tank_type: 'Tank Size',
  arbitrary: 'Arbitrary',
  tank_level_units: 'Tank Level Units',
  percent: 'Percent',
  inches: 'Inches',
  centimeters: 'Centimeters',
  voltage: 'Voltage',
  set_tank_height: 'Set Tank Height',
  set_tank_height2: 'Tank Height in',
  signal_strength: 'Signal Strength',
  no_devices_message: 'No Bottlecheck devices have been added.',
  first_time_message1:
    'You can purchase new Bottlecheck sensors and accessories from our <a style="text-decoration: underline;" href="#" onclick="window.open(\'' +
    getShopLink() +
    "', '_blank', 'location=yes')\"><b>Online Store</b></a>.",
  first_time_message2:
    'For help syncing your sensor, please visit our <a style="text-decoration: underline;" href="#" onclick="window.open(\'https://www.lci1.com/\', \'_blank\', \'location=yes\')"><b>Instructions Page</b></a>.',
  menu: 'Menu',
  delete: 'Delete',
  forget_all: 'Forget All Devices',
  buy_sensors: 'Buy Sensors',
  help_page: 'Help Page',
  enable_filter: 'Device Search Filter',
  enabled: 'Enabled',
  demo_mode: 'Virtual Demo Device',
  empty: 'Empty',
  register: 'Register',
  registerAccount: 'Register Account',
  check_bluetooth_msg: 'Please check that Bluetooth is enabled and try again',
  check_bluetooth_title: 'Failed to Initialize Bluetooth',
  loc_serv_msg:
    "The 'Location Services' App Permission must be enabled for Bluetooth Low Energy scanning to function.  This is an Android requirement for all phones with Android Version 6.0 or newer.",
  loc_serv_title: 'Location Services not enabled',
  loc_prompt1:
    "'Location Services' must be enabled for Bluetooth scanning to work properly on certain phones with Android 6.0 and newer.  Your phone may not be able to locate any sensors otherwise.  Would you like to open the 'Android Settings Prompt' to enable it now?",
  loc_title1: 'Location Services',
  loc_prompt2:
    'You will not be prompted again.  If you have trouble discovering sensors, you can still enable Location Services manually in your phone settings.',
  loc_title2: 'Skip Prompt',
  loc_prompt3: 'You did not enable Location Services',
  filter_placeholder: 'Filter devices...',
  enable_filter_help:
    'This will enable a search/filter box above your sensor list.  Only sensors that match the text you type will be visible.  If you have a lot of sensors and tanks, this can help you manage and find them in the list better.',
  alarm_thresh: 'Alarm Threshold',
  alarm_thresh_help:
    'Set a low-level alarm threshold for your tank.  When the level crosses below this alarm you will be sent a notification on your phone (if enabled in the main menu).  The app will also show you a warning icon and options to help you refill your tank.',
  notifications: 'Notifications',
  notifications_help:
    "Send phone notifications when your LPG level crosses below the alarm threshold.  This threshold can be configured in the settings for each sensor.  Note that the sensor's threshold must first rise above the threshold for more than 10 consecutive measurements before the alarm will be engaged.  It must then fall below the threshold for 5 consecutive measurements before being triggered.",
  sort_preferences: 'Sort Preferences',
  sort_preferences_help:
    'Sorts the sensor list by the selected option. Name sorts alphabetical. Level sorts based on tank propane level in descending order',
  upload_data: 'Upload Sensor Data',
  upload_data_help:
    'Upload sensor data to help troubleshoot and improve our sensors.  No personally identifiable information is transmitted - only your sensor information and phone version is sent.  This data is very small and will not be sent more than once every 15 minutes when you are within range of your sensor.',
  sensor_info: 'Sensor Info',
  sensor_info_help:
    "Battery: Displays the level of the sensor battery. The battery level may drop in cold weather but should return when temperatures increase.\n\nSignal: The wireless signal strength of the last received sensor reading\n\nQuality: Condition of the sensor's reading of the tank level. See the 'Tank Info' help for tips to increase the quality.",
  sensor_list: 'Sensor List',
  sensor_list_help:
    'You can highlight your sensor in the list by holding sync button on your sensor device for 1-2 seconds.',
  tank_info_help:
    'This displays the height of LPG, or percentage fill level of your tank. If the readings seem incorrect or are bouncing, follow these tips to increase the quality. These steps are listed in the order of importance, so step through each until your readings return to normal.\n\n1. Make sure tank is on a very level surface.\n\n2. Firmly place sensor directly in the center bottom of the tank. There should be a small flat spot on the center of most tanks.\n\n3. Make sure your tank is not resting on the sensor and that the tank has not damaged it.  Use the provided spacers or other means to provide clearance for the sensor if your tank requires it.\n\n4. Wipe any possible sand or dirt off the bottom of the tank where the sensor and the tank make contact. Ensure the bottom of your cylinder is dry and free of moisture.\n\n5. Make sure the small rubber ring on your sensor is cleaned and intact and that the magnets are firmly seated and not loose.\n\n6. Certain tanks may be more difficult to read and might have more debris inside along with layers of paint and rust added over the years. Try the sensor on a newer tank or different brand of tank if possible.',
  device_name_help:
    'Set a friendly name for this sensor and tank so that you can easily identify it.  This name is only saved on your phone, so if you use multiple phones you will need to assign the name on each.',
  tank_type_help:
    'Set the size of your tank so that the app can display a percentage read-out. For unlisted sizes or horizontal tanks, you should measure the tank\'s height and enter it into the "Arbitrary" field.  For horizontal tanks the percentage displayed will be the measured fluid height relative to the height you enter in the "Arbitrary" field.',
  tank_level_units_help:
    'Change the units that are displayed on the main and detailed tank information pages for your tank level.',
  firmware_prefix: 'Mopeka ✓',
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
  update_rate: 'Update Rate',
  change_update_rate: 'Hold the SYNC button for 5 seconds to toggle',
  fw_ver: 'Firmware Version',
  dev_addr: 'Device Address',
  tankRegionLabel: 'Tank Region Selection',

  // Bridge (Gateway)
  login_page_msg: 'Create an account to manage your sensors across different phones and tablets.',
  updateRate: 'Sensor Update Rate',
  updateRate_help:
    'This sets the minimum time (in minutes) that must pass before the bridge will write a new value to the cloud. The setting applies to each sensor',

  // Accelerometer
  accTitle: 'Sensor Leveling',
  accStep1: 'Step 1. Press the "Sync" button on your sensor to enable hyper update mode.',
  accStep2: 'Step 2. Place your sensor on a flat surface and then press',
  accZeroSensor: 'Zero Sensor',
  accStep3: 'Step 3. Align your sensor on the bottom of your tank so that it is flat using the guide below',
  accConfirmMsg:
    'This will recalibrate your sensor so that it thinks the current position is flat.  Make sure your sensor is on a flat surface and press OK.',
  accConfirmRezero: 'Confirm Rezero',
}
