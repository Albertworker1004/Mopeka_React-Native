import React from 'react'

import CloudImage from '../../../../www/img/cloud.png'

type CloudProps = {
  width?: number
  className?: string
}

const Cloud = ({ className, width = 30 }: CloudProps) => {
  const height = (48 / 48) * width

  let style = {
    backgroundImage: `url(${CloudImage})`,
    // backgroundPosition: `100%`,
    backgroundSize: '100%',
    padding: '0px 0px 0px 0px',
    width: `${width}px`,
    height: `${width}px`,
  }

  return <div style={style} className={className} />
}

export default Cloud
