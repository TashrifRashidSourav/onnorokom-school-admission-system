import { describe, expect, it } from 'vitest'
import type { ClassSummary } from '../api/types'
import { classNameParts, filterOptions, groupClasses, noFilters } from './classNameParts'

const seats = (name: string, availableSeats = 10): ClassSummary => ({
  id: `c_${name}`,
  name,
  totalSeats: 10,
  heldSeats: 0,
  confirmedSeats: 10 - availableSeats,
  availableSeats,
})

describe('classNameParts', () => {
  it.each([
    ['Class 6 - Morning Shift', 'Class 6', 'Morning'],
    ['Class 6 – Day shift', 'Class 6', 'Day'],
    ['  Class 10 — evening Shift ', 'Class 10', 'Evening'],
    ['Class 9 (Science) - Day Shift', 'Class 9 (Science)', 'Day'],
  ])('reads "%s" as %s, %s', (name, level, shift) => {
    expect(classNameParts(name)).toEqual({ level, shift })
  })

  it.each(['Class 6', 'Nursery', 'Shift 2'])('keeps a name without a shift whole: "%s"', (name) => {
    expect(classNameParts(name)).toEqual({ level: name, shift: null })
  })
})

describe('groupClasses', () => {
  const classes = [
    seats('Class 10 - Day Shift'),
    seats('Class 6 - Day Shift', 0),
    seats('Class 2 - Morning Shift'),
    seats('Class 6 - Morning Shift'),
    seats('Nursery'),
  ]

  it('groups by class in natural order, Morning before Day', () => {
    const groups = groupClasses(classes, noFilters)
    expect(groups.map((g) => g.level)).toEqual(['Class 2', 'Class 6', 'Class 10', 'Nursery'])
    expect(groups[1].classes.map((c) => c.name)).toEqual(['Class 6 - Morning Shift', 'Class 6 - Day Shift'])
  })

  it('filters by search text, class, shift and free seats', () => {
    const names = (filters: Partial<typeof noFilters>) =>
      groupClasses(classes, { ...noFilters, ...filters }).flatMap((g) => g.classes.map((c) => c.name))

    expect(names({ search: 'class 6' })).toEqual(['Class 6 - Morning Shift', 'Class 6 - Day Shift'])
    expect(names({ level: 'Class 10' })).toEqual(['Class 10 - Day Shift'])
    expect(names({ shift: 'Day' })).toEqual(['Class 6 - Day Shift', 'Class 10 - Day Shift'])
    expect(names({ level: 'Class 6', onlyWithSeats: true })).toEqual(['Class 6 - Morning Shift'])
    expect(names({ search: 'nothing like this' })).toEqual([])
  })

  it('lists the classes and shifts for the filter menus', () => {
    expect(filterOptions(classes)).toEqual({
      levels: ['Class 2', 'Class 6', 'Class 10', 'Nursery'],
      shifts: ['Morning', 'Day'],
    })
  })
})
