import { describe, expect, it } from 'vitest'
import { isValidStudentId, loadStudentId, saveStudentId } from './studentId'

describe('isValidStudentId', () => {
  it('accepts exactly 17 digits', () => {
    expect(isValidStudentId('20152691234567890')).toBe(true)
  })

  it.each([
    ['empty', ''],
    ['16 digits', '2015269123456789'],
    ['18 digits', '201526912345678901'],
    ['a letter', '2015269123456789X'],
    ['spaces inside', '20152691 23456789'],
    ['a dash', '2015269-123456789'],
    ['Bengali digits', '২০১৫২৬৯১২৩৪৫৬৭৮৯০'],
  ])('rejects %s', (_case, value) => {
    expect(isValidStudentId(value)).toBe(false)
  })
})

describe('saved student ID', () => {
  it('is kept across page loads', () => {
    saveStudentId('20152691234567890')
    expect(loadStudentId()).toBe('20152691234567890')
  })

  it('can be forgotten', () => {
    saveStudentId('20152691234567890')
    saveStudentId(null)
    expect(loadStudentId()).toBeNull()
  })

  it('is ignored when what was stored is not a valid ID', () => {
    window.localStorage.setItem('admission.studentId', '12345')
    expect(loadStudentId()).toBeNull()
  })
})
