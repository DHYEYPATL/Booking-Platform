import { AsyncLocalStorage } from 'async_hooks';

export interface RequestStore {
  requestId: string;
}

export const als = new AsyncLocalStorage<RequestStore>();
