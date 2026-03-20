import { convertToModelMessages, streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
