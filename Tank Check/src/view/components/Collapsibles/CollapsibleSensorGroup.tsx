import React, { ReactNode, useState, useRef, useEffect } from 'react'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconName } from '@fortawesome/fontawesome-svg-core'

type CollapsibleSensorGroupProps = {
  title: string
  icon?: string
  iconEnabled?: boolean
  text?: string
  textEnabled?: boolean
  highlight?: boolean
  children: ReactNode
}

const CollapsibleSensorGroup = ({ title, children, icon, iconEnabled, text, textEnabled, highlight }: CollapsibleSensorGroupProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [heightState, setHeightState] = useState<number>(0)
  const content = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHeightState(open ? content.current.scrollHeight : 0)
  }, [open, children])

  const toggle = () => {
    const nextOpenState = !open
    setOpen(nextOpenState)
    if (nextOpenState) {
      setTimeout(() => {
        const yOffset = document.getElementById('nav').offsetHeight; 
        const element = header.current
        const y = element.getBoundingClientRect().top + window.pageYOffset - yOffset;

        window.scrollTo({top: y, behavior: 'smooth'});
        
      }, 250)
    }
  }

  const transitionStyle = {
    transition: 'all 0.3s ease-in-out',
  }

  const iconClasses = classNames('text-gray-700 mr-2 ml-auto', {
    'rotate-180': open,
  })

  const classes = classNames('flex px-8 py-6 border-b', {
    'listitem-highlight': highlight,
    'collapsible-open-theme': open,
    'collapsible-close-theme': !open,
  })

  return (
    <div className="flex flex-col" ref={header}>
      <div
        onClick={toggle}
        className={classes}>
        {iconEnabled && (
          <FontAwesomeIcon icon={['fas', `${icon}` as IconName]} size="lg" className="mr-2 text-orange-400" />
        )}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {textEnabled && <span className="m-auto text-sm text-green-500">{text}</span>}
        <FontAwesomeIcon icon={['fas', 'chevron-down']} size="lg" style={transitionStyle} className={iconClasses} />
      </div>
      <div ref={content} className="overflow-hidden" style={{ maxHeight: `${heightState}px`, ...transitionStyle }}>
        {children}
      </div>
    </div>
  )
}

export default CollapsibleSensorGroup
