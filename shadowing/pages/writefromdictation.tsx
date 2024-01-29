import { Inter } from "next/font/google";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, startAfter, limit  } from "firebase/firestore";
import { db } from "../firebase";
import Image from "next/image";
import Link from "next/link";


const inter = Inter({ subsets: ["latin"] });

function writefromdictation() {
  return (
    <main
    className={
      "flex mx-auto min-h-screen flex-col items-center min-w-screen  p-24 space-y-5 w-full"
    }
  >
    <Link href="/" className="flex justify-center">
      <Image
        src="/logo1.png"
        alt="Logo"
        width={300} // Set the desired width
        height={200} // Set the desired height
      />
    </Link>
    <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-600 dark:text-white">
      Write From Dictation
    </h1>   
    <audio src="/shadowing/1_Students find true or false questions harder than short answers..mp3"></audio>  
   

    
  </main>
  )
}

export default writefromdictation