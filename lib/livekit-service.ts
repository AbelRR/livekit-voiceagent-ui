export interface LiveKitConnectionDetails {
  serverUrl: string
  roomName: string
  participantName: string
  participantToken: string
}

export class LiveKitService {
  private static cachedDetails: LiveKitConnectionDetails | null = null

  static validateEnvironment() {
    console.log('ENV vars:', {
      sandboxId: process.env.NEXT_PUBLIC_LIVEKIT_SANDBOX_ID
    })
    if (!process.env.NEXT_PUBLIC_LIVEKIT_SANDBOX_ID) {
      throw new Error('Required LiveKit environment variables are missing')
    }
  }

  static async prefetchConnectionDetails(): Promise<void> {
    this.validateEnvironment()
    console.log("🔄 Prefetching LiveKit connection details...")
    try {
      this.cachedDetails = await this.getConnectionDetails()
      console.log("✅ Successfully prefetched LiveKit connection details")
    } catch (error) {
      console.error("❌ Failed to prefetch LiveKit connection details:", error)
    }
  }

  static async getConnectionDetails(participantName: string = "user-1"): Promise<LiveKitConnectionDetails> {
    this.validateEnvironment()
    const urlComponents = new URL("https://cloud-api.livekit.io/api/sandbox/connection-details")
    urlComponents.searchParams.append("participantName", participantName)

    const response = await fetch(urlComponents.toString(), {
      method: 'GET',
      headers: {
        'X-Sandbox-ID': process.env.NEXT_PUBLIC_LIVEKIT_SANDBOX_ID as string
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch LiveKit details: ${response.statusText}`)
    }

    return await response.json()
  }

  static getCachedDetails(): LiveKitConnectionDetails | null {
    return this.cachedDetails
  }
} 