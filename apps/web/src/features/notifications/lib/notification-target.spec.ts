import { describe, expect, it } from 'vitest'
import { resolveNotificationTarget } from './notification-target'

describe('resolveNotificationTarget', () => {
  it('returns null when there is no related entity', () => {
    expect(resolveNotificationTarget({ relatedEntityType: null, relatedEntityId: null }, 'student')).toBeNull()
  })

  it('deep-links students to mini quizzes', () => {
    expect(
      resolveNotificationTarget(
        { relatedEntityType: 'mini_quiz', relatedEntityId: 'quiz-1' },
        'student',
      ),
    ).toEqual({
      path: '/student/mini-quizzes/quiz-1',
      actionLabel: 'ابدأ الكويز',
      actionIcon: 'quiz',
    })
  })

  it('keeps quizzes student-only', () => {
    expect(
      resolveNotificationTarget({ relatedEntityType: 'quiz', relatedEntityId: 'quiz-1' }, 'teacher'),
    ).toBeNull()
  })

  it('maps discussion threads for students and teachers', () => {
    expect(
      resolveNotificationTarget(
        { relatedEntityType: 'discussion_thread', relatedEntityId: 'thread-1' },
        'student',
      )?.path,
    ).toBe('/student/discussions/thread-1')
    expect(
      resolveNotificationTarget(
        { relatedEntityType: 'discussion_thread', relatedEntityId: 'thread-1' },
        'teacher',
      )?.path,
    ).toBe('/teacher/discussions/thread-1')
  })

  it('maps support tickets for every role', () => {
    expect(
      resolveNotificationTarget(
        { relatedEntityType: 'support_ticket', relatedEntityId: 'ticket-1' },
        'teacher',
      )?.path,
    ).toBe('/teacher/support/ticket-1')
    expect(
      resolveNotificationTarget(
        { relatedEntityType: 'support_ticket', relatedEntityId: 'ticket-1' },
        'admin',
      )?.path,
    ).toBe('/admin/support/ticket-1')
  })

  it('treats assistants as teachers', () => {
    expect(
      resolveNotificationTarget(
        { relatedEntityType: 'assistant_action', relatedEntityId: 'action-1' },
        'assistant',
      )?.path,
    ).toBe('/teacher/assistant-actions')
  })

  it('maps interventions to the role interventions page', () => {
    expect(
      resolveNotificationTarget(
        { relatedEntityType: 'intervention', relatedEntityId: 'i-1' },
        'student',
      )?.path,
    ).toBe('/student/interventions')
  })

  it('returns null for unknown entity types', () => {
    expect(
      resolveNotificationTarget(
        { relatedEntityType: 'something_else' as never, relatedEntityId: 'x' },
        'student',
      ),
    ).toBeNull()
  })
})
