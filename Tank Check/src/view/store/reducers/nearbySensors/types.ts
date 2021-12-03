import { Sensor } from '../../../../lib/sensors/sensor'
import { Gateway } from '../../../../lib/sensors/gateway'

export type NearbySensorsState = {
  sensors: {
    [key: string]: Sensor | Gateway
  }
  searching: boolean
  rssiFilter: number
}
