'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Store, User as UserIcon, MessageSquare } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface Conversation {
  id: string
  peer_name: string
  peer_avatar: string | null
  last_message: string
  last_message_at: string
  is_buyer: boolean
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export function ChatInterface() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const initialConvId = searchParams.get('c')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    apiClient.get('/conversations')
      .then(res => {
        setConversations(res.data.data)
        if (res.data.data.length > 0) {
          const exists = initialConvId && res.data.data.some((c: Conversation) => c.id === initialConvId)
          setActiveConvId(exists ? initialConvId : res.data.data[0].id)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [initialConvId])

  useEffect(() => {
    if (!activeConvId) return
    apiClient.get(`/conversations/${activeConvId}/messages`)
      .then(res => setMessages(res.data.data))
      .catch(console.error)
  }, [activeConvId])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim() || !activeConvId) return

    const tempMsg: Message = {
      id: Date.now().toString(),
      sender_id: user?.id!,
      content: inputMsg,
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, tempMsg])
    setInputMsg('')

    try {
      await apiClient.post(`/conversations/${activeConvId}/messages`, { content: tempMsg.content })
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) return <div className="h-full w-full animate-pulse bg-slate-50" />

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      
      {/* Sidebar: Chat List */}
      <div className="w-1/3 border-r border-slate-200 bg-slate-50/50 flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-white">
          <h2 className="font-bold text-lg text-slate-900">Daftar Obrolan</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare size={32} className="mb-3 opacity-50" />
              <p className="text-sm font-medium">Belum ada percakapan</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full p-4 text-left transition-all duration-200 flex gap-3 items-center ${
                    activeConvId === conv.id 
                      ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600' 
                      : 'hover:bg-slate-100 border-l-4 border-l-transparent bg-white'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                    activeConvId === conv.id ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {conv.is_buyer ? <Store size={20} strokeWidth={2.5} /> : <UserIcon size={20} strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-[15px] font-bold truncate ${activeConvId === conv.id ? 'text-emerald-900' : 'text-slate-900'}`}>
                        {conv.peer_name}
                      </p>
                      <span className={`text-[11px] font-medium flex-shrink-0 ${activeConvId === conv.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {new Date(conv.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-[13px] truncate ${activeConvId === conv.id ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                      {conv.last_message || 'Belum ada pesan'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col bg-[#F8FAFC] relative">
        {/* Background Graphic Pattern (Subtle) */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#E2E8F0 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
             
        {activeConvId ? (
          <>
            {/* Active Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-white/80 backdrop-blur-md z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Store size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 leading-tight">
                  {conversations.find(c => c.id === activeConvId)?.peer_name}
                </h3>
                <span className="text-[12px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Online
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar" ref={scrollRef}>
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
                    <div className={`max-w-[75%] px-5 py-3 text-[14.5px] shadow-sm leading-relaxed ${
                      isMe 
                        ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-sm shadow-[0_4px_12px_rgba(5,150,105,0.15)]' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 mt-1.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-5 border-t border-slate-200 bg-white z-10 flex gap-3 items-center">
              <input 
                type="text" 
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                placeholder="Ketik pesan Anda di sini..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-[14px] text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all outline-none placeholder:text-slate-400 shadow-inner"
              />
              <button 
                type="submit"
                disabled={!inputMsg.trim()}
                className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(5,150,105,0.2)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                <Send size={18} strokeWidth={2.5} className={inputMsg.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 z-10">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <MessageSquare size={40} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Mulai Obrolan</h3>
            <p className="text-sm font-medium">Pilih percakapan dari daftar di sebelah kiri untuk memulai.</p>
          </div>
        )}
      </div>
      
      {/* Optional: Add custom scrollbar styling if you haven't globally */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  )
}