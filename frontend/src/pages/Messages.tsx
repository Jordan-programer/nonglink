import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  fetchConversation,
  fetchConversations,
  sendMessage,
  type Conversation,
  type ConversationDetail,
} from '../api/client'

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function Messages() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const activeId = id ? Number(id) : null

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [active, setActive] = useState<ConversationDetail | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    function load() {
      fetchConversations(token!).then((data) => {
        if (!cancelled) {
          setConversations(data)
          setStatus('ready')
        }
      })
    }

    load()
    const interval = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [token])

  useEffect(() => {
    if (!token || !activeId) {
      setActive(null)
      return
    }
    let cancelled = false

    function load() {
      fetchConversation(activeId!, token!).then((data) => {
        if (!cancelled) {
          setActive(data)
          setConversations((prev) =>
            prev.map((c) => (c.id === data.id ? { ...c, unread_count: 0 } : c)),
          )
        }
      })
    }

    load()
    const interval = setInterval(load, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [token, activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages.length])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!token || !activeId || !draft.trim()) return

    setSending(true)
    const content = draft.trim()
    setDraft('')
    try {
      const message = await sendMessage(activeId, content, token)
      setActive((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev))
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === activeId
              ? { ...c, last_message: content, last_message_at: message.created_at }
              : c,
          )
          .sort((a, b) => (a.id === activeId ? -1 : b.id === activeId ? 1 : 0)),
      )
    } finally {
      setSending(false)
    }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">Mensagens</h1>
      <p className="mt-1 text-sm text-leaf-950/60">
        Fala diretamente com agricultores e compradores sobre os produtos.
      </p>

      <div className="mt-6 grid overflow-hidden rounded-2xl border border-leaf-100 bg-white md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <div className={`border-leaf-100 md:border-r ${activeId ? 'hidden md:block' : ''}`}>
          {status === 'loading' && (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-leaf-50" />
              ))}
            </div>
          )}

          {status === 'ready' && conversations.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <MessageCircle className="text-leaf-700/50" size={28} />
              <p className="text-sm text-leaf-950/60">
                Ainda não tens conversas. Contacta um vendedor a partir de um produto no
                mercado.
              </p>
            </div>
          )}

          <ul className="max-h-[65vh] divide-y divide-leaf-50 overflow-y-auto">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/mensagens/${c.id}`)}
                  className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-leaf-50 ${
                    activeId === c.id ? 'bg-leaf-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-leaf-950">
                      {c.other_user_name}
                    </span>
                    {c.last_message_at && (
                      <span className="shrink-0 text-xs text-leaf-950/40">
                        {timeAgo(c.last_message_at)}
                      </span>
                    )}
                  </div>
                  {c.product_name && (
                    <span className="truncate text-xs font-medium text-leaf-700">
                      {c.product_name}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-leaf-950/60">
                      {c.last_message ?? 'Sem mensagens'}
                    </span>
                    {c.unread_count > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-leaf-700 px-1 text-[11px] font-bold text-white">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Active conversation */}
        <div className={`flex flex-col ${activeId ? '' : 'hidden md:flex'}`}>
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-leaf-950/50">
              Seleciona uma conversa para começar.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-leaf-100 px-4 py-3">
                <button
                  onClick={() => navigate('/mensagens')}
                  className="rounded-full p-1.5 text-leaf-950/60 hover:bg-leaf-50 md:hidden"
                  aria-label="Voltar"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-leaf-950">
                    {active.other_user_name}
                  </p>
                  {active.product_name && (
                    <p className="truncate text-xs text-leaf-700">{active.product_name}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: '55vh' }}>
                {active.messages.map((m) => {
                  const mine = m.sender_id === user?.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          mine
                            ? 'bg-leaf-700 text-white'
                            : 'bg-leaf-50 text-leaf-950'
                        }`}
                      >
                        <p>{m.content}</p>
                        <p
                          className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-leaf-950/40'}`}
                        >
                          {new Date(m.created_at).toLocaleTimeString('pt-AO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-leaf-100 p-3"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreve uma mensagem..."
                  className="flex-1 rounded-full border border-leaf-200 bg-white px-4 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-700 text-white hover:bg-leaf-800 disabled:opacity-50"
                  aria-label="Enviar"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {totalUnread === 0 && conversations.length > 0 && !activeId && (
        <p className="mt-3 text-center text-xs text-leaf-950/40">Tudo lido.</p>
      )}
    </section>
  )
}
