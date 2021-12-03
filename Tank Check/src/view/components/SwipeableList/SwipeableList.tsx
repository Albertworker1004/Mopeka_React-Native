// @ts-nocheck
import React, { Component } from 'react'
import './SwipeableList.css'

interface ChildPropTypes {
  background?: HTMLDivElement
}

class SwipeableList extends Component<ChildPropTypes> {
  render() {
    const { children } = this.props

    const childrenWithProps = React.Children.map(children, (child: React.ReactElement<ChildPropTypes>) => {
      if (child && !child.props.background) {
        return React.cloneElement(child as React.ReactElement<any>, {
          background: this.props.background,
        })
      }
      return child
    })

    return <div className="List">{childrenWithProps}</div>
  }
}

export default SwipeableList
