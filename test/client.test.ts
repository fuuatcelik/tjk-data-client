import { describe, expect, it, vi } from 'vitest';
import { TjkClient, TjkApiError, TjkValidationError, formatTjkDate } from '../src/index.js';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('TjkClient', () => {
  it('builds official query keys and sends auth header', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ success: true, data: { yarislar: [{ KEY: 'x' }] }, checksum: 'abc', updatetime: 42 }));
    const client = new TjkClient({ authKey: 'secret', fetch: fetcher });
    const result = await client.getProgram({ date: '2026-10-22', hippodrome: '34', raceNumber: 2 });
    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).toContain('date=22%2F10%2F2026');
    expect(String(url)).toContain('hipodromkey=34');
    expect(String(url)).toContain('no=2');
    expect(new Headers(init?.headers).get('X-Auth')).toBe('secret');
    expect(result).toEqual({ data: [{ KEY: 'x' }], checksum: 'abc', updateTime: 42 });
  });

  it('maps hippodromes to stable field names', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ success: true, data: { hipodromlar: [{ KEY: '34', HIPODROM: 'İstanbul', YER: 'Veliefendi', YABANCI: false }] }, checksum: '', updatetime: 1 }));
    const client = new TjkClient({ authKey: 'x', fetch: fetcher });
    expect((await client.getHippodromes()).data[0]).toEqual({ key: '34', name: 'İstanbul', location: 'Veliefendi', abroad: false });
  });

  it('throws typed errors for invalid input and API failures', async () => {
    expect(() => new TjkClient({ authKey: '' })).toThrow(TjkValidationError);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ success: false, errorCode: 7, message: 'Yetkisiz' }));
    await expect(new TjkClient({ authKey: 'x', fetch: fetcher }).getProgram()).rejects.toBeInstanceOf(TjkApiError);
  });
});

it('formats dates for the upstream service', () => expect(formatTjkDate('2026-10-22')).toBe('22/10/2026'));
