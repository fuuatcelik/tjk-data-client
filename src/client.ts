import { TjkApiError, TjkHttpError, TjkResponseError, TjkValidationError } from './errors.js';
import { compact, formatTjkDate, isRecord } from './utils.js';
import type { ClientOptions, Hippodrome, HorseDetailOptions, Mapper, ProbablesOptions, QueryOptions, RequestOptions, ServiceName, TjkEnvelope } from './types.js';

const PATHS = {
  program: 'program', results: 'sonuclar', betProgram: 'bahis-programi', agf: 'agf',
  probables: 'muhtemeller', probablesFull: 'muhtemeller-tjk', detailedProgram: 'program-cache-tjk',
  hippodromes: 'hipodromlar', horseDetail: 'at-detay', jockeyChanges: 'jokey-degisiklikleri'
} as const;

const DATA_KEYS: Record<ServiceName, string> = {
  program: 'yarislar', results: 'yarislar', betProgram: 'yarislar', agf: 'yarislar',
  probables: 'yarislar', detailedProgram: 'hippodromes', hippodromes: 'hipodromlar',
  horseDetail: 'at', jockeyChanges: 'yarislar'
};

const identity = <T>(value: unknown): T => value as T;

export class TjkClient {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  private readonly authKey: string;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly headers: Headers;
  private readonly mappers: Partial<Record<ServiceName, Mapper<unknown>>>;

  constructor(options: ClientOptions) {
    if (!options?.authKey?.trim()) throw new TjkValidationError('authKey zorunludur.');
    this.authKey = options.authKey;
    this.baseUrl = (options.baseUrl ?? 'https://vhs.tjk.org/vss/data').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetcher = options.fetch ?? globalThis.fetch;
    if (!this.fetcher) throw new TjkValidationError('Fetch uygulaması bulunamadı. Node.js 18+ kullanın.');
    this.headers = new Headers(options.headers);
    this.headers.set('X-Auth', this.authKey);
    this.headers.set('Accept', 'application/json');
    this.mappers = options.mappers ?? {};
  }

  getProgram<T = unknown[]>(options?: QueryOptions) { return this.query<T>('program', PATHS.program, this.raceParams(options), options?.signal); }
  getResults<T = unknown[]>(options?: QueryOptions) { return this.query<T>('results', PATHS.results, this.raceParams(options), options?.signal); }
  getAgf<T = unknown[]>(options?: QueryOptions) { return this.query<T>('agf', PATHS.agf, this.raceParams(options), options?.signal); }
  getJockeyChanges<T = unknown[]>(options?: QueryOptions) { return this.query<T>('jockeyChanges', PATHS.jockeyChanges, this.raceParams(options), options?.signal); }
  getBetProgram<T = unknown[]>(options?: RequestOptions) { return this.query<T>('betProgram', PATHS.betProgram, { checksum: options?.checksum }, options?.signal); }
  getDetailedProgram<T = unknown[]>(options?: Pick<QueryOptions, 'date' | 'checksum' | 'signal'>) { return this.query<T>('detailedProgram', PATHS.detailedProgram, this.raceParams(options), options?.signal); }
  getProbables<T = unknown[]>(options?: ProbablesOptions) { return this.query<T>('probables', options?.full ? PATHS.probablesFull : PATHS.probables, this.raceParams(options), options?.signal); }

  async getHippodromes(options?: RequestOptions): Promise<TjkEnvelope<Hippodrome[]>> {
    const result = await this.query<unknown[]>('hippodromes', PATHS.hippodromes, { checksum: options?.checksum }, options?.signal);
    return { ...result, data: result.data.map((item) => {
      const row = isRecord(item) ? item : {};
      return { key: String(row.KEY ?? ''), name: String(row.HIPODROM ?? ''), location: String(row.YER ?? ''), abroad: Boolean(row.YABANCI) };
    }) };
  }

  getHorseDetail<T = unknown>(options: HorseDetailOptions): Promise<TjkEnvelope<T>> {
    if ((!options.id && !options.key) || (options.id && options.key)) throw new TjkValidationError('At detayı için yalnızca id veya key verilmelidir.');
    return this.query<T>('horseDetail', PATHS.horseDetail, compact({ atkodu: options.id, atkey: options.key, checksum: options.checksum }), options.signal);
  }

  private raceParams(options?: Pick<QueryOptions, 'date' | 'hippodrome' | 'raceNumber' | 'checksum'>): Record<string, unknown> {
    if (options?.raceNumber !== undefined && !options.hippodrome) throw new TjkValidationError('raceNumber kullanılırken hippodrome zorunludur.');
    if (options?.raceNumber !== undefined && (!Number.isInteger(options.raceNumber) || options.raceNumber < 1)) throw new TjkValidationError('raceNumber pozitif bir tam sayı olmalıdır.');
    return compact({ date: options?.date ? formatTjkDate(options.date) : undefined, hipodromkey: options?.hippodrome, no: options?.raceNumber, checksum: options?.checksum });
  }

  private async query<T>(service: ServiceName, path: string, params: Record<string, unknown>, signal?: AbortSignal): Promise<TjkEnvelope<T>> {
    const url = new URL(`${this.baseUrl}/${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    const timeout = AbortSignal.timeout(this.timeoutMs);
    const combinedSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    let response: Response;
    try { response = await this.fetcher(url, { method: 'GET', headers: this.headers, signal: combinedSignal }); }
    catch (cause) { throw new TjkHttpError(`TJK isteği tamamlanamadı: ${String(cause)}`, 0); }
    let body: unknown;
    try { body = await response.json(); } catch { throw new TjkResponseError('TJK yanıtı geçerli JSON değil.'); }
    if (!response.ok) throw new TjkHttpError(`TJK HTTP ${response.status} hatası.`, response.status, body);
    if (!isRecord(body)) throw new TjkResponseError('TJK yanıt zarfı beklenen biçimde değil.');
    if (body.success !== true) throw new TjkApiError(String(body.message ?? 'TJK servis hatası.'), typeof body.errorCode === 'number' ? body.errorCode : undefined, body);
    const container = isRecord(body.data) ? body.data : {};
    const raw = container[DATA_KEYS[service]];
    const mapper = (this.mappers[service] ?? identity<T>) as Mapper<T>;
    const envelope: TjkEnvelope<T> = { data: mapper(raw), checksum: String(body.checksum ?? ''), updateTime: Number(body.updatetime ?? 0) };
    if (typeof body.stale === 'boolean') envelope.stale = body.stale;
    return envelope;
  }
}
