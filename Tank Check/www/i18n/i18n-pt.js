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

  new_device: 'Novo Dispositivo',
  new_h20_device: 'Novo H20 Dispositivo',
  tank_info: 'Informação do Cilindro',
  tank_level: 'Nível do Gás',
  tank_settings: 'Configuração',
  battery: 'Bateria',
  battery_level: 'Nível da Bateria',
  signal: 'Sinal',
  quality: 'Qualidade',
  title: 'Mopeka ✓',
  name: 'name',
  level: 'level',
  scanning: 'Digitalização',
  start_scan: 'Iniciar digitalização',
  tank_check_devices: 'Cilindro / Dispositivo',
  device_name: 'Nome do Dispositivo:',
  tank_type: 'Tipo de Cilindro:',
  arbitrary: 'Arbitrário',
  tank_level_units: 'Unidade de Nível do Cilindro:',
  percent: 'Porcentagem',
  inches: 'Polegadas',
  centimeters: 'Centímetros',
  voltage: 'Voltajem',
  set_tank_height: 'Ajuste a altura do cilindro',
  set_tank_height2: 'Altura em ',
  signal_strength: 'Força do Sinal:',
  no_devices_message: 'Não há mensagens nos dispositivos.',
  first_time_message1:
    'A primeira vez que é usado o sensor do cilindro, pressione o botão" Sincronização" 5 vezes seguidas para inicialize. Para adicionar novos sensores já usados, pressione o botão de sincronização do sensor uma vez, até aparecerem.',
  first_time_message2: '',
  menu: 'Cardápio',
  delete: 'Excluir',
  forget_all: 'Excluir Dispositivos',
  buy_sensors: 'Compre Sensores',
  help_page: ' Página de ajuda',
  enable_filter: 'Ativar filtro:',
  enabled: 'Habilitado',
  demo_mode: 'Modo demonstração:',
  empty: 'Vazio',
  register: 'Registar',
  registerAccount: 'Registar Account',
  check_bluetooth_msg: 'Por favor, verifique se o Bluetooth é ativado e tente novamente',
  check_bluetooth_title: 'Erro ao inicializar o Bluetooth',
  loc_serv_msg:
    'A permissão do aplicativo para o serviço de localização deve estar ativado para a função de digitalização Bluetooth de baixa. É  uma exigência do Android para telefones com o Android versão 6.0 ou posterior',
  loc_serv_title: 'Serviço de localização não ativado',
  loc_prompt1:
    'Os serviços de localização devem estar ativados para a digitalização Bluetooth funcionar corretamente em determinados telefones com o Android 6.0 e posterior. Caso contrário, seu telefone pode não conseguir localizar nenhum sensor. ¿Deseja abrir a "Configurações do Android " para ativá-lo agora',
  loc_title1: 'Solicitar serviços de localização',
  loc_prompt2:
    'Você não será perguntado novamente. Se você tiver problemas na aparência dos sensores, você pode ativar os serviços de localização manualmente na configuração do telefone ',
  loc_title2: 'Ignorar Indicador',
  loc_prompt3: 'Você não ativou o serviço de localização',

  // All the text below is for the "help" popup messages that show up  when the user clicks the "i" or information icons that are
  // setup throughout the system
  filter_placeholder: 'Dispositivos de filtro...',
  enable_filter_help:
    'Isso permitirá uma caixa de pesquisa / filtro acima da lista de sensores. Apenas os sensores que correspondem ao texto digitado ficarão visíveis. Se você tiver muitos sensores e / ou cilindros, isso pode ajudá-lo a gerenciá-los e encontrá-los melhor na lista.',
  alarm_thresh: 'Limite de alerta:',
  alarm_thresh_help:
    'Defina um alerta de nível mínimo para o seu cilindro. Quando o nível estiver abaixo desse alerta, uma notificação será enviada ao seu telefone (se ativada no menu principal). O aplicativo também mostrará um ícone de aviso e opções para ajudá-lo na substituição de gás para o seu cilindro ',
  notifications: 'Notificações de alerta:',
  notifications_help:
    'Notificações serão enviadas para o seu celular quando o nível de gás cair abaixo do limite de alerta estabelecido. Esse limite pode ser definido na configuração de cada sensor',

  sort_preferences: 'Sort Preferences',
  sort_preferences_help:
    'Sorts the sensor list by the selected option. Name sorts alphabetical. Level sorts based on tank propane level in descending order',

  upload_data: 'Carregando dados do sensor',
  upload_data_help:
    'Carregue os dados do sensor no GasNow para ajudar a resolver problemas e melhorar nossos sensores. Informações de identificação pessoal não são transmitidas - apenas as informações do sensor e a versão do telefone são enviadas. Esses dados são muito pequenos e não serão enviados mais de uma vez a cada 15 minutos quando estiverem dentro do alcance do seu sensor. ',
  sensor_info: 'Informação do Sensor',
  sensor_info_help:
    'Batería: Mostra o nível da bateria do sensor. O nível da bateria vai cair a uma temperatura baixa, mas deve subir novamente quando a temperatura subir. Sinal: A intensidade do sinal sem fio da última leitura do sensor recebido. Qualidade: Estado da leitura do nível de gás do cilindro. Veja a ajuda de "Informação do cilindro" para dicas para aumentar a qualidade',
  tank_info_help:
    'Isto mostra a altura do líquido ou o nível percentual  de incorporação de gás. Se as palavras parecerem erradas ou se você estiver pulando, siga estas etapas para aumentar a qualidade. Esses estágios são listados em ordem de importância no momento em que você passa por cada um dos dados em que suas palavras se tornam norma \n\n1. Verifique se você tem um tanque plano em uma superfície plana.\n\n2. Coloque firmemente o sensor diretamente no centro da parte inferior do cilindro. Deve haver uma pequena parte plana, não um centro, dois cilindros. \n\n3. Certifique-se de que o seu cilindro não esteja apoiado no sensor e que não o tenha danificado. Use espaçadores de fornecedores ou outros meios para fornecer espaço livre para o sensor se o seu cilindro exigir.\n\n4. Limpe a parte inferior do cilindro onde você coloca o sensor muito bem.\n\n5. Certifique-se de que o pequeno anel de borracha do sensor esteja limpo e intacto e que os ímãs estejam firmemente assentados e não soltos.\n\n6. Certos cilindros podem ser mais difíceis de ler e podem ter mais detritos dentro, juntamente com camadas de tinta e ácido atraídos ao longo dos anos. Teste o sensor em um cilindro mais novo ou marcas diferentes, se possível.',
  device_name_help:
    'Estabeleça um nome descritivo para este sensor e cilindro para que você possa identificá-lo facilmente. Este nome só é salvo no telefone, por isso, se você usar vários telefones, você deve atribuir o nome a cada um. ',
  tank_type_help:
    'Defina o tamanho do seu cilindro para que o aplicativo possa exibir uma porcentagem de leitura. Para tamanhos não listados ou lagoas horizontais, você deve medir a altura do tanque e entrar no campo "Arbitrário". Para tanques horizontais, a porcentagem mostrada será a altura do fluido medida em relação à altura inserida no campo "Arbitrário"',
  tank_level_units_help:
    'Altere as unidades mostradas nas páginas de informações do cilindro principal e detalhadas para o seu nível de cilindro.',
  firmware_prefix: 'Mopeka',
  gas_mixture: 'Propane to Butane Ratio',
  gas_mixture_help:
    'Adjusting for the propane/butane ratio is typically not required. However, if you are in a region where Propane/Butane are mixed, select the appropriate % below. Changing the % only affects this sensor. If other sensors are synced to this device, each must be changed accordingly.',

  // Prompt that shows up when the user is asked to "Enable Location  Services" and is presented buttons for "Yes", "No", or "Never ask again"
  yes: 'Sim',
  no: 'No',
  never_again: 'Nunca',

  // Notification title text
  notify_title: 'Baixo nível de gás',

  // Notification detail - 'sensor name' is at 10% - Tap for more info.
  notify_at: 'está em',
  notify_tap: 'Pressione para mais informações',

  // Time conversions
  second: 'segundo',
  minute: 'minuto',
  hour: 'hora',
  day: 'dia',
  month: 'mes',
  year: 'año',
  updated: 'Atualizado há',
  ago: '',
  just_now: 'Atualizado recentemente',

  // Settings info
  update_rate: 'Update Rate:',
  change_update_rate: 'Hold the SYNC button for 5 seconds to toggle',
  fw_ver: 'Firmware Version:',
  dev_addr: 'Device Address:',
  tankRegionLabel: 'Cylinder Region Selection:',

  // Bridge (Gateway)
  login_page_msg: 'Crie uma conta para gerenciar seus sensores em diferentes telefones e tablets.',
  updateRate: 'Sensor Update Rate',
  updateRate_help:
    'This sets the minimum time (in minutes) that must pass before the bridge will write a new value to the cloud. The setting applies to each sensor',

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
