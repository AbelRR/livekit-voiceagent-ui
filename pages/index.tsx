'use client'
import { useState, useRef, useEffect } from 'react'
import { SplineScene } from "@/components/ui/spline"
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Spotlight } from "@/components/ui/spotlight"
import { Mic, MicOff, PhoneOff, Phone } from 'lucide-react'
import { 
  LiveKitRoom,
  AudioConference,
  RoomAudioRenderer,
  ControlBar,
  DisconnectButton,
  useTrackTranscription,
  useRemoteParticipants,
  useLocalParticipant,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track } from 'livekit-client'
import { LiveKitService, LiveKitConnectionDetails } from '@/lib/livekit-service'
import { cn } from '@/lib/utils'
import { HyperText } from "@/components/ui/hyper-text"

interface Message {
  text: string
  isBot: boolean
  timestamp: number
  id: string
  final: boolean
}

export default function Landing() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [connectionDetails, setConnectionDetails] = useState<LiveKitConnectionDetails | null>(null)
  const [isDark, setIsDark] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const processedFinalSegmentIds = useRef<Set<string>>(new Set())
  const [currentSegment, setCurrentSegment] = useState<Message | null>(null)
  const [isChatVisible, setIsChatVisible] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleTranscription = (segments: any[]) => {
    console.log('Raw transcription segments:', segments)
    
    const latestSegment = segments[segments.length - 1]
    if (!latestSegment?.text) return

    const isBot = latestSegment.participantIdentity?.startsWith('agent-') || false
    const segmentKey = `${latestSegment.id}-${latestSegment.text}`

    // For final segments, add to messages
    if (latestSegment.final) {
      if (processedFinalSegmentIds.current.has(segmentKey)) return
      processedFinalSegmentIds.current.add(segmentKey)

      setMessages(prev => {
        // If we have a current segment, convert it to a final message
        if (currentSegment && currentSegment.id === latestSegment.id) {
          return [...prev, {
            ...currentSegment,
            text: latestSegment.text,
            final: true
          }]
        }
        // Otherwise add as new message
        return [...prev, {
          text: latestSegment.text,
          isBot,
          timestamp: latestSegment.firstReceivedTime || Date.now(),
          id: latestSegment.id,
          final: true
        }]
      })
      setCurrentSegment(null)
      return
    }

    // For non-final segments, update current segment
    setCurrentSegment(prev => {
      // If this is a new speaker or new segment, create new current segment
      if (!prev || prev.id !== latestSegment.id || prev.isBot !== isBot) {
        return {
          text: latestSegment.text,
          isBot,
          timestamp: latestSegment.firstReceivedTime || Date.now(),
          id: latestSegment.id,
          final: false
        }
      }
      // If this is the same segment, just update the text
      if (prev.text !== latestSegment.text) {
        return {
          ...prev,
          text: latestSegment.text
        }
      }
      // No change needed
      return prev
    })
  }

  const handleStartCall = async () => {
    if (isConnecting || connectionDetails) return
    setIsConnecting(true)
    setIsChatVisible(true)
    try {
      let details = LiveKitService.getCachedDetails()
      if (!details) {
        details = await LiveKitService.getConnectionDetails()
      }
      setConnectionDetails(details)
    } catch (e) {
      console.error('Failed to get LiveKit connection details:', e)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleEndCall = () => {
    setIsConnected(false)
    setConnectionDetails(null)
    setMessages([])
    setIsMuted(false)
    setIsChatVisible(false)
  }

  return (
    <div className="relative min-h-screen w-full">
      <div className={`relative w-full min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-black/[0.96]' : 'bg-white'
      }`}>
        {/* Spotlight container */}
        <div className="absolute inset-0 overflow-hidden">
          {isDark && <Spotlight size={800} />}
        </div>

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Theme Toggle */}
          <div className="absolute top-4 right-4 z-[100] pointer-events-auto">
            <ThemeToggle 
              isDark={isDark} 
              onToggle={() => setIsDark(!isDark)} 
            />
          </div>

          {/* Content wrapper */}
          <div className="flex-1 flex">
            <div className="w-full max-w-7xl mx-auto px-4">
              {/* Large Title - Only show when chat is not visible */}
              {!isChatVisible && (
                <div className="absolute top-12 left-0 right-0 z-20 flex justify-center">
                  <div className="w-full max-w-4xl px-4">
                    <HyperText
                      text="AI VOICE ASSISTANT"
                      className={cn(
                        "text-[clamp(2rem,6vw,4rem)] font-bold tracking-tight text-center",
                        isDark ? "text-white/90" : "text-zinc-800/90"
                      )}
                      duration={1200}
                      framerProps={{
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0, y: -20 },
                      }}
                    />
                  </div>
                </div>
              )}

              <div className={cn(
                "flex flex-col-reverse md:flex-row transition-all duration-500",
                "h-screen md:h-auto md:mt-20",
                isChatVisible ? "gap-8 md:gap-16" : "gap-0"
              )}>
                {/* Left Side - Chat & Controls */}
                <div className={cn(
                  "w-full md:flex-1 md:max-w-2xl transition-all duration-500",
                  "fixed md:static bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm md:bg-transparent",
                  "z-10 px-4 md:px-0",
                  isChatVisible 
                    ? "h-[35vh] md:h-[700px] opacity-100 translate-y-0"
                    : "h-0 md:h-auto opacity-0 translate-y-full md:-translate-x-full hidden"
                )}>
                  <div className="h-full max-w-4xl mx-auto px-4">
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`chat-bubble ${msg.isBot ? '' : 'sent'}`}
                          >
                            <ChatBubbleAvatar 
                              fallback={msg.isBot ? 'AI' : 'US'} 
                            />
                            <div className={`chat-bubble-message ${msg.isBot ? 'received' : 'sent'}`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        {currentSegment && (
                          <div 
                            key={currentSegment.id}
                            className={`chat-bubble ${currentSegment.isBot ? '' : 'sent'}`}
                          >
                            <ChatBubbleAvatar 
                              fallback={currentSegment.isBot ? 'AI' : 'US'} 
                            />
                            <div 
                              className={`chat-bubble-message ${
                                currentSegment.isBot ? 'received' : 'sent'
                              } in-progress`}
                            >
                              {currentSegment.text}
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      <div className="footer-controls mt-auto"> {/* Added mt-auto */}
                        <div className="p-3">
                          {!connectionDetails ? (
                            <div className="flex items-center justify-center">
                              <button
                                onClick={handleStartCall}
                                disabled={isConnecting}
                                className="lk-button"
                              >
                                {isConnecting ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Phone className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <LiveKitRoom
                              data-lk-theme="default"
                              token={connectionDetails.participantToken}
                              serverUrl={connectionDetails.serverUrl}
                              connect={true}
                              audio={true}
                              video={false}
                              onConnected={() => setIsConnected(true)}
                              onDisconnected={handleEndCall}
                              style={{ 
                                '--lk-bg': 'transparent',
                                '--lk-control-bg': 'transparent',
                                '--lk-control-hover-bg': 'rgba(255, 255, 255, 0.1)',
                                '--lk-disconnect-bg': 'transparent',
                                '--lk-disconnect-color': 'var(--danger)',
                              } as React.CSSProperties}
                            >
                              <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                                  <span className="text-sm text-muted-foreground">
                                    {isConnected ? 'Connected' : 'Connecting...'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <ControlBar
                                    variation="minimal"
                                    controls={{ 
                                      microphone: true,
                                      screenShare: false,
                                      camera: false,
                                      leave: false,
                                      settings: false,
                                      chat: false
                                    }}
                                  />
                                  <DisconnectButton onClick={handleEndCall}>
                                    <PhoneOff className="h-4 w-4" />
                                  </DisconnectButton>
                                </div>
                              </div>
                              <div className="hidden">
                                <AudioConference />
                              </div>
                              <TranscriptionRenderer onTranscription={handleTranscription} />
                            </LiveKitRoom>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - 3D Bot */}
                <div className={cn(
                  "relative transition-all duration-500",
                  "w-full",
                  isChatVisible 
                    ? "h-[65vh] top-0 fixed md:static md:h-[700px] md:flex-1 md:-mr-24"
                    : "h-[calc(100vh-4rem)] md:h-[700px] flex-[2] mx-auto flex items-center"
                )}>
                  <SplineScene 
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full object-contain"
                    options={{
                      autostart: false,
                      animations: false
                    }}
                  />
                  {!isChatVisible && (
                    <>
                      {/* Call to action button */}
                      <div className="absolute left-1/2 bottom-8 -translate-x-1/2 w-full px-4 md:px-0 md:w-auto">
                        <button
                          onClick={handleStartCall}
                          disabled={isConnecting}
                          className="w-full md:w-auto group flex flex-col items-center gap-2"
                        >
                          <HyperText
                            text="START CONVERSATION"
                            className={cn(
                              "text-[clamp(1rem,3vw,1.5rem)] font-medium tracking-wide animate-pulse",
                              isDark 
                                ? "text-white/70 group-hover:text-white/90 group-hover:animate-none" 
                                : "text-zinc-600/90 group-hover:text-zinc-800 group-hover:animate-none"
                            )}
                            duration={800}
                            framerProps={{
                              initial: { opacity: 0, y: 10 },
                              animate: { opacity: 1, y: 0 },
                              exit: { opacity: 0, y: -10 },
                            }}
                          />
                          {isConnecting && (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LiveKit credit - At the very bottom */}
          {!isChatVisible && (
            <div className="fixed bottom-4 left-0 right-0 w-full pointer-events-none select-none">
              <HyperText
                text="POWERED BY LIVEKIT"
                className={cn(
                  "text-[clamp(1.2rem,4vw,2rem)] font-medium tracking-[0.2em] text-center",
                  isDark 
                    ? "text-white/20 [text-shadow:0_0_30px_rgba(255,255,255,0.1)]" 
                    : "text-black/20 [text-shadow:0_0_30px_rgba(0,0,0,0.05)]"
                )}
                duration={1500}
                framerProps={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: -20 },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Update TranscriptionRenderer component
const TranscriptionRenderer = ({ 
  onTranscription 
}: { 
  onTranscription: (segments: any[]) => void 
}) => {
  const { localParticipant } = useLocalParticipant()
  const remoteParticipants = useRemoteParticipants()
  const [transcriptionTracks, setTranscriptionTracks] = useState<any[]>([])
  
  useEffect(() => {
    const tracks: any[] = []
    const agentParticipant = remoteParticipants.find(p => p.identity.startsWith('agent-'))
    
    if (agentParticipant) {
      const audioPub = Array.from(agentParticipant.trackPublications.values()).find(
        pub => pub.source === Track.Source.Microphone
      )
      if (audioPub?.track) {
        tracks.push({
          participant: agentParticipant,
          publication: audioPub,
          track: audioPub.track,
          source: Track.Source.Microphone
        })
      }
    }

    if (localParticipant) {
      const localAudioPub = Array.from(localParticipant.trackPublications.values()).find(
        pub => pub.source === Track.Source.Microphone
      )
      if (localAudioPub?.track) {
        tracks.push({
          participant: localParticipant,
          publication: localAudioPub,
          track: localAudioPub.track,
          source: Track.Source.Microphone
        })
      }
    }

    // Only update if tracks changed
    const trackIds = tracks.map(t => t.participant.identity).sort().join(',')
    setTranscriptionTracks(prev => {
      const prevIds = prev.map(t => t.participant.identity).sort().join(',')
      if (prevIds !== trackIds) return tracks
      return prev
    })
  }, [remoteParticipants, localParticipant])

  return (
    <>
      {transcriptionTracks.map((trackRef) => (
        <TranscriptionTrack 
          key={trackRef.participant.identity}
          trackRef={trackRef}
          onTranscription={onTranscription}
        />
      ))}
    </>
  )
}

// Update TranscriptionTrack component
const TranscriptionTrack = ({ 
  trackRef, 
  onTranscription 
}: { 
  trackRef: any
  onTranscription: (segments: any[]) => void 
}) => {
  const lastProcessedFinal = useRef<string | null>(null)
  const currentSegmentId = useRef<string | null>(null)

  useTrackTranscription(trackRef, {
    bufferSize: 10,
    onTranscription: (segments) => {
      const latestSegment = segments[segments.length - 1]
      if (!latestSegment) return

      // For final segments, ensure we haven't processed this exact segment before
      if (latestSegment.final) {
        const segmentKey = `${latestSegment.id}-${latestSegment.text}`
        if (lastProcessedFinal.current === segmentKey) return
        lastProcessedFinal.current = segmentKey
        currentSegmentId.current = null
      } else {
        // For non-final segments, only process if it's new or updated
        if (currentSegmentId.current === latestSegment.id && 
            lastProcessedFinal.current === `${latestSegment.id}-${latestSegment.text}`) {
          return
        }
        currentSegmentId.current = latestSegment.id
        lastProcessedFinal.current = `${latestSegment.id}-${latestSegment.text}`
      }

      onTranscription([{
        ...latestSegment,
        participantIdentity: trackRef.participant.identity
      }])
    }
  })

  return null
}
