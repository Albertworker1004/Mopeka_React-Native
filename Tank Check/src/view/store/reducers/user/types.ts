import { ApiSensor } from '../../../../lib/mopekaUser'

export type UserState = {
  session: { [key: string]: any }
  sensors: {
    [key: string]: ApiSensor
  }
}
