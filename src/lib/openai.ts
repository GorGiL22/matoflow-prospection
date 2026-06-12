import OpenAI from "openai";
import { AI_CONFIG } from "@/config/constants";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Variable OPENAI_API_KEY requise");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openaiClient;
}

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; json?: boolean }
) {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: AI_CONFIG.model,
    temperature: options?.temperature ?? AI_CONFIG.qualificationTemperature,
    response_format: options?.json ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
