'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  HiChatBubbleLeftRight,
  HiPhone,
  HiArrowLeft,
  HiMicrophone,
  HiMicrophoneSlash,
  HiXMark,
  HiPaperAirplane,
  HiHome,
  HiClipboardDocumentList,
  HiCheckCircle,
  HiSignal,
  HiClock,
  HiChevronDown,
  HiChevronUp,
  HiArrowPath,
  HiLanguage,
  HiGlobeAlt,
} from 'react-icons/hi2'

// ─── Constants ───
const CHAT_AGENT_ID = '699f6f91c0d92a0f4e4754b8'
const VOICE_AGENT_ID = '699f6f914b34ff0a9387f8e0'
const RAG_ID = '699f6f75f572c99c0ffb74d6'

// ─── Types ───
type SupportedLanguage = 'auto' | 'english' | 'hindi' | 'tamil' | 'telugu' | 'kannada' | 'malayalam' | 'bengali' | 'marathi' | 'gujarati' | 'punjabi' | 'urdu' | 'odia' | 'assamese'

interface LanguageOption {
  code: SupportedLanguage
  label: string
  nativeLabel: string
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Auto-detect', nativeLabel: 'Auto' },
  { code: 'english', label: 'English', nativeLabel: 'English' },
  { code: 'hindi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'tamil', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'telugu', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'kannada', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'malayalam', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'bengali', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'marathi', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'gujarati', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'punjabi', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'urdu', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'odia', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'assamese', label: 'Assamese', nativeLabel: 'অসমীয়া' },
]

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  timestamp: Date
  category?: string
  resolved?: boolean
  detectedLanguage?: string
}

interface Conversation {
  id: string
  channel: 'chat' | 'voice'
  messages: ChatMessage[]
  transcripts: VoiceTranscript[]
  startedAt: Date
  status: 'active' | 'resolved'
  lastMessage: string
}

interface VoiceTranscript {
  role: string
  text: string
  timestamp: Date
}

type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'
type Screen = 'dashboard' | 'chat' | 'voice' | 'history'

// ─── Helpers ───
function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

