import React, { FunctionComponent } from 'react'
import classNames from 'classnames'

type ToggleSwitchProps = {
  name: string
  enabled: boolean
  disabled?: boolean
  theme: string
  onStateChange: (name: string, value: boolean) => void
}

const ToggleSwitch: FunctionComponent<ToggleSwitchProps> = ({
  name,
  enabled,
  onStateChange,
  disabled,
  theme = 'default',
}) => {
  let dotStyles: any = {
    transform: `translateX(${enabled ? 100 : 0}%)`,
    transition: 'all 0.3s ease-in-out',
  }

  let bgStyles: any = {
    transition: 'all 0.3s ease-in-out',
  }

  let classes = classNames('w-12', 'h-6', 'rounded-full', 'shadow-inner', 'inline-block', {
    'bg-gray-200': !enabled,
    'bg-secondary': enabled,
  })

  let dotClasses = 'w-1/2 h-full bg-white rounded-full shadow'

  if (theme == 'lippert') {
    dotStyles = {
      transform: `translateX(${enabled ? 150 : 20}%)`,
      transition: 'all 0.3s ease-in-out',
      height: '80%',
    }

    classes = classNames('w-20 h-9 rounded-full flex items-center shadow-inner inline-block bg-white')

    dotClasses = 'bg-white rounded-full shadow'

    if (enabled) {
      dotStyles = {
        ...dotStyles,
        boxShadow: 'inset 5px 5px 10px 0px rgb(255 255 255 / 0.8), 0 0 2px 1px hsl(204 137% 65% / 1)',
        backgroundColor: '#7ec6f7',
        height: '80%',
        width: '40%',
      }

      bgStyles = {
        ...bgStyles,
        boxShadow: 'inset 0 20px 15px 3px rgb(126 198 247 / 80%)',
      }
    } else {
      dotStyles = {
        ...dotStyles,
        boxShadow: 'rgb(0 0 0 / 26%) 0 0 10px 0px inset, rgb(0 0 0 / 14%) 0px 0px 2px 1px',
        backgroundColor: 'white',
        height: '80%',
        width: '35%',
      }

      bgStyles = {
        ...bgStyles,
        boxShadow: 'rgb(0 0 0 / 15%) 8px 5px 15px 3px inset',
      }
    }
  }

  const toggleSwitch = () => {
    if (!disabled) {
      onStateChange(name, !enabled)
    }
  }

  return (
    <div className={classes} style={bgStyles} onClick={toggleSwitch}>
      <div style={dotStyles} className={dotClasses}></div>
    </div>
  )
}

export default ToggleSwitch

// w-20 h-9 rounded-full flex items-center shadow-inner inline-block bg-secondary
// w-1/2 rounded-full shadow bg-white
//               height 80%

// transform: translateX(20%);
// transition: all 0.3s ease-in-out 0s;
// height: 80%;
// box-shadow: inset 5px 5px 10px 0px rgb(255 255 255 / 0.8), 0 0 2px 1px hsl(204 137% 65% / 1);
// background-color: #7ec6f7;
