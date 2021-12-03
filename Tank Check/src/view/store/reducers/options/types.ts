export type OptionPayload = {
  name: string
  val: any
}

export type OptionsState = {
  notifications?: boolean
  uploadSensorData?: boolean
  searchFilter?: boolean
  groupSensors?: boolean
  sortPreferences?: string
  title: {
    main: string
    subtitle?: string
  }
  errorUUID?: string
  // Internal state options. Might move these within their own reducer at some point.
  scanActive: boolean
}
