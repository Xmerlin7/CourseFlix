import { beforeEach, describe, expect, it } from 'vitest'
import { ANALYTICS_SCHEMA_VERSION, pushDataLayerEvent } from './dataLayer'

describe('pushDataLayerEvent', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  it('pushes a versioned event with the given payload', () => {
    pushDataLayerEvent('checkout_start', { courseId: 'course-1' })

    expect(window.dataLayer).toEqual([
      { event: 'checkout_start', schemaVersion: ANALYTICS_SCHEMA_VERSION, courseId: 'course-1' },
    ])
  })

  it('resets the ecommerce object before a purchase event', () => {
    pushDataLayerEvent('purchase', { orderReference: 'order-1', amountMinor: 1000 })

    expect(window.dataLayer[0]).toEqual({ ecommerce: null })
    expect(window.dataLayer[1]).toMatchObject({ event: 'purchase' })
  })

  it.each([
    ['email', 'a@b.com'],
    ['fullName', 'a@b.com'],
    ['password', 'hunter2'],
    ['chatText', 'hello'],
    ['answerText', 'the answer'],
    ['documentText', 'lesson notes'],
  ])('rejects the denylisted key "%s"', (key, value) => {
    expect(() => pushDataLayerEvent('checkout_error', { [key]: value })).toThrow()
    expect(window.dataLayer).toEqual([])
  })

  it('rejects a raw payment card number even under an unlisted key', () => {
    expect(() =>
      pushDataLayerEvent('checkout_error', { note: '4111111111111111' }),
    ).toThrow()
  })

  it('rejects an email-shaped value under an unlisted key', () => {
    expect(() =>
      pushDataLayerEvent('checkout_error', { note: 'contact me at a@b.com' }),
    ).toThrow()
  })

  it('allows opaque IDs and numeric amounts through', () => {
    expect(() =>
      pushDataLayerEvent('purchase', {
        orderReference: 'order-1',
        courseId: 'course-1',
        amountMinor: 5000,
        currency: 'EGP',
      }),
    ).not.toThrow()
  })
})
