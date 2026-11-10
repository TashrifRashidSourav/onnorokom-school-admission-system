import { useEffect, useState } from 'react'

/** The current time in milliseconds, updated every second while `active` is true. */
export function useNow(active = true): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) {
      return
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [active])

  return now
}
