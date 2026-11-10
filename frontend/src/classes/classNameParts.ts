import type { ClassSummary } from '../api/types'

export interface ClassNameParts {
  /** The class without the shift, e.g. "Class 6". The whole name when no shift is found. */
  level: string
  /** The shift, e.g. "Morning", or null when the name has none. */
  shift: string | null
}

// "Class 6 - Morning Shift", "Class 6 – Day shift", "Class 9 (Science) - Evening Shift"
const WITH_SHIFT = /^(.+?)\s*[-–—]\s*(.+?)\s+shift\s*$/i

/**
 * Splits a class name into the class and the shift. The API has no separate fields
 * for these: each shift is its own class with a name like "Class 6 - Morning Shift",
 * so the page reads them from the name to group and filter classes.
 */
export function classNameParts(name: string): ClassNameParts {
  const match = WITH_SHIFT.exec(name.trim())
  if (match === null) {
    return { level: name.trim(), shift: null }
  }
  const shift = match[2].trim()
  return { level: match[1].trim(), shift: shift.charAt(0).toUpperCase() + shift.slice(1) }
}

/** The first number in a class name ("Class 10" → 10), to put Class 2 before Class 10. */
function levelNumber(level: string): number {
  const match = /\d+/.exec(level)
  return match === null ? Number.POSITIVE_INFINITY : Number(match[0])
}

/** Natural order of class levels: Class 1, Class 2, …, Class 10, then anything else by name. */
export function compareLevels(a: string, b: string): number {
  return levelNumber(a) - levelNumber(b) || a.localeCompare(b)
}

const shiftOrder = ['Morning', 'Day', 'Evening']

/** Morning before Day before Evening, other shifts by name, no shift last. */
export function compareShifts(a: string | null, b: string | null): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  const ia = shiftOrder.indexOf(a)
  const ib = shiftOrder.indexOf(b)
  if (ia !== -1 || ib !== -1) return (ia === -1 ? shiftOrder.length : ia) - (ib === -1 ? shiftOrder.length : ib)
  return a.localeCompare(b)
}

export interface ClassFilters {
  search: string
  level: string | null
  shift: string | null
  onlyWithSeats: boolean
}

export const noFilters: ClassFilters = { search: '', level: null, shift: null, onlyWithSeats: false }

export interface ClassGroup {
  level: string
  classes: ClassSummary[]
}

/**
 * The classes that match the filters, grouped by class level in natural order, each
 * group sorted by shift (Morning, Day, Evening).
 */
export function groupClasses(classes: ClassSummary[], filters: ClassFilters): ClassGroup[] {
  const search = filters.search.trim().toLowerCase()
  const groups = new Map<string, ClassSummary[]>()

  for (const c of classes) {
    const parts = classNameParts(c.name)
    if (search !== '' && !c.name.toLowerCase().includes(search)) continue
    if (filters.level !== null && parts.level !== filters.level) continue
    if (filters.shift !== null && parts.shift !== filters.shift) continue
    if (filters.onlyWithSeats && c.availableSeats <= 0) continue
    groups.set(parts.level, [...(groups.get(parts.level) ?? []), c])
  }

  return [...groups.entries()]
    .sort(([a], [b]) => compareLevels(a, b))
    .map(([level, list]) => ({
      level,
      classes: list.sort((a, b) => compareShifts(classNameParts(a.name).shift, classNameParts(b.name).shift)),
    }))
}

/** Every class level and every shift that occurs, in display order, for the filter menus. */
export function filterOptions(classes: ClassSummary[]): { levels: string[]; shifts: string[] } {
  const levels = new Set<string>()
  const shifts = new Set<string>()
  for (const c of classes) {
    const parts = classNameParts(c.name)
    levels.add(parts.level)
    if (parts.shift !== null) shifts.add(parts.shift)
  }
  return { levels: [...levels].sort(compareLevels), shifts: [...shifts].sort(compareShifts) }
}
