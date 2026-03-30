import { z } from 'zod';

const blackwhiteEnvSchema = z.object({
  BLACKWHITH_APPID: z.string().min(1, 'BLACKWHITH_APPID is required'),
  BLACKWHITH_KEY: z.string().min(1, 'BLACKWHITH_KEY is required'),
});

const env = blackwhiteEnvSchema.parse({
  BLACKWHITH_APPID: process.env.BLACKWHITH_APPID,
  BLACKWHITH_KEY: process.env.BLACKWHITH_KEY,
});

type ChatMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | {
      role: 'system' | 'user' | 'assistant';
      content: Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      >;
    };

type ChatOptions = {
  model?: string;
  temperature?: number;
  timeoutMs?: number;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function extractJsonBlock(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    return objectMatch[0];
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch?.[0]) {
    return arrayMatch[0];
  }

  return text.trim();
}

export async function blackwhiteChat(messages: ChatMessage[], options: ChatOptions = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 120_000);

  try {
    const response = await fetch('http://127.0.0.1:8080/proxy/openrouter/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': env.BLACKWHITH_APPID,
        Authorization: `Bearer ${env.BLACKWHITH_KEY}`,
      },
      body: JSON.stringify({
        model: options.model ?? 'google/gemini-2.5-flash-lite',
        stream: false,
        temperature: options.temperature ?? 0.1,
        messages,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`blackwhite request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('blackwhite returned empty content');
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

export async function blackwhiteJson<T>(schema: z.ZodType<T>, messages: ChatMessage[], options: ChatOptions = {}) {
  const content = await blackwhiteChat(messages, options);
  const extracted = extractJsonBlock(content);

  try {
    return schema.parse(JSON.parse(extracted));
  } catch (error) {
    throw new Error(`Failed to parse blackwhite JSON output: ${(error as Error).message}\nRaw content: ${content}`);
  }
}
