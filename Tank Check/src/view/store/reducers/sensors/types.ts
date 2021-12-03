import { TankCheck } from '../../../../lib/sensors/tankcheck'
import { Gateway } from '../../../../lib/sensors/gateway'
import { Sensor } from '../../../../lib/sensors/sensor'

export type SensorState = {
  sensors: {
    [key: string]: TankCheck | Gateway | Sensor
  }
  selectedSensor: string
  pendingWrite: boolean
}
