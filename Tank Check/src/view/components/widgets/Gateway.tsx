import React from 'react'

import GatewayImage from '../../../../www/img/gateway.jpg'

type GatewayProps = {
  width?: number
  className?: string
}

const Gateway = ({ className, width = 30 }: GatewayProps) => {
  const height = (201 / 288) * width

  let style = {
    backgroundImage: `url(${GatewayImage})`,
    backgroundSize: '100%',
    padding: '0px 0px 0px 0px',
    width: `${width}px`,
    height: `${height}px`,
  }

  return <div style={style} className={className} />
}

export default Gateway
