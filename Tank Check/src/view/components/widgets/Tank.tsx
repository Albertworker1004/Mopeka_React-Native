import React, { useEffect, useState } from 'react'

import TankSmallImage from '../../../../www/img/tank_20lb_large.png'
import TankLargeImage from '../../../../www/img/tank_40lb_large.png'
import TankHorizonalImage from '../../../../www/img/tank_horizontal_large.png'
import TankSmallHorizonalImage from '../../../../www/img/tank_horizontal.png'
import WaterImage from '../../../../www/img/h20_large.png'
import GenericImage from '../../../../www/img/generic_tanks.png'
import TruckImage from '../../../../www/img/tank_truck.png'

// TODO: add a large size option for sensor details screen

type TankProps = {
  stage: number
  tankType: 'small' | 'large' | 'horizontal' | 'small_horizontal' | 'water_small' | 'generic' | 'truck'
  width?: number
  className?: string
}

function getImageDimensions(base64String): Promise<{ w: number; h: number }> {
  return new Promise(function (resolved, rejected) {
    var i = new Image()
    i.onload = function () {
      resolved({ w: i.width, h: i.height })
    }
    i.src = base64String
  })
}

const Tank = ({ stage, tankType, className, width }: TankProps) => {
  const [style, setStyle] = useState(null)

  useEffect(() => {
    async function computeStyles() {
      // small h294
      // large h405
      // horizontal h373
      // horizontal h93

      if (!width) {
        width = tankType == 'horizontal' || tankType == 'small_horizontal' || tankType == 'truck' ? 60 : 35
      }

      // aspect ratio
      // (original height / original width) x new width = new height

      const largeHeight = (783 / 437.6) * width
      const smallWaterHeight = (526 / 362) * width
      const horizontalHeight = (386 / 685.1) * width
      const smallHorizontalHeight = (386 / 685.1) * width

      switch (tankType) {
        case 'small': {
          const size = await getImageDimensions(TankSmallImage)
          setStyle({
            backgroundImage: `url(${TankSmallImage})`,
            backgroundPosition: `${-width * stage}px 0px`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1000%',
            width: `${width}px`, // default 30
            height: `${(size.h / (size.w / 10)) * width}px`,
          })
          break
        }

        case 'large': {
          const size = await getImageDimensions(TankLargeImage)
          setStyle({
            backgroundImage: `url(${TankLargeImage})`,
            backgroundPosition: `${-width * stage}px 0px`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1000%',
            width: `${width}px`, // default 30
            height: `${(size.h / (size.w / 10)) * width}px`,
          })
          break
        }

        case 'horizontal': {
          const size = await getImageDimensions(TankHorizonalImage)
          setStyle({
            backgroundImage: `url(${TankHorizonalImage})`,
            backgroundPosition: `${-width * stage}px 0px`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1000%',
            width: `${width}px`, // default 40
            height: `${(size.h / (size.w / 10)) * width}px`,
          })
          break
        }

        case 'small_horizontal': {
          const size = await getImageDimensions(TankHorizonalImage)
          setStyle({
            backgroundImage: `url(${TankHorizonalImage})`,
            backgroundPosition: `${-width * stage}px 0px`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1000%',
            width: `${width}px`, // default 40
            height: `${(size.h / (size.w / 10)) * width}px`,
          })
          break
        }

        case 'water_small': {
          const size = await getImageDimensions(WaterImage)
          setStyle({
            backgroundImage: `url(${WaterImage})`,
            backgroundPosition: `${-width * stage}px 0px`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1000%',
            width: `${width}px`, // default 40
            height: `${(size.h / (size.w / 10)) * width}px`,
          })
          break
        }

        case 'generic': {
          const size = await getImageDimensions(GenericImage)
          setStyle({
            backgroundImage: `url(${GenericImage})`,
            backgroundPosition: `${-width * stage}px 0px`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1000%',
            width: `${width}px`, // default 40
            height: `${(size.h / (size.w / 10)) * width}px`,
          })
          break
        }

        case 'truck': {
          const size = await getImageDimensions(TruckImage)
          setStyle({
            backgroundImage: `url(${TruckImage})`,
            backgroundPosition: `${-width * stage}px 0px`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1000%',
            width: `${width}px`, // default 40
            height: `${(size.h / (size.w / 10)) * width}px`,
          })
          break
        }
      }
    }

    computeStyles()
  }, [stage, tankType, className, width])

  if (!style) return null

  return <div style={style} className={className} />
}

export default Tank
