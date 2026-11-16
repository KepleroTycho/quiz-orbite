// Tipi minimi di richiesta e risposta usati dalle funzioni in api/.
export type Req = {
  method?: string;
  body?: unknown;
};

export type Res = {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
};
