/**
 * خدمة AI موحدة — تدعم Google Gemini, OpenAI, Anthropic, Mistral
 * تتصل مباشرة بـ APIs من المتصفح (Frontend-only)
 */

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIResponse {
    content: string;
    tokens?: { prompt: number; completion: number; total: number };
}

// ---------- Google Gemini ----------
async function callGemini(
    apiKey: string,
    modelId: string,
    systemPrompt: string,
    messages: AIMessage[]
): Promise<AIResponse> {
    const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

    const body: Record<string, unknown> = { contents };
    if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata;

    return {
        content: text,
        tokens: usage
            ? {
                prompt: usage.promptTokenCount || 0,
                completion: usage.candidatesTokenCount || 0,
                total: usage.totalTokenCount || 0,
            }
            : undefined,
    };
}

// ---------- OpenAI ----------
async function callOpenAI(
    apiKey: string,
    modelId: string,
    systemPrompt: string,
    messages: AIMessage[]
): Promise<AIResponse> {
    const msgs: { role: string; content: string }[] = [];
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
    msgs.push(...messages.map((m) => ({ role: m.role, content: m.content })));

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: modelId, messages: msgs }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI API Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const usage = data.usage;

    return {
        content: text,
        tokens: usage
            ? {
                prompt: usage.prompt_tokens || 0,
                completion: usage.completion_tokens || 0,
                total: usage.total_tokens || 0,
            }
            : undefined,
    };
}

// ---------- Anthropic ----------
async function callAnthropic(
    apiKey: string,
    modelId: string,
    systemPrompt: string,
    messages: AIMessage[]
): Promise<AIResponse> {
    const msgs = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
        model: modelId,
        max_tokens: 4096,
        messages: msgs,
    };
    if (systemPrompt) body.system = systemPrompt;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic API Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text =
        data.content?.map((b: { type: string; text: string }) => b.text).join('') || '';
    const usage = data.usage;

    return {
        content: text,
        tokens: usage
            ? {
                prompt: usage.input_tokens || 0,
                completion: usage.output_tokens || 0,
                total: (usage.input_tokens || 0) + (usage.output_tokens || 0),
            }
            : undefined,
    };
}

// ---------- Mistral ----------
async function callMistral(
    apiKey: string,
    modelId: string,
    systemPrompt: string,
    messages: AIMessage[]
): Promise<AIResponse> {
    const msgs: { role: string; content: string }[] = [];
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
    msgs.push(...messages.map((m) => ({ role: m.role, content: m.content })));

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: modelId, messages: msgs }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Mistral API Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const usage = data.usage;

    return {
        content: text,
        tokens: usage
            ? {
                prompt: usage.prompt_tokens || 0,
                completion: usage.completion_tokens || 0,
                total: usage.total_tokens || 0,
            }
            : undefined,
    };
}

// ---------- Unified Entry Point ----------
const PROVIDER_MAP: Record<
    string,
    (key: string, model: string, sys: string, msgs: AIMessage[]) => Promise<AIResponse>
> = {
    googleai: callGemini,
    openai: callOpenAI,
    anthropic: callAnthropic,
    mistral: callMistral,
};

/**
 * أرسل رسالة لنموذج AI حقيقي
 * @throws Error إذا المزود غير مدعوم أو المفتاح غير موجود
 */
export async function sendMessage(
    provider: string,
    modelId: string,
    apiKey: string,
    systemPrompt: string,
    messages: AIMessage[]
): Promise<AIResponse> {
    if (!apiKey) {
        throw new Error('⚠️ لا يوجد مفتاح API. اذهب للإعدادات وأضف مفتاحاً لهذا المزود.');
    }

    const handler = PROVIDER_MAP[provider];
    if (!handler) {
        throw new Error(`مزود غير مدعوم: ${provider}`);
    }

    return handler(apiKey, modelId, systemPrompt, messages);
}
