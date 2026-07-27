import React from 'react'
import { UserContext } from './context'
import { useState } from 'react';
export default function Contextprovider({children}) {
     const [phone,setphone]= useState('');
      const [hide, setHide] = useState(false); 
  return (
    <UserContext.Provider value={{phone,setphone,hide,setHide}}>
        {children}
    </UserContext.Provider>
  )
}
