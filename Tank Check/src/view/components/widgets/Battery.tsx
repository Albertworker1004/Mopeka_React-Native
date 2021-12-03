import React from 'react'

import BatteryImage from '../../../../www/img/battery.png'

type BatteryProps = {
  stage: number
  width?: number
  className?: string
}

const Battery = ({ stage, className, width = 15 }: BatteryProps) => {
  const height = (52 / 25) * width

  let style = {
    backgroundImage: `url(${BatteryImage})`,
    backgroundPosition: `${-width * stage}px 0px`,
    backgroundSize: '1000% 100%',
    padding: '0px 0px 0px 0px',
    width: `${width}px`,
    height: `${height}px`,
  }

  return <div style={style} className={className} />
}

export default Battery