function formatTime(date: Date) {
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDate(date: Date) {
  try {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

function getCategoryColor(category?: string): string {
  switch (category) {
    case 'product_info': return 'bg-blue-900/40 text-blue-300 border-blue-700/50'
    case 'order_tracking': return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
    case 'complaint': return 'bg-red-900/40 text-red-300 border-red-700/50'
    case 'technical_support': return 'bg-purple-900/40 text-purple-300 border-purple-700/50'
    case 'general': return 'bg-amber-900/40 text-amber-300 border-amber-700/50'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

function getCategoryLabel(category?: string): string {
  switch (category) {
    case 'product_info': return 'Product Info'
    case 'order_tracking': return 'Order Tracking'
    case 'complaint': return 'Complaint'
    case 'technical_support': return 'Tech Support'
    case 'general': return 'General'
    default: return 'General'
  }
}

function getLanguageDisplayName(langCode?: string): string {
  if (!langCode) return ''
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === langCode)
  return found ? found.nativeLabel : langCode
}

// ─── Language Selector ───
function LanguageSelector({
  selectedLanguage,
  onSelect,
  compact,
}: {
  selectedLanguage: SupportedLanguage
  onSelect: (lang: SupportedLanguage) => void
  compact?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0]

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen((p) => !p)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 text-foreground transition-colors duration-150 ${compact ? 'text-[10px]' : 'text-xs'}`}
        title="Select language"
      >
        <HiLanguage className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span className="font-sans">{currentLang.nativeLabel}</span>
        <HiChevronDown className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-56 max-h-72 overflow-y-auto bg-popover border border-border rounded-xl shadow-xl py-1.5 scrollbar-thin">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onSelect(lang.code)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-100 hover:bg-muted/50 ${selectedLanguage === lang.code ? 'bg-accent/10 text-accent' : 'text-foreground'}`}
            >
              <span className="text-xs font-sans flex-1">{lang.label}</span>
              <span className="text-xs text-muted-foreground font-sans">{lang.nativeLabel}</span>
              {selectedLanguage === lang.code && <HiCheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Markdown Renderer ───
function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

// ─── Sample Data ───
function buildSampleConversations(): Conversation[] {
  const now = Date.now()
  return [
    {
      id: 'sample-1',
      channel: 'chat',
      messages: [
        { id: 's1', role: 'user', text: 'Hi, I need help tracking my order #HM-20485', timestamp: new Date(now - 3600000) },
        { id: 's2', role: 'agent', text: 'I would be happy to help you track your order. Order #HM-20485 is currently **in transit** and is expected to arrive by March 2nd. It was shipped via Express Delivery from our warehouse in Austin, TX.', timestamp: new Date(now - 3500000), category: 'order_tracking', resolved: true },
        { id: 's3', role: 'user', text: 'Great, thanks! Can I change the delivery address?', timestamp: new Date(now - 3400000) },
        { id: 's4', role: 'agent', text: 'Since the package is already in transit, unfortunately we cannot modify the delivery address at this stage. However, you can contact the carrier directly with your tracking number **TRK-9847261** to arrange a redirect or hold at a nearby pickup location.', timestamp: new Date(now - 3300000), category: 'order_tracking', resolved: true },
      ],
      transcripts: [],
      startedAt: new Date(now - 3600000),
      status: 'resolved',
      lastMessage: 'Since the package is already in transit...',
    },
    {
      id: 'sample-2',
      channel: 'voice',
      messages: [],
      transcripts: [
        { role: 'agent', text: 'Welcome to Homemate Support. How can I assist you today?', timestamp: new Date(now - 7200000) },
        { role: 'user', text: 'I am having trouble with my smart thermostat installation.', timestamp: new Date(now - 7100000) },
        { role: 'agent', text: 'I can help with that. Let me walk you through the setup process step by step. First, make sure the thermostat is powered on and in pairing mode.', timestamp: new Date(now - 7000000) },
      ],
      startedAt: new Date(now - 7200000),
      status: 'resolved',
      lastMessage: 'Smart thermostat installation support',
    },
    {
      id: 'sample-3',
      channel: 'chat',
      messages: [
        { id: 's5', role: 'user', text: 'What is your return policy for kitchen appliances?', timestamp: new Date(now - 86400000) },
        { id: 's6', role: 'agent', text: 'Our return policy for kitchen appliances allows returns within **30 days** of purchase. Items must be in original packaging and unused condition. For defective items, we offer a full refund or replacement within **90 days**. Would you like to start a return?', timestamp: new Date(now - 86300000), category: 'product_info', resolved: true },
      ],
      transcripts: [],
      startedAt: new Date(now - 86400000),
      status: 'resolved',
      lastMessage: 'Our return policy for kitchen appliances...',
    },
  ]
}

// ─── Error Boundary ───
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Typing Indicator ───
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex items-center gap-1 bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-md">
        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// ─── Voice Waveform ───
function VoiceWaveform({ status }: { status: VoiceStatus }) {
  const isActive = status === 'connected' || status === 'listening' || status === 'speaking'
  const bars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center justify-center gap-1.5 h-16">
      {bars.map((b) => (
        <div
          key={b}
          className={`w-1.5 rounded-full transition-all duration-300 ${status === 'speaking' ? 'bg-accent' : status === 'listening' ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}
          style={{
            height: isActive ? `${16 + Math.sin((b / 5) * Math.PI) * 28}px` : '8px',
            animation: isActive ? `pulse 1.2s ease-in-out ${b * 0.15}s infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ─── Agent Status Panel ───
function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: CHAT_AGENT_ID, name: 'Chat Support Agent', purpose: 'Live chat, product info, order tracking' },
    { id: VOICE_AGENT_ID, name: 'Voice Support Agent', purpose: 'Phone support, voice-based assistance' },
  ]
  return (
    <Card className="border-border bg-card shadow-lg">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">Agent Status</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2.5">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-foreground truncate">{agent.name}</p>
              <p className="text-[9px] text-muted-foreground truncate">{agent.purpose}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Dashboard Screen ───
function DashboardScreen({
  conversations,
  onStartChat,
  onStartCall,
  onViewHistory,
}: {
  conversations: Conversation[]
  onStartChat: () => void
  onStartCall: () => void
  onViewHistory: () => void
}) {
  const recentConvos = Array.isArray(conversations) ? conversations.slice(0, 5) : []
  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Support Hub</h1>
        <p className="text-muted-foreground mt-1.5 text-sm font-sans" style={{ lineHeight: '1.65' }}>
          Welcome to Homemate Customer Service. Chat or call in English, Hindi, Tamil, Telugu, and 9 more Indian languages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:border-accent/50" onClick={onStartChat}>
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors duration-300">
              <HiChatBubbleLeftRight className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground">Start Chat</h3>
              <p className="text-sm text-muted-foreground mt-1 font-sans" style={{ lineHeight: '1.65' }}>
                Get instant help via text chat in English, Hindi, Tamil, Telugu, and more
              </p>
            </div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-sans">Open Chat</Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:border-accent/50" onClick={onStartCall}>
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors duration-300">
              <HiPhone className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground">Call Support</h3>
              <p className="text-sm text-muted-foreground mt-1 font-sans" style={{ lineHeight: '1.65' }}>
                Speak with our AI voice assistant in your preferred Indian language
              </p>
            </div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-sans">Start Call</Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-foreground">Recent Conversations</h2>
          {recentConvos.length > 0 && (
            <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80 font-sans text-xs" onClick={onViewHistory}>View All</Button>
          )}
        </div>

        {recentConvos.length === 0 ? (
          <Card className="border-border bg-card shadow-md">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <HiClipboardDocumentList className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm font-sans" style={{ lineHeight: '1.65' }}>
                No conversations yet -- start a chat or call!
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <Button variant="outline" size="sm" onClick={onStartChat} className="font-sans text-xs border-border">
                  <HiChatBubbleLeftRight className="w-3.5 h-3.5 mr-1.5" /> Chat
                </Button>
                <Button variant="outline" size="sm" onClick={onStartCall} className="font-sans text-xs border-border">
                  <HiPhone className="w-3.5 h-3.5 mr-1.5" /> Call
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentConvos.map((convo) => (
              <Card key={convo.id} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onViewHistory}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${convo.channel === 'chat' ? 'bg-blue-900/30' : 'bg-emerald-900/30'}`}>
                    {convo.channel === 'chat' ? <HiChatBubbleLeftRight className="w-4 h-4 text-blue-400" /> : <HiPhone className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${convo.channel === 'chat' ? 'border-blue-700/50 text-blue-300' : 'border-emerald-700/50 text-emerald-300'}`}>
                        {convo.channel === 'chat' ? 'Chat' : 'Voice'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-sans">{formatDate(convo.startedAt)}</span>
                    </div>
                    <p className="text-sm text-foreground truncate mt-0.5">{convo.lastMessage || 'No messages'}</p>
                  </div>
                  <Badge variant="outline" className={`flex-shrink-0 text-[10px] px-1.5 py-0 border ${convo.status === 'resolved' ? 'border-emerald-700/50 text-emerald-400' : 'border-amber-700/50 text-amber-400'}`}>
                    {convo.status === 'resolved' ? 'Resolved' : 'Active'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Chat Screen ───
function ChatScreen({
  messages,
  isLoading,
  onSend,
  onBack,
  selectedLanguage,
  onLanguageChange,
  detectedLanguage,
}: {
  messages: ChatMessage[]
  isLoading: boolean
  onSend: (text: string) => void
  onBack: () => void
  selectedLanguage: SupportedLanguage
  onLanguageChange: (lang: SupportedLanguage) => void
  detectedLanguage?: string
}) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const safeMessages = Array.isArray(messages) ? messages : []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-1.5 h-auto">
          <HiArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <HiChatBubbleLeftRight className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="font-serif text-sm font-semibold text-foreground">Chat Support</h2>
            <p className="text-[10px] text-muted-foreground font-sans">Homemate AI Assistant</p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-700/50 text-emerald-400 text-[10px] px-1.5 py-0">
          <HiSignal className="w-3 h-3 mr-1" /> Online
        </Badge>
      </div>

      {/* Language indicator bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <HiGlobeAlt className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-sans">
            {selectedLanguage === 'auto'
              ? detectedLanguage
                ? `Auto-detected: ${getLanguageDisplayName(detectedLanguage)}`
                : 'Language: Auto-detect'
              : `Language: ${getLanguageDisplayName(selectedLanguage)}`}
          </span>
        </div>
        <LanguageSelector selectedLanguage={selectedLanguage} onSelect={onLanguageChange} compact />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {safeMessages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <HiChatBubbleLeftRight className="w-7 h-7 text-accent/60" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Start a Conversation</h3>
            <p className="text-sm text-muted-foreground max-w-sm font-sans" style={{ lineHeight: '1.65' }}>
              Ask about products, track orders, get technical support, or submit a complaint. Our AI assistant is here to help.
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-muted-foreground">
              <HiLanguage className="w-4 h-4" />
              <span className="text-xs font-sans">Supports English, Hindi, Tamil, Telugu, Kannada, and 8 more Indian languages</span>
            </div>
          </div>
        )}

        {safeMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%]">
              <div className={`rounded-2xl px-4 py-3 shadow-md ${msg.role === 'user' ? 'bg-accent text-accent-foreground rounded-br-sm' : 'bg-card border border-border text-card-foreground rounded-bl-sm'}`}>
                {msg.role === 'agent' ? renderMarkdown(msg.text) : (
                  <p className="text-sm" style={{ lineHeight: '1.65' }}>{msg.text}</p>
                )}
              </div>
              <div className={`flex items-center gap-2 mt-1.5 px-1 flex-wrap ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className="text-[10px] text-muted-foreground font-sans">{formatTime(msg.timestamp)}</span>
                {msg.role === 'agent' && msg.category && (
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${getCategoryColor(msg.category)}`}>
                    {getCategoryLabel(msg.category)}
                  </Badge>
                )}
                {msg.role === 'agent' && msg.detectedLanguage && msg.detectedLanguage !== 'english' && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border border-cyan-700/50 bg-cyan-900/30 text-cyan-300">
                    <HiLanguage className="w-2.5 h-2.5 mr-0.5" />
                    {getLanguageDisplayName(msg.detectedLanguage)}
                  </Badge>
                )}
                {msg.role === 'agent' && msg.resolved === true && (
                  <HiCheckCircle className="w-3 h-3 text-emerald-400" />
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && <TypingIndicator />}
      </div>

      <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedLanguage === 'hindi' ? 'अपना सवाल टाइप करें...' : selectedLanguage === 'tamil' ? 'உங்கள் கேள்வியை தட்டச்சு செய்யுங்கள்...' : selectedLanguage === 'telugu' ? 'మీ ప్రశ్నను టైప్ చేయండి...' : selectedLanguage === 'kannada' ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...' : selectedLanguage === 'bengali' ? 'আপনার প্রশ্ন লিখুন...' : selectedLanguage === 'marathi' ? 'तुमचा प्रश्न टाइप करा...' : selectedLanguage === 'malayalam' ? 'നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക...' : selectedLanguage === 'gujarati' ? 'તમારો પ્રશ્ન ટાઈપ કરો...' : 'Type your question in any language...'}
            className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground font-sans text-sm"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={!inputValue.trim() || isLoading} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 px-3 h-9">
            <HiPaperAirplane className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Voice Screen ───
function VoiceScreen({
  voiceStatus,
  voiceTranscripts,
  isMuted,
  onStartCall,
  onEndCall,
  onToggleMute,
  onBack,
  selectedLanguage,
  onLanguageChange,
}: {
  voiceStatus: VoiceStatus
  voiceTranscripts: VoiceTranscript[]
  isMuted: boolean
  onStartCall: () => void
  onEndCall: () => void
  onToggleMute: () => void
  onBack: () => void
  selectedLanguage: SupportedLanguage
  onLanguageChange: (lang: SupportedLanguage) => void
}) {
  const [showTranscript, setShowTranscript] = useState(true)
  const transcriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [voiceTranscripts])

  const isActive = voiceStatus !== 'idle' && voiceStatus !== 'error'
  const safeTranscripts = Array.isArray(voiceTranscripts) ? voiceTranscripts : []

  const statusLabel: Record<VoiceStatus, string> = {
    idle: 'Ready to connect',
    connecting: 'Connecting...',
    connected: 'Connected',
    listening: 'Listening...',
    speaking: 'Agent speaking...',
    error: 'Connection error',
  }

  const statusColor: Record<VoiceStatus, string> = {
    idle: 'text-muted-foreground',
    connecting: 'text-amber-400',
    connected: 'text-emerald-400',
    listening: 'text-blue-400',
    speaking: 'text-accent',
    error: 'text-red-400',
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-1.5 h-auto">
          <HiArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <HiPhone className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="font-serif text-sm font-semibold text-foreground">Voice Support</h2>
            <p className="text-[10px] text-muted-foreground font-sans">Homemate AI Voice Assistant</p>
          </div>
        </div>
        {isActive && (
          <Badge variant="outline" className="border-emerald-700/50 text-emerald-400 text-[10px] px-1.5 py-0">
            <HiSignal className="w-3 h-3 mr-1" /> Live
          </Badge>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-hidden">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isActive ? 'bg-accent/20 shadow-lg shadow-accent/10' : 'bg-muted'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-accent/30' : 'bg-muted-foreground/10'}`}>
            <HiPhone className={`w-10 h-10 transition-colors duration-300 ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
          </div>
        </div>

        <p className={`font-sans text-sm font-medium mb-2 ${statusColor[voiceStatus]}`}>
          {statusLabel[voiceStatus]}
        </p>

        <div className="mb-6">
          <VoiceWaveform status={voiceStatus} />
        </div>

        {/* Language selector - shown when idle or before call */}
        {!isActive && (
          <div className="mb-5 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HiGlobeAlt className="w-3.5 h-3.5" />
              <span className="text-[11px] font-sans">Speak in your preferred language</span>
            </div>
            <LanguageSelector selectedLanguage={selectedLanguage} onSelect={onLanguageChange} />
          </div>
        )}

        {isActive && selectedLanguage !== 'auto' && (
          <div className="mb-4">
            <Badge variant="outline" className="border-cyan-700/50 bg-cyan-900/20 text-cyan-300 text-[10px] px-2 py-0.5 font-sans">
              <HiLanguage className="w-3 h-3 mr-1" />
              {getLanguageDisplayName(selectedLanguage)}
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-4">
          {!isActive ? (
            <Button
              onClick={onStartCall}
              disabled={voiceStatus === 'connecting'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-sans text-sm h-auto"
            >
              {voiceStatus === 'connecting' ? (
                <HiArrowPath className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <HiPhone className="w-5 h-5 mr-2" />
              )}
              {voiceStatus === 'connecting' ? 'Connecting...' : voiceStatus === 'error' ? 'Retry Call' : 'Start Call'}
            </Button>
          ) : (
            <>
              <Button
                onClick={onToggleMute}
                variant="outline"
                className={`w-14 h-14 rounded-full p-0 border-2 transition-colors duration-200 ${isMuted ? 'border-red-500/50 bg-red-900/20 text-red-400' : 'border-border bg-card text-foreground hover:bg-muted'}`}
              >
                {isMuted ? <HiMicrophoneSlash className="w-6 h-6" /> : <HiMicrophone className="w-6 h-6" />}
              </Button>
              <Button onClick={onEndCall} className="w-14 h-14 rounded-full p-0 bg-red-600 hover:bg-red-700 text-white">
                <HiXMark className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>
      </div>

      {safeTranscripts.length > 0 && (
        <div className="border-t border-border bg-card/60 flex-shrink-0">
          <button
            onClick={() => setShowTranscript((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Transcript ({safeTranscripts.length})</span>
            {showTranscript ? <HiChevronDown className="w-4 h-4" /> : <HiChevronUp className="w-4 h-4" />}
          </button>
          {showTranscript && (
            <div ref={transcriptRef} className="max-h-48 overflow-y-auto px-4 pb-3 space-y-2">
              {safeTranscripts.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 ${t.role === 'user' ? 'bg-accent/20 text-foreground' : 'bg-muted text-foreground'}`}>
                    <p className="text-xs font-sans" style={{ lineHeight: '1.65' }}>{t.text}</p>
                    <span className="text-[9px] text-muted-foreground">{formatTime(t.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── History Screen ───
function HistoryScreen({
  conversations,
  onBack,
}: {
  conversations: Conversation[]
  onBack: () => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const safeConvos = Array.isArray(conversations) ? conversations : []
  const chatConvos = safeConvos.filter((c) => c.channel === 'chat')
  const voiceConvos = safeConvos.filter((c) => c.channel === 'voice')

  const renderConvoList = (convos: Conversation[]) => {
    if (!Array.isArray(convos) || convos.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground font-sans">No conversations found</p>
        </div>
      )
    }
    return (
      <div className="space-y-2">
        {convos.map((convo) => {
          const isExpanded = expandedId === convo.id
          return (
            <Card key={convo.id} className="border-border bg-card shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : convo.id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${convo.channel === 'chat' ? 'bg-blue-900/30' : 'bg-emerald-900/30'}`}>
                  {convo.channel === 'chat' ? <HiChatBubbleLeftRight className="w-4 h-4 text-blue-400" /> : <HiPhone className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${convo.channel === 'chat' ? 'border-blue-700/50 text-blue-300' : 'border-emerald-700/50 text-emerald-300'}`}>
                      {convo.channel === 'chat' ? 'Chat' : 'Voice'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-sans flex items-center gap-1">
                      <HiClock className="w-3 h-3" /> {formatDate(convo.startedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground truncate">{convo.lastMessage || 'No messages'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${convo.status === 'resolved' ? 'border-emerald-700/50 text-emerald-400' : 'border-amber-700/50 text-amber-400'}`}>
                    {convo.status === 'resolved' ? 'Resolved' : 'Active'}
                  </Badge>
                  {isExpanded ? <HiChevronUp className="w-4 h-4 text-muted-foreground" /> : <HiChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border">
                  <div className="pt-3 space-y-2 max-h-64 overflow-y-auto">
                    {convo.channel === 'chat' && Array.isArray(convo.messages) && convo.messages.length > 0 && convo.messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 ${msg.role === 'user' ? 'bg-accent/20 text-foreground' : 'bg-muted text-foreground'}`}>
                          <p className="text-xs font-sans" style={{ lineHeight: '1.65' }}>{msg.text}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                            {msg.category && (
                              <Badge variant="outline" className={`text-[8px] px-1 py-0 border ${getCategoryColor(msg.category)}`}>
                                {getCategoryLabel(msg.category)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {convo.channel === 'voice' && Array.isArray(convo.transcripts) && convo.transcripts.length > 0 && convo.transcripts.map((t, i) => (
                      <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 ${t.role === 'user' ? 'bg-accent/20 text-foreground' : 'bg-muted text-foreground'}`}>
                          <p className="text-xs font-sans" style={{ lineHeight: '1.65' }}>{t.text}</p>
                          <span className="text-[9px] text-muted-foreground">{formatTime(t.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                    {convo.channel === 'chat' && (!Array.isArray(convo.messages) || convo.messages.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-2 font-sans">No messages in this conversation</p>
                    )}
                    {convo.channel === 'voice' && (!Array.isArray(convo.transcripts) || convo.transcripts.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-2 font-sans">No transcript available</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-1.5 h-auto">
          <HiArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <h2 className="font-serif text-sm font-semibold text-foreground">Conversation History</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full bg-muted border border-border mb-4">
            <TabsTrigger value="all" className="flex-1 font-sans text-xs data-[state=active]:bg-card data-[state=active]:text-foreground">All ({safeConvos.length})</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 font-sans text-xs data-[state=active]:bg-card data-[state=active]:text-foreground">Chat ({chatConvos.length})</TabsTrigger>
            <TabsTrigger value="voice" className="flex-1 font-sans text-xs data-[state=active]:bg-card data-[state=active]:text-foreground">Voice ({voiceConvos.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderConvoList(safeConvos)}</TabsContent>
          <TabsContent value="chat">{renderConvoList(chatConvos)}</TabsContent>
          <TabsContent value="voice">{renderConvoList(voiceConvos)}</TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ─── Main Page Component ───
export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [sampleDataOn, setSampleDataOn] = useState(false)
  const [sampleConversations, setSampleConversations] = useState<Conversation[]>([])

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | undefined>(undefined)
  const [chatLanguage, setChatLanguage] = useState<SupportedLanguage>('auto')
  const [detectedChatLanguage, setDetectedChatLanguage] = useState<string | undefined>(undefined)

  // Voice state
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle')
  const [voiceTranscripts, setVoiceTranscripts] = useState<VoiceTranscript[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const isMutedRef = useRef(false)
  const [voiceLanguage, setVoiceLanguage] = useState<SupportedLanguage>('auto')
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const nextPlayTimeRef = useRef<number>(0)
  const sampleRateRef = useRef<number>(24000)

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null)
  const activeConvoIdRef = useRef<string | null>(null)

  // Agent tracking
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Keep refs in sync
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    activeConvoIdRef.current = activeConvoId
  }, [activeConvoId])

  // Build sample data on mount (avoids Date in render)
  useEffect(() => {
    setSampleConversations(buildSampleConversations())
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { processorRef.current?.disconnect() } catch {}
      try { streamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
      try { audioContextRef.current?.close() } catch {}
      try { wsRef.current?.close() } catch {}
    }
  }, [])

  // Display conversations
  const displayConversations = sampleDataOn && conversations.length === 0 ? sampleConversations : conversations

  // ─── Chat Handlers ───
  const handleStartChat = useCallback(() => {
    const convoId = generateId()
    const newConvo: Conversation = {
      id: convoId,
      channel: 'chat',
      messages: [],
      transcripts: [],
      startedAt: new Date(),
      status: 'active',
      lastMessage: '',
    }
    setConversations((prev) => [newConvo, ...prev])
    setActiveConvoId(convoId)
    setChatMessages([])
    setChatSessionId(undefined)
    setDetectedChatLanguage(undefined)
    setCurrentScreen('chat')
  }, [])

  const handleSendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMsg])
    setChatLoading(true)
    setActiveAgentId(CHAT_AGENT_ID)

    const currentConvoId = activeConvoIdRef.current
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConvoId
          ? { ...c, messages: [...c.messages, userMsg], lastMessage: text }
          : c
      )
    )

    try {
      // If a specific language is selected, prepend instruction
      let messageToSend = text
      if (chatLanguage !== 'auto') {
        const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === chatLanguage)?.label || chatLanguage
        messageToSend = `[Please respond in ${langLabel}] ${text}`
      }

      const result = await callAIAgent(messageToSend, CHAT_AGENT_ID, {
        session_id: chatSessionId,
      })

      if (result?.success && result?.response?.result) {
        const agentText = result.response.result?.response ?? result.response.result?.text ?? result.response?.message ?? 'I apologize, I was unable to process your request. Please try again.'
        const category = result.response.result?.category ?? 'general'
        const resolved = result.response.result?.resolved ?? false
        const detectedLang = result.response.result?.detected_language ?? undefined

        if (detectedLang) {
          setDetectedChatLanguage(String(detectedLang))
        }

        if (result?.session_id) {
          setChatSessionId(result.session_id)
        }

        const agentMsg: ChatMessage = {
          id: generateId(),
          role: 'agent',
          text: String(agentText),
          timestamp: new Date(),
          category: String(category),
          resolved: Boolean(resolved),
          detectedLanguage: detectedLang ? String(detectedLang) : undefined,
        }

        setChatMessages((prev) => [...prev, agentMsg])

        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConvoId
              ? {
                  ...c,
                  messages: [...c.messages, userMsg, agentMsg],
                  lastMessage: String(agentText).slice(0, 100),
                  status: resolved ? 'resolved' : 'active',
                }
              : c
          )
        )
      } else {
        const errMsg: ChatMessage = {
          id: generateId(),
          role: 'agent',
          text: result?.error ?? 'Something went wrong. Please try again.',
          timestamp: new Date(),
          category: 'general',
          resolved: false,
        }
        setChatMessages((prev) => [...prev, errMsg])
      }
    } catch {
      const errMsg: ChatMessage = {
        id: generateId(),
        role: 'agent',
        text: 'Connection error. Please check your network and try again.',
        timestamp: new Date(),
        category: 'general',
        resolved: false,
      }
      setChatMessages((prev) => [...prev, errMsg])
    } finally {
      setChatLoading(false)
      setActiveAgentId(null)
    }
  }, [chatSessionId, chatLanguage])

  // ─── Voice Handlers ───
  const cleanupVoice = useCallback(() => {
    try { processorRef.current?.disconnect() } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
    try { audioContextRef.current?.close() } catch {}
    wsRef.current = null
    audioContextRef.current = null
    processorRef.current = null
    streamRef.current = null
    nextPlayTimeRef.current = 0
  }, [])

  const startVoiceCall = useCallback(async () => {
    try {
      setVoiceStatus('connecting')
      setVoiceTranscripts([])
      setActiveAgentId(VOICE_AGENT_ID)

      const convoId = generateId()
      const newConvo: Conversation = {
        id: convoId,
        channel: 'voice',
        messages: [],
        transcripts: [],
        startedAt: new Date(),
        status: 'active',
        lastMessage: 'Voice call in progress',
      }
      setConversations((prev) => [newConvo, ...prev])
      setActiveConvoId(convoId)

      // 1. Start session — pass language preference if set
      const sessionPayload: Record<string, string> = { agentId: VOICE_AGENT_ID }
      if (voiceLanguage !== 'auto') {
        const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === voiceLanguage)?.label || voiceLanguage
        sessionPayload.language = langLabel
      }
      const res = await fetch('https://voice-sip.studio.lyzr.ai/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload),
      })

      if (!res.ok) {
        throw new Error('Session start failed: ' + res.status)
      }

      const data = await res.json()
      const wsUrl = data?.wsUrl
      sampleRateRef.current = data?.audioConfig?.sampleRate || 24000

      if (!wsUrl) {
        throw new Error('No WebSocket URL received')
      }

      // 2. Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: sampleRateRef.current,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      // 3. Set up AudioContext
      const audioContext = new AudioContext({ sampleRate: sampleRateRef.current })
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      // CRITICAL: Silent gain node prevents mic echo feedback loop
      const silentGain = audioContext.createGain()
      silentGain.gain.value = 0
      silentGain.connect(audioContext.destination)
      source.connect(processor)
      processor.connect(silentGain)

      // 4. Connect WebSocket
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setVoiceStatus('connected')

        // Send language context as first message so agent greets in the right language
        if (voiceLanguage !== 'auto') {
          const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === voiceLanguage)?.label || voiceLanguage
          ws.send(JSON.stringify({
            type: 'context',
            text: `[Language: ${langLabel}] The customer prefers ${langLabel}. You MUST speak ONLY in ${langLabel} from now on. Greet them in ${langLabel}.`,
          }))
        }

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return
          const inputData = e.inputBuffer.getChannelData(0)
          const pcm16 = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]))
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
          }
          const uint8 = new Uint8Array(pcm16.buffer)
          let binary = ''
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i])
          }
          const base64 = btoa(binary)
          ws.send(JSON.stringify({ type: 'audio', audio: base64, sampleRate: sampleRateRef.current }))
        }
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === 'audio' && msg.audio && audioContextRef.current) {
            setVoiceStatus('speaking')
            const ac = audioContextRef.current
            const binaryStr = atob(msg.audio)
            const bytes = new Uint8Array(binaryStr.length)
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i)
            }
            const pcm16 = new Int16Array(bytes.buffer)
            const float32 = new Float32Array(pcm16.length)
            for (let i = 0; i < pcm16.length; i++) {
              float32[i] = pcm16[i] / 32768
            }

            const buffer = ac.createBuffer(1, float32.length, sampleRateRef.current)
            buffer.copyToChannel(float32, 0)
            const sourceNode = ac.createBufferSource()
            sourceNode.buffer = buffer
            sourceNode.connect(ac.destination)

            // Schedule sequentially to avoid overlapping speech
            const now = ac.currentTime
            const startTime = Math.max(now, nextPlayTimeRef.current)
            sourceNode.start(startTime)
            nextPlayTimeRef.current = startTime + buffer.duration

            sourceNode.onended = () => {
              if (ac.currentTime >= nextPlayTimeRef.current - 0.05) {
                setVoiceStatus('connected')
              }
            }
          }

          if (msg.type === 'transcript') {
            const transcript: VoiceTranscript = {
              role: msg.role || 'agent',
              text: msg.text || msg.transcript || '',
              timestamp: new Date(),
            }
            setVoiceTranscripts((prev) => [...prev, transcript])
            setConversations((prev) =>
              prev.map((c) =>
                c.id === convoId
                  ? { ...c, transcripts: [...c.transcripts, transcript], lastMessage: (transcript.text || '').slice(0, 100) }
                  : c
              )
            )
          }

          if (msg.type === 'thinking') {
            setVoiceStatus('listening')
          }

          if (msg.type === 'error') {
            console.error('Voice error:', msg)
            setVoiceStatus('error')
          }
        } catch (parseErr) {
          console.error('Failed to parse voice message:', parseErr)
        }
      }

      ws.onerror = () => {
        setVoiceStatus('error')
      }

      ws.onclose = () => {
        setVoiceStatus('idle')
        setActiveAgentId(null)
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convoId ? { ...c, status: 'resolved' } : c
          )
        )
      }
    } catch (err) {
      console.error('Voice call failed:', err)
      setVoiceStatus('error')
      setActiveAgentId(null)
    }
  }, [cleanupVoice, voiceLanguage])

  const endVoiceCall = useCallback(() => {
    try { wsRef.current?.close() } catch {}
    cleanupVoice()
    setVoiceStatus('idle')
    setActiveAgentId(null)
    setIsMuted(false)
  }, [cleanupVoice])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const handleStartCallScreen = useCallback(() => {
    setVoiceTranscripts([])
    setCurrentScreen('voice')
  }, [])

  // Navigation
  const navigateTo = useCallback((screen: Screen) => {
    if (currentScreen === 'voice' && voiceStatus !== 'idle' && screen !== 'voice') {
      endVoiceCall()
    }
    setCurrentScreen(screen)
  }, [currentScreen, voiceStatus, endVoiceCall])

  return (
    <ErrorBoundary>
      <div className="min-h-screen h-screen flex bg-background text-foreground overflow-hidden">
        {/* Sidebar */}
        <aside className="w-16 lg:w-56 flex-shrink-0 bg-card border-r border-border flex flex-col">
          <div className="px-3 lg:px-5 py-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <HiHome className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="hidden lg:block">
                <h1 className="font-serif text-base font-bold text-foreground tracking-tight">Homemate</h1>
                <p className="text-[10px] text-muted-foreground font-sans -mt-0.5">Support Hub</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-3 px-2 lg:px-3 space-y-1">
            <button
              onClick={() => navigateTo('dashboard')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg font-sans text-sm transition-colors duration-150 ${currentScreen === 'dashboard' ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              <HiHome className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block">Dashboard</span>
            </button>

            <button
              onClick={() => navigateTo('chat')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg font-sans text-sm transition-colors duration-150 ${currentScreen === 'chat' ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              <HiChatBubbleLeftRight className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block">Chat</span>
            </button>

            <button
              onClick={() => navigateTo('voice')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg font-sans text-sm transition-colors duration-150 relative ${currentScreen === 'voice' ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              <HiPhone className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block">Call</span>
              {voiceStatus !== 'idle' && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => navigateTo('history')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg font-sans text-sm transition-colors duration-150 ${currentScreen === 'history' ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              <HiClipboardDocumentList className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block">History</span>
            </button>
          </nav>

          <div className="px-3 lg:px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch id="sample-toggle" checked={sampleDataOn} onCheckedChange={setSampleDataOn} className="scale-75" />
              <Label htmlFor="sample-toggle" className="text-[10px] text-muted-foreground font-sans cursor-pointer hidden lg:block">Sample Data</Label>
            </div>
          </div>

          <div className="px-2 lg:px-3 pb-3 hidden lg:block">
            <AgentStatusPanel activeAgentId={activeAgentId} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentScreen === 'dashboard' && (
            <ScrollArea className="flex-1">
              <DashboardScreen
                conversations={displayConversations}
                onStartChat={handleStartChat}
                onStartCall={handleStartCallScreen}
                onViewHistory={() => navigateTo('history')}
              />
            </ScrollArea>
          )}

          {currentScreen === 'chat' && (
            <ChatScreen
              messages={sampleDataOn && chatMessages.length === 0 ? (sampleConversations[0]?.messages ?? []) : chatMessages}
              isLoading={chatLoading}
              onSend={handleSendMessage}
              onBack={() => navigateTo('dashboard')}
              selectedLanguage={chatLanguage}
              onLanguageChange={setChatLanguage}
              detectedLanguage={detectedChatLanguage}
            />
          )}

          {currentScreen === 'voice' && (
            <VoiceScreen
              voiceStatus={voiceStatus}
              voiceTranscripts={sampleDataOn && voiceTranscripts.length === 0 ? (sampleConversations[1]?.transcripts ?? []) : voiceTranscripts}
              isMuted={isMuted}
              onStartCall={startVoiceCall}
              onEndCall={endVoiceCall}
              onToggleMute={toggleMute}
              onBack={() => navigateTo('dashboard')}
              selectedLanguage={voiceLanguage}
              onLanguageChange={setVoiceLanguage}
            />
          )}

          {currentScreen === 'history' && (
            <HistoryScreen
              conversations={displayConversations}
              onBack={() => navigateTo('dashboard')}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
