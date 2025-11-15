import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT =
  [
    "You are NutriTrack, a friendly nutrition assistant focused strictly on food, fitness, and wellbeing.",
    "Decline any requests unrelated to nutrition, health, or fitness. Politely redirect the user to ask a health-related question instead.",
    "Offer concise, actionable guidance about meal planning, calorie tracking, macro balance, mindful eating, hydration, and general wellness.",
    "If additional nutrition data is provided, prefer those values when answering, but still keep the response within the nutrition/health domain.",
  ].join(" ")

const DATASET_CHAR_LIMIT = 15000

let cachedDataset: { fileId: string; snippet: string } | null = null

async function loadDatasetSnippet() {
  const fileId = process.env.OPENAI_DATA_FILE_ID
  if (!fileId) return null

  if (cachedDataset && cachedDataset.fileId === fileId) {
    return cachedDataset.snippet
  }

  try {
    const response = await openai.files.content(fileId)
    const buffer = Buffer.from(await response.arrayBuffer())
    const text = buffer.toString("utf-8")
    const snippet = text.slice(0, DATASET_CHAR_LIMIT)
    cachedDataset = { fileId, snippet }
    return snippet
  } catch (error) {
    console.error("Failed to load dataset from OpenAI storage:", error)
    return null
  }
}

type IncomingMessage = {
  sender?: unknown
  text?: unknown
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OpenAI API key. Add OPENAI_API_KEY to your environment." },
      { status: 500 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  const rawMessages = (body as { messages?: IncomingMessage[] }).messages
  const messages = Array.isArray(rawMessages) ? rawMessages : []
  const inlineDataset =
    typeof (body as { dataset?: unknown }).dataset === "string" &&
    (body as { dataset?: string }).dataset.trim().length > 0
      ? ((body as { dataset?: string }).dataset ?? "").slice(0, DATASET_CHAR_LIMIT)
      : null

  const datasetSnippet = await loadDatasetSnippet()

  const conversation = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...(datasetSnippet
      ? [
          {
            role: "system" as const,
            content: [
              "Here is an excerpt from the uploaded nutrition dataset stored in OpenAI files. Use it when answering questions, citing concrete numbers when available.",
              "If the excerpt does not contain relevant information, respond based on general guidance.",
              "",
              datasetSnippet,
            ].join("\n"),
          },
        ]
      : []),
    ...(inlineDataset
      ? [
          {
            role: "system" as const,
            content: [
              "Here is a recent dataset provided directly by the user in this session. Prioritize these values if they conflict with other sources.",
              "",
              inlineDataset,
            ].join("\n"),
          },
        ]
      : []),
    ...messages
      .filter((message) => typeof message?.text === "string" && message.text.trim().length > 0)
      .map((message) => ({
        role: message.sender === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(message.text),
      })),
  ]

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversation.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content?.trim()

    if (!reply) {
      return NextResponse.json({ error: "The assistant returned an empty response." }, { status: 502 })
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("OpenAI API error:", error)

    const status =
      (typeof error === "object" && error !== null && "status" in error && typeof (error as { status?: number }).status === "number"
        ? (error as { status?: number }).status
        : 502) || 502

    let message = "Unable to generate a response. Please try again later."

    if (typeof error === "object" && error !== null) {
      if ("error" in error && typeof (error as { error?: { message?: unknown } }).error?.message === "string") {
        message = (error as { error?: { message?: string } }).error?.message ?? message
      } else if ("message" in error && typeof (error as { message?: unknown }).message === "string") {
        message = (error as { message?: string }).message ?? message
      }
    } else if (error instanceof Error && error.message) {
      message = error.message
    }

    return NextResponse.json({ error: message }, { status })
  }
}

