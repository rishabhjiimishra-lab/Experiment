import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})

interface Message { role: 'user' | 'assistant'; content: string; id: string }

function ChatPage() {
  const { user, lang, isPremium } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const greeting = lang === 'hi'
    ? `नमस्ते ${user?.name || 'दोस्त'}! मैं आपका AI ज्योतिष जीवन कोच हूँ। आप मुझसे करियर, प्रेम, वित्त, या किसी भी विषय पर पूछ सकते हैं।`
    : `Hello ${user?.name || 'friend'}! I'm your AI Astro Life Coach. Ask me anything about career, love, finances, health, or life guidance — I'll combine astrology with practical coaching.`

  useEffect(() => {
    setMessages([{ role: 'assistant', content: greeting, id: 'greeting' }])
  }, [lang])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || streaming || !user) return
    const userMsg: Message = { role: 'user', content: input, id: Date.now().toString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const assistantId = `${Date.now()}-ai`
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ message: input, sessionId, language: lang }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, content: err.error || 'Something went wrong' }
          : m
        ))
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value)
          const lines = text.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data)
                accumulated += parsed.text
                setMessages(prev => prev.map(m => m.id === assistantId
                  ? { ...m, content: accumulated }
                  : m
                ))
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: 'Error connecting to AI coach. Please try again.' }
        : m
      ))
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  const quickPrompts = lang === 'hi'
    ? ['आज मेरे करियर के बारे में बताएं', 'प्रेम जीवन में क्या होगा?', 'वित्त संबंधी सलाह चाहिए', 'मेरे लिए शुभ समय कब है?']
    : ['What does my career look like this month?', 'How is my love life influenced by the stars?', 'Give me financial guidance for this week', 'When is my next lucky period?']

  return (
    <div className="h-screen bg-slate-950 flex flex-col pt-14 md:pt-0">
      {/* Header */}
      <div className="px-4 py-4 md:px-8 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-xl">🤖</div>
          <div>
            <h1 className="text-lg font-bold text-white">
              {lang === 'hi' ? 'AI जीवन कोच' : 'AI Life Coach'}
            </h1>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400">{lang === 'hi' ? 'ऑनलाइन' : 'Online'}</span>
            </div>
          </div>
          {!isPremium && (
            <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
              {lang === 'hi' ? 'निःशुल्क • 5 सवाल/दिन' : 'Free • 5 msgs/day'}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm mr-3 shrink-0 mt-1">🔮</div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-sm'
                : 'bg-slate-800 text-slate-200 rounded-bl-sm'
            }`}>
              {msg.content || (streaming && msg.role === 'assistant' ? <span className="animate-pulse">▋</span> : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-4 md:px-8 pb-2 flex gap-2 overflow-x-auto shrink-0">
          {quickPrompts.map(p => (
            <button
              key={p}
              onClick={() => setInput(p)}
              className="shrink-0 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-4 md:px-8 border-t border-slate-800 shrink-0">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={lang === 'hi' ? 'अपना सवाल पूछें...' : 'Ask your cosmic question...'}
            disabled={streaming}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 text-sm transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
          >
            {streaming ? '⏳' : '✨'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          {lang === 'hi' ? 'AI ज्योतिषी + करियर कोच + संबंध सलाहकार + वित्त मार्गदर्शक' : 'AI Astrologer • Career Coach • Relationship Advisor • Financial Mentor'}
        </p>
      </div>
    </div>
  )
}
