import { describe, expect, it, vi } from 'vitest';
import { cancelAgentInsertion, runAgentInsertion } from './agentBridge';

describe('local-agent NDJSON bridge', () => {
  it('streams tool and terminal events in order', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            '{"type":"start","url":"https://arxiv.org/abs/2607.20399"}\n' +
              '{"type":"event","kind":"tool","name":"Read","detail":"graph.json"}\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            '{"type":"done","ok":true,"outcome":"inserted","reason":"qualified","summary":"proposed","graph_node_id":"paper:test","duration_s":4,"cost_usd":0}\n',
          ),
        );
        controller.close();
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(stream, { status: 200 })),
    );
    const events: string[] = [];
    await runAgentInsertion(
      'claude',
      'https://arxiv.org/abs/2607.20399',
      '',
      'batch',
      '2607.20399',
      new AbortController().signal,
      (event) => events.push(event.type),
    );
    expect(events).toEqual(['start', 'event', 'done']);
    vi.unstubAllGlobals();
  });

  it('propagates cancellation without converting it to success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      }),
    );
    const controller = new AbortController();
    const promise = runAgentInsertion(
      'codex',
      'https://arxiv.org/abs/2607.20399',
      '',
      'batch',
      '2607.20399',
      controller.signal,
      () => undefined,
    );
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    vi.unstubAllGlobals();
  });

  it('requests explicit server-side cancellation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await cancelAgentInsertion();
    expect(fetchMock).toHaveBeenCalledWith('/api/insert', { method: 'DELETE' });
    vi.unstubAllGlobals();
  });
});
