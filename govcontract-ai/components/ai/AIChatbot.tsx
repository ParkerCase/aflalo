'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Zap, 
  Target, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Search,
  FileText,
  BarChart3
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  suggestions?: string[]
  data?: any
}

interface AIInsight {
  type: 'match' | 'prediction' | 'recommendation' | 'alert'
  title: string
  content: string
  score?: number
  action?: string
  urgency?: 'low' | 'medium' | 'high'
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hi! I\'m your AI contracting assistant. I can help you discover opportunities, analyze matches, and optimize your applications. What would you like to explore?',
      timestamp: new Date(),
      suggestions: [
        'Find matching opportunities',
        'Analyze my company fit',
        'Predict upcoming contracts',
        'Review spending trends'
      ]
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (message: string = inputValue) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(message)
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (userMessage: string): Message => {
    const message = userMessage.toLowerCase()
    
    if (message.includes('opportunity') || message.includes('find') || message.includes('match')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I found 23 high-match opportunities for your company! Based on your profile in healthcare IT, here are the top matches:',
        timestamp: new Date(),
        data: {
          opportunities: [
            { name: 'VA Hospital EHR Modernization', match: 94, value: '$2.3M', dueDate: '2025-08-15' },
            { name: 'CDC Data Analytics Platform', match: 87, value: '$1.8M', dueDate: '2025-09-02' },
            { name: 'Medicare Claims Processing', match: 82, value: '$5.1M', dueDate: '2025-08-28' }
          ]
        },
        suggestions: ['Analyze VA Hospital opportunity', 'Set alerts for similar contracts', 'View competitive landscape']
      }
    } else if (message.includes('predict') || message.includes('forecast') || message.includes('upcoming')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Based on budget analysis and historical patterns, I predict these emerging opportunities:',
        timestamp: new Date(),
        data: {
          predictions: [
            { category: 'Cybersecurity Services', probability: 89, timeline: '30-45 days', value: '$50M+' },
            { category: 'Cloud Migration', probability: 76, timeline: '60-90 days', value: '$25M+' },
            { category: 'AI/ML Solutions', probability: 71, timeline: '90-120 days', value: '$15M+' }
          ]
        },
        suggestions: ['Set prediction alerts', 'Analyze budget trends', 'Review competitive positioning']
      }
    } else if (message.includes('analyze') || message.includes('fit') || message.includes('score')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Your company shows strong potential in the healthcare sector. Here\'s my analysis:',
        timestamp: new Date(),
        data: {
          analysis: {
            overallScore: 87,
            strengths: ['Strong past performance', 'Relevant certifications', 'Proven team'],
            gaps: ['Need 8(a) certification', 'Limited federal experience'],
            recommendations: ['Apply for 8(a) certification', 'Partner with established prime contractor', 'Build federal reference portfolio']
          }
        },
        suggestions: ['Get certification guidance', 'Find potential partners', 'View improvement plan']
      }
    } else if (message.includes('spending') || message.includes('trends') || message.includes('budget')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Healthcare spending is trending upward! Here\'s what I\'m seeing:',
        timestamp: new Date(),
        data: {
          trends: [
            { metric: 'Healthcare IT Spending', change: '+23%', period: 'YoY', impact: 'High' },
            { metric: 'Telemedicine Contracts', change: '+156%', period: 'YoY', impact: 'Very High' },
            { metric: 'Cybersecurity Spending', change: '+45%', period: 'YoY', impact: 'High' }
          ]
        },
        suggestions: ['View detailed spending report', 'Set trend alerts', 'Analyze by agency']
      }
    } else {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I can help you with opportunity discovery, match analysis, spending trends, and application optimization. What specific area interests you most?',
        timestamp: new Date(),
        suggestions: [
          'Show me high-match opportunities',
          'Predict upcoming contracts',
          'Analyze my win probability',
          'Review sector spending trends'
        ]
      }
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion)
  }

  const formatCurrency = (amount: string) => {
    return amount.replace(/\$/, '$')
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-blue-600 bg-blue-100'
    return 'text-yellow-600 bg-yellow-100'
  }

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">AI Contract Assistant</h3>
                <p className="text-xs text-blue-100">Powered by Claude AI</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* AI Insights Panel */}
          <div className="p-3 bg-gray-50 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Live AI Insights</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2 rounded text-center">
                <div className="text-lg font-bold text-green-600">94%</div>
                <div className="text-xs text-gray-600">Match Score</div>
              </div>
              <div className="bg-white p-2 rounded text-center">
                <div className="text-lg font-bold text-blue-600">23</div>
                <div className="text-xs text-gray-600">New Opps</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-2 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Render data-specific content */}
                      {message.data?.opportunities && (
                        <div className="mt-3 space-y-2">
                          {message.data.opportunities.map((opp: any, index: number) => (
                            <div key={index} className="bg-white rounded p-2 text-gray-800">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-xs">{opp.name}</span>
                                <Badge className={`text-xs ${getScoreColor(opp.match)}`}>
                                  {opp.match}% match
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>{opp.value}</span>
                                <span>Due: {opp.dueDate}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.data?.predictions && (
                        <div className="mt-3 space-y-2">
                          {message.data.predictions.map((pred: any, index: number) => (
                            <div key={index} className="bg-white rounded p-2 text-gray-800">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-xs">{pred.category}</span>
                                <Badge variant="outline" className="text-xs">
                                  {pred.probability}% likely
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>{pred.timeline}</span>
                                <span>{pred.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.data?.analysis && (
                        <div className="mt-3 bg-white rounded p-2 text-gray-800">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Overall Score:</span>
                            <Badge className={getScoreColor(message.data.analysis.overallScore)}>
                              {message.data.analysis.overallScore}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div>
                              <span className="text-green-600 font-medium">Strengths:</span>
                              <ul className="mt-1 space-y-1">
                                {message.data.analysis.strengths.map((strength: string, i: number) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="text-yellow-600 font-medium">Recommendations:</span>
                              <ul className="mt-1 space-y-1">
                                {message.data.analysis.recommendations.map((rec: string, i: number) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <Lightbulb className="h-3 w-3 text-yellow-600" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {message.data?.trends && (
                        <div className="mt-3 space-y-2">
                          {message.data.trends.map((trend: any, index: number) => (
                            <div key={index} className="bg-white rounded p-2 text-gray-800">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-xs">{trend.metric}</span>
                                <span className={`text-xs font-bold ${getChangeColor(trend.change)}`}>
                                  {trend.change}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>{trend.period}</span>
                                <Badge variant="outline" className="text-xs">
                                  {trend.impact} Impact
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.type === 'ai' && (
                    <div className="mt-2 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 mr-1 mb-1"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about opportunities, trends, or analysis..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button onClick={() => handleSend()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1 mt-2">
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => handleSend('Find opportunities')}>
                <Search className="h-3 w-3 mr-1" />
                Find
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => handleSend('Analyze trends')}>
                <BarChart3 className="h-3 w-3 mr-1" />
                Trends
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => handleSend('Get recommendations')}>
                <Target className="h-3 w-3 mr-1" />
                Recs
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AIChatbot