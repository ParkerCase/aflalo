'use client'

import { useState, useEffect } from 'react'
import { Send, ArrowLeft, User, LogOut, Heart, X } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '../lib/user-context'
import { useRouter } from 'next/router'

export default function Chat() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: "Hey! I'm your Best Future Friend cannabis AI. What kind of cannabis experience are you looking for today? I can help you find the perfect strain, dosage, or answer any questions about cannabis.",
      role: 'assistant',
      timestamp: new Date(),
      feedback: null // Track feedback for each message
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const { user, clearUser } = useUser()
  const router = useRouter()

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.push('/onboarding')
    }
  }, [user, router])

  const handleSend = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-pin': user.pin // Pass user PIN for personalized recommendations
        },
        body: JSON.stringify({ 
          message: userMessage.content, 
          history: messages.slice(-5),
          userPreferences: { pin: user.pin } // Also pass in body as backup
        })
      })

      if (!response.ok) {
        throw new Error('API call failed')
      }

      const data = await response.json()
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: data.message || "I'm here to help with cannabis questions!",
        role: 'assistant',
        timestamp: new Date(),
        feedback: null
      }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now, but I can still help with general cannabis questions and recommendations based on my knowledge!",
        role: 'assistant',
        timestamp: new Date(),
        feedback: null
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearUser = () => {
    clearUser()
    router.push('/onboarding')
  }

  const handleFeedback = async (messageId: string, rating: 'thumbs_up' | 'thumbs_down') => {
    try {
      // Update the message with feedback locally
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedback: rating }
          : msg
      ))

      // Save feedback to database
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-pin': user.pin
        },
        body: JSON.stringify({
          message_id: messageId,
          rating: rating === 'thumbs_up' ? 5 : 1,
          feedback_type: rating,
          feedback_text: `User ${rating.replace('_', ' ')} this recommendation`
        })
      })
    } catch (error) {
      console.error('Feedback error:', error)
    }
  }

  // Show loading while checking user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-premium rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-premium border-b">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: 'white',
                fontWeight: 'bold'
              }}>
                BFF
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gradient">Best Future Friend</h1>
                <p className="text-xs sm:text-sm" style={{ color: '#4ade80' }}>Your Cannabis Expert</p>
              </div>
            </div>
            
            {/* User Profile Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2 text-white">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-mono text-xs sm:text-sm">PIN: {user.pin}</span>
              </div>
              <button
                onClick={handleClearUser}
                className="btn-premium-outline px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
                title="Clear PIN and start over"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <Link href="/" className="btn-premium-outline px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">Back</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-4xl">
        <div className="glass-premium rounded-xl sm:rounded-2xl" style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
          
          {/* Messages Area */}
          <div className="flex-1 p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 sm:gap-3 max-w-xs sm:max-w-md ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  
                  {/* Avatar */}
                  <div className={msg.role === 'user' ? 'avatar-user' : 'avatar-assistant'}>
                    {msg.role === 'user' ? 'User' : 'BFF'}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={msg.role === 'user' ? 'message-user' : 'message-assistant'}>
                    <p className="text-white text-sm sm:text-base" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs opacity-70">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      {/* Feedback Buttons - Only for assistant messages */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          {msg.feedback ? (
                            <span className="text-xs text-green-400">
                              {msg.feedback === 'thumbs_up' ? 'Helpful' : 'Not helpful'}
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleFeedback(msg.id, 'thumbs_up')}
                                className="text-gray-400 hover:text-green-400 transition-colors p-1"
                                title="This was helpful"
                              >
                                <Heart className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, 'thumbs_down')}
                                className="text-gray-400 hover:text-red-400 transition-colors p-1"
                                title="This wasn't helpful"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="avatar-assistant">BFF</div>
                  <div className="message-assistant">
                    <div className="loading-dots">
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                    </div>
                    <p className="text-xs opacity-70 mt-2">BFF is thinking...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-6 border-t">
            <div className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about strains, effects, dosage, or get personalized recommendations..."
                className="input-premium flex-1 text-sm sm:text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="btn-premium disabled:opacity-50 min-w-[48px] sm:min-w-[60px] p-3"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick Suggestions */}
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
              {!isLoading && messages.length <= 1 && (
                <>
                  <button 
                    onClick={() => setMessage("I'm looking for a relaxing indica for evening use")}
                    className="btn-premium-outline px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
                  >
                    Relaxing Indica
                  </button>
                  <button 
                    onClick={() => setMessage("What's a good sativa for creativity and focus?")}
                    className="btn-premium-outline px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
                  >
                    Creative Sativa
                  </button>
                  <button 
                    onClick={() => setMessage("I'm new to cannabis, what should I try first?")}
                    className="btn-premium-outline px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
                  >
                    Beginner Guide
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          <p>For educational purposes. Please consume responsibly and follow local laws.</p>
        </div>
      </div>
    </div>
  )
}
