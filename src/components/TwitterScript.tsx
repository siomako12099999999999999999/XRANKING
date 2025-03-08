'use client'

import Script from 'next/script'
import { useEffect } from 'react'

export default function TwitterScript() {
  useEffect(() => {
    if (window.twttr) {
      window.twttr.widgets.load()
    }
  }, [])

  return (
    <Script
      id="twitter-widgets"
      src="https://platform.twitter.com/widgets.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.twttr) {
          window.twttr.widgets.load()
        }
      }}
    />
  )
}