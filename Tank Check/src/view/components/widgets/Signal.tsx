import React from 'react'

import SignalImage from '../../../../www/img/wifi.png'

type SignalProps = {
  stage: number
  width?: number
  className?: string
}

const Signal = ({ stage, className, width = 30 }: SignalProps) => {
  const height = (48 / 48) * width

  let style = {
    backgroundImage: `url(${SignalImage})`,
    backgroundPosition: `${-width * stage}px 0px`,
    backgroundSize: '600% 100%',
    padding: '0px 0px 0px 0px',
    width: `${width}px`,
    height: `${height}px`,
  }

  return <div style={style} className={className} />
}

export default Signal
