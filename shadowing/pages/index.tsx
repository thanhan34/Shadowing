import Image from 'next/image'
import { Inter } from 'next/font/google'
import ShadowingSentence from '@/components/ShadowingSentence'
import React, {useState} from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  
  
  
  return (
    <main
      className={`flex mx-auto min-h-screen flex-col items-center justify-between p-24 `}
    >
      
      <ShadowingSentence />

      

     
    </main>
  )
}
