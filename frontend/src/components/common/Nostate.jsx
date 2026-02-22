import React from 'react'

const Nostate = ({text = 'Records not found'}) => {
  return (
   <div className='text-center py-5'>
   {text}
   </div>
  )
}

export default Nostate