import axiosClient from './axiosClient.js';
import config from '../../config/env.js';
import { getAccessToken } from '../../store/authStore.js';

/**
 * @param {{ messages: Array<{ role: 'user' | 'model', text: string }>, branchId?: number | null, language?: string, catalogContext?: string | null }} payload
 * @returns {Promise<{ reply: string }>}
 */
export async function postAiChat({
  messages,
  branchId = null,
  branchName = null,
  language = 'en',
  catalogContext = null,
  signal = null,
}) {
  const { data } = await axiosClient.post(
    'customer/ai/chat',
    {
      messages,
      branch_id: branchId,
      branch_name: branchName,
      language,
      catalog_context: catalogContext,
    },
    signal ? { signal } : undefined,
  );
  return data;
}

/**
 * Stream SSE tokens from the secure concierge proxy.
 * @param {object} payload
 * @param {(chunk: string) => void} onChunk
 * @returns {Promise<string>} full assembled reply
 */
export async function streamAiChat(
  { messages, branchId = null, branchName = null, language = 'en', catalogContext = null },
  onChunk,
  { signal = null } = {},
) {
  const token = getAccessToken();
  const url = `${config.apiUrl}customer/ai/chat/stream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      messages,
      branch_id: branchId,
      branch_name: branchName,
      language,
      catalog_context: catalogContext,
    }),
    signal,
  });

  if (!response.ok) {
    const err = new Error('AI stream failed');
    err.response = { status: response.status };
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming not supported');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      if (!rawEvent.startsWith('data:')) continue;
      const data = rawEvent.slice(5).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const piece = parsed?.text;
        if (typeof piece === 'string' && piece) {
          fullText += piece;
          onChunk(fullText);
        }
      } catch {
        // ignore malformed SSE frames
      }
    }
  }

  return fullText;
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      // ignore
    }
    if (signal?.aborted || error?.name === 'AbortError') {
      const aborted = new Error('Stream aborted');
      aborted.name = 'AbortError';
      throw aborted;
    }
    throw error;
  }
}
