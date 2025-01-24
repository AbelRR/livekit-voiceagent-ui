import { useEffect } from 'react'
import { LiveKitService } from '@/lib/livekit-service'
import '../styles/globals.css'
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Prefetch connection details when the app starts
    void LiveKitService.prefetchConnectionDetails()
  }, [])

  return <Component {...pageProps} />
}

export default MyApp
