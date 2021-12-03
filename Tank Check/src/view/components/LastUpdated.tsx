import React, { useState } from 'react'
import { useEffect } from 'react'
import { DateTime } from 'luxon'
import { get_i18n, i18n } from '../../lib'

export default ({ lastSeen }) => {
  const [time, setTime] = useState<Date>()
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  lastSeen = DateTime.fromMillis(lastSeen || 0)
  const diff = lastSeen.diffNow()
  const updateString = `${
    diff.milliseconds > -1000
      ? `${get_i18n('just_now')}`
      : `${get_i18n('updated')} ${lastSeen.toRelative({ locale: navigator.language.split('-')[0] })}`
  }`

  return <div>{updateString}</div>
}
