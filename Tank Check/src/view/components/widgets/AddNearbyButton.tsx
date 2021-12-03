import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'

const AddNearbyButton = () => {
  return (
    <Link
      to="/nearby"
      className="flex bg-secondary w-12 h-12 items-center justify-center shadow-dark rounded-full z-40 absolute bottom-0 right-0 mr-10 mb-15">
      <FontAwesomeIcon icon={['fas', 'plus']} size="lg" className="text-white" />
    </Link>
  )
}

export default AddNearbyButton
