import { useSyncExternalStore } from 'react'

/**
 * How the server answered most recently, across every request of the app:
 * - `ok`: the last request got a normal answer (any 2xx or 4xx)
 * - `error`: the server failed with a 5xx
 * - `unreachable`: no answer at all (server stopped, network down)
 */
export type ServerStatus = 'ok' | 'error' | 'unreachable'

let current: ServerStatus = 'ok'
const listeners = new Set<() => void>()

/** Called by the API client after every request. */
export function reportServerStatus(next: ServerStatus): void {
  if (next === current) {
    return
  }
  current = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getServerStatus = (): ServerStatus => current

/** The latest server status; re-renders when it changes. */
export function useServerStatus(): ServerStatus {
  return useSyncExternalStore(subscribe, getServerStatus)
}
