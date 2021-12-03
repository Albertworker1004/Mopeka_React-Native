import React, { Component } from 'react'
import './SwipeableListItem.css'
import { get_i18n, i18n } from '../../../lib'

interface SwipeableListItemProps {
  threshold?: number
  background?: HTMLDivElement
  className?: string
  onSwipe?: () => void
  onClick?: () => void
}

class SwipeableListItem extends Component<SwipeableListItemProps> {
  // DOM Refs
  listElement: HTMLDivElement
  wrapper: HTMLDivElement
  background: HTMLDivElement

  // Drag & Drop
  dragStartX: number = 0
  left: number = 0
  dragged: boolean = false

  // FPS Limit
  startTime: number
  fpsInterval: number = 1000 / 60

  constructor(props) {
    super(props)

    this.listElement = null
    this.wrapper = null
    this.background = null

    this.onTouchMove = this.onTouchMove.bind(this)
    this.onDragStartTouch = this.onDragStartTouch.bind(this)
    this.onDragEndTouch = this.onDragEndTouch.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.updatePosition = this.updatePosition.bind(this)
    this.onClicked = this.onClicked.bind(this)

    this.onSwiped = this.onSwiped.bind(this)
  }

  componentDidMount() {
    window.addEventListener('touchend', this.onDragEndTouch)
  }

  componentWillUnmount() {
    window.removeEventListener('touchend', this.onDragEndTouch)
  }

  onDragStartTouch(evt) {
    const touch = evt.targetTouches[0]
    this.onDragStart(touch.clientX)
    window.addEventListener('touchmove', this.onTouchMove)
  }

  onDragStart(clientX) {
    this.dragged = true
    this.dragStartX = clientX
    this.listElement.className = 'ListItem'
    this.startTime = Date.now()
    requestAnimationFrame(this.updatePosition)
  }

  onDragEndTouch(evt) {
    window.removeEventListener('touchmove', this.onTouchMove)
    this.onDragEnd()
  }

  onDragEnd() {
    if (this.dragged) {
      this.dragged = false

      const threshold = this.props.threshold || 0.3

      if (this.left < this.listElement.offsetWidth * threshold * -1) {
        this.left = -90
        // this.wrapper.style.maxHeight = '0'
        this.background.style.opacity = '1'
        this.onSwiped()
      } else {
        this.left = 0
      }

      this.listElement.className = 'BouncingListItem'
      this.listElement.style.transform = `translateX(${this.left}px)`
    }
  }

  onTouchMove(evt) {
    const touch = evt.targetTouches[0]
    const left = touch.clientX - this.dragStartX
    if (left < 0) {
      this.left = left
    } else if (left > 5) {
      this.left = 0
    }
  }

  updatePosition() {
    if (this.dragged) requestAnimationFrame(this.updatePosition)

    const now = Date.now()
    const elapsed = now - this.startTime

    if (this.dragged && elapsed > this.fpsInterval) {
      if (!this.listElement) return
      this.listElement.style.transform = `translateX(${this.left}px)`

      const opacity = parseFloat((Math.abs(this.left) / 100).toFixed(2))
      if (opacity < 1 && opacity.toString() !== this.background.style.opacity) {
        this.background.style.opacity = opacity.toString()
      }
      if (opacity >= 1) {
        this.background.style.opacity = '1'
      }

      this.startTime = Date.now()
    }
  }

  onClicked() {
    if (this.props.onClick) {
      this.props.onClick()
    }
  }

  onSwiped() {
    if (this.props.onSwipe) {
      this.props.onSwipe()
    }
  }

  render() {
    return (
      <div className={`Wrapper ${this.props.className}`} ref={div => (this.wrapper = div)}>
        <div ref={div => (this.background = div)} className="Background">
          {this.props.background ? this.props.background : <span onClick={this.onClicked}>{get_i18n('delete')}</span>}
        </div>
        <div ref={div => (this.listElement = div)} onTouchStart={this.onDragStartTouch} className="ListItem">
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default SwipeableListItem
