import React from 'react'

import QualityStarsImage from '../../../../www/img/stars.png'

type QualityStarsProps = {
  stage: number
  width?: number
  className?: string
}

const QualityStars = ({ stage, className, width = 11 }: QualityStarsProps) => {
  const height = (634 / 225) * width

  let style = {
    backgroundImage: `url(${QualityStarsImage})`,
    backgroundPosition: `${-width * stage}px 0px`,
    backgroundSize: '400% 100%',
    padding: '0px 0px 0px 0px',
    width: `${width}px`,
    height: `${height}px`,
  }

  return <div style={style} className={className} />
}

export default QualityStars
