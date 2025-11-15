"use client"

import { useState, useRef, useEffect } from "react"
import Papa from "papaparse"
import { Send, Loader, Plus, Upload, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Message {
  id: string
  text: string
  sender: "user" | "assistant"
  timestamp: Date
  isTyping?: boolean
}

const CHAT_HISTORY_KEY = "nutritrack-chat-history"

type StoredMessage = Omit<Message, "timestamp"> & {
  timestamp: string
}

const createInitialAssistantMessage = (): Message => ({
  id: "welcome",
  text: "Hello! I'm your NutriTrack assistant. I can help you with personalized meal plans, track your calories, and provide nutrition insights. What would you like to know today?",
  sender: "assistant",
  timestamp: new Date(),
})

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(() => [createInitialAssistantMessage()])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [datasetPreview, setDatasetPreview] = useState<string | null>(null)
  const [datasetMeta, setDatasetMeta] = useState<{ name: string; rows: number; columns: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (typeof window === "undefined") return

    const storedHistory = window.localStorage.getItem(CHAT_HISTORY_KEY)
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory) as StoredMessage[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(
            parsed.map((message) => ({
              ...message,
              timestamp: new Date(message.timestamp),
            })),
          )
        }
      } catch (error) {
        console.error("Failed to load chat history:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const serialised = JSON.stringify(
      messages.map<StoredMessage>((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
    )

    window.localStorage.setItem(CHAT_HISTORY_KEY, serialised)
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    }
    const optimisticMessages = [...messages, userMessage]
    setMessages(optimisticMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: optimisticMessages.map(({ sender, text }) => ({ sender, text })),
          dataset: datasetPreview ?? undefined,
        }),
      })

      if (!response.ok) {
        const raw = await response.text()
        let serverMessage = "Something went wrong."
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            if (typeof parsed?.error === "string" && parsed.error.trim()) {
              serverMessage = parsed.error
            }
          } catch {
            if (!raw.startsWith("<")) {
              serverMessage = raw
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            text: `Sorry, I couldn't reach the assistant: ${serverMessage}`,
            sender: "assistant",
            timestamp: new Date(),
          },
        ])
        return
      }

      const data: { reply?: string } = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          data?.reply?.trim() ||
          "I had trouble generating a reply just now. Please try asking again in a moment.",
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat request failed:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text:
            error instanceof Error
              ? `Sorry, I couldn't reach the assistant: ${error.message}`
              : "Sorry, I couldn't reach the assistant right now.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h2 className="text-2xl font-bold text-foreground">Nutrition Assistant</h2>
          <p className="text-sm text-muted-foreground mt-1">Get personalized meal plans and nutrition advice</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xl rounded-2xl px-6 py-4 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground border border-border"
                }`}
              >
                {message.sender === "assistant" && (
                  <div className="text-sm font-medium mb-2 opacity-70">🤖 Assistant</div>
                )}
                <div className="text-sm whitespace-pre-line leading-relaxed [&>p]:m-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                </div>
                <div className="text-xs mt-2 opacity-50" suppressHydrationWarning>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-6 py-4 flex items-center gap-2">
                <Loader size={16} className="animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex gap-3">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="shrink-0 h-12 w-12 rounded-full"
                  suppressHydrationWarning
                >
                  <Plus size={20} />
                  <span className="sr-only">Upload data</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload nutrition data</DialogTitle>
                  <DialogDescription>
                    Select a CSV or Excel file. We&apos;ll analyze a preview and incorporate it into your chat
                    responses.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <label
                    htmlFor="chat-upload"
                    className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg py-6 cursor-pointer hover:border-primary transition-colors"
                  >
                    <Upload size={24} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to select a file (CSV, XLSX)
                    </span>
                  </label>
                  <input
                    id="chat-upload"
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      setIsUploading(true)
                      setUploadError(null)
                      setDatasetMeta(null)
                      setDatasetPreview(null)
                      Papa.parse<Record<string, unknown>>(file, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (result) => {
                          const fields = result.meta.fields ?? []
                          const rows = Array.isArray(result.data) ? result.data : []
                          const totalRows = rows.length
                          const columns = fields.length

                          const sampleRows = rows.slice(0, 15)
                          const sampleLines = sampleRows.map((row, index) => {
                            const cells = fields.map((field) => `${field}: ${String(row[field] ?? "")}`)
                            return `${index + 1}. ${cells.join(" | ")}`
                          })

                          const datasetString = [
                            `File: ${file.name}`,
                            `Rows: ${totalRows}`,
                            `Columns: ${columns}`,
                            `Fields: ${fields.join(", ")}`,
                            "",
                            "Sample:",
                            ...sampleLines,
                          ]
                            .join("\n")
                            .slice(0, 15000)

                          setDatasetPreview(datasetString)
                          setDatasetMeta({
                            name: file.name,
                            rows: totalRows,
                            columns,
                          })
                          setIsUploading(false)
                        },
                        error: (error) => {
                          console.error("Failed to parse upload:", error)
                          setUploadError("We couldn't read that file. Please check the format and try again.")
                          setIsUploading(false)
                        },
                      })
                      event.target.value = ""
                    }}
                  />
                </div>
                {uploadError && <p className="text-sm text-destructive mt-3">{uploadError}</p>}
                {datasetPreview && !uploadError && (
                  <div className="mt-4 max-h-48 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                    {datasetPreview}
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUploadDialogOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isUploading || !datasetPreview || Boolean(uploadError)}
                    type="button"
                    onClick={() => setIsUploadDialogOpen(false)}
                  >
                    {isUploading ? "Parsing..." : datasetPreview ? "Use dataset" : "Select a file"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask about meals, nutrition, recipes..."
              suppressHydrationWarning
              className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
        {datasetMeta && (
          <div className="max-w-4xl mx-auto px-6 pb-4 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{datasetMeta.name}</span>
            <span>· {datasetMeta.rows.toLocaleString()} rows</span>
            <span>· {datasetMeta.columns} columns</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setDatasetMeta(null)
                setDatasetPreview(null)
                setUploadError(null)
              }}
            >
              <X size={12} />
              Clear dataset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
