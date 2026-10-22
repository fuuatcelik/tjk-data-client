export type DateInput = string | Date;

export interface QueryOptions {
  date?: DateInput;
  hippodrome?: string;
  raceNumber?: number;
  checksum?: string;
  signal?: AbortSignal;
}

export interface ProbablesOptions extends QueryOptions {
  full?: boolean;
}

export interface HorseDetailOptions {
  id?: string;
  key?: string;
  checksum?: string;
  signal?: AbortSignal;
}

export interface RequestOptions {
  checksum?: string;
  signal?: AbortSignal;
}

export interface TjkEnvelope<T> {
  data: T;
  checksum: string;
  updateTime: number;
  stale?: boolean;
}

export interface Hippodrome {
  key: string;
  name: string;
  location: string;
  abroad: boolean;
}

export type Mapper<T> = (value: unknown) => T;
export type FetchLike = typeof globalThis.fetch;

export interface ClientOptions {
  authKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: FetchLike;
  headers?: HeadersInit;
  mappers?: Partial<Record<ServiceName, Mapper<unknown>>>;
}

export type ServiceName =
  | 'program'
  | 'results'
  | 'betProgram'
  | 'agf'
  | 'probables'
  | 'detailedProgram'
  | 'hippodromes'
  | 'horseDetail'
  | 'jockeyChanges';

export interface ApiFailureBody {
  success: false;
  errorCode?: number;
  message?: string;
}
