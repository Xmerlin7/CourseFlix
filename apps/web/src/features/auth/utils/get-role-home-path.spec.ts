import { describe, expect, it } from 'vitest'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { getRoleHomePath } from './get-role-home-path'

describe('getRoleHomePath', () => {
  it('sends students to دوراتي, not the dashboard', () => {
    expect(getRoleHomePath('student')).toBe(ROUTE_PATHS.STUDENT.COURSES)
  })

  it('leaves teacher and admin destinations unchanged', () => {
    expect(getRoleHomePath('teacher')).toBe(ROUTE_PATHS.TEACHER.DASHBOARD)
    expect(getRoleHomePath('admin')).toBe(ROUTE_PATHS.ADMIN.DASHBOARD)
  })
})
