import React from 'react'
import { connect, useDispatch } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconName } from '@fortawesome/fontawesome-svg-core'

import { RootState } from '../../store/reducers'
import { removeToast } from '../../store/reducers/toaster/reducers'

type ToasterProps = ReturnType<typeof mapStateToProps>

const Toaster = (props: ToasterProps) => {
  const dispatch = useDispatch()

  // const remove = useCallback(
  //   (id: number) => {
  //     dispatch(removeToast(id));
  //   }, []
  // );

  const toastItems = props.toasts.map((t, index) => {
    let iconName = 'exclamation-triangle'
    let textColorClass
    let boxColors

    if (t.type == 'success') {
      iconName = 'check-circle'
      textColorClass = 'text-green-900'
      boxColors = 'bg-green-200 border-green-400'
    }
    if (t.type == 'info') {
      iconName = 'info-circle'
      textColorClass = 'text-blue-900'
      boxColors = 'bg-blue-200 border-blue-400'
    }
    if (t.type == 'warning') {
      textColorClass = 'text-orange-900'
      boxColors = 'bg-orange-200 border-orange-400'
    }
    if (t.type == 'error') {
      textColorClass = 'text-red-900'
      boxColors = 'bg-red-200 border-red-400'
    }

    return (
      <div
        onClick={() => dispatch(removeToast(t))}
        key={index}
        className={`flex items-center w-3/4 px-4 py-3 mb-2 text-sm border rounded shadow-md ${boxColors} ${textColorClass}`}>
        <div className="mr-3">
          <FontAwesomeIcon icon={['fas', iconName as IconName]} size="lg" />
        </div>
        <div className="flex flex-col">
          {t.title && <h3 className="font-semibold text-base">{t.title}</h3>}
          <div>{t.message}</div>
        </div>
      </div>
    )
  })

  return <div className="fixed w-full mb-4 bottom-0 flex flex-col items-center z-50">{toastItems.reverse()}</div>
}

const mapStateToProps = (state: RootState) => {
  return {
    toasts: state.toaster.toasts,
  }
}

export default connect(mapStateToProps)(Toaster)
