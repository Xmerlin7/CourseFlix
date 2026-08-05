import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { pushDataLayerEvent } from '../../../shared/analytics/dataLayer'
import { confirmOrder, createOrder } from '../api/checkout.api'
import type { Order, PaymentSimulation } from '../types/checkout.types'

interface UseCheckoutResult {
  order: Order | null
  isCreating: boolean
  isConfirming: boolean
  createError: ApiError | null
  confirmError: ApiError | null
  pay: (simulate?: PaymentSimulation) => Promise<void>
  retryCreate: () => void
}

// One idempotency key per checkout attempt (bumped by retryCreate) so a
// re-mount or an accidental double submit returns the existing draft
// order instead of creating a second one — see docs/api/sprint3-commerce.md.
function makeIdempotencyKey(courseId: string): string {
  return `checkout-${courseId}-${crypto.randomUUID()}`
}

export function useCheckout(courseId: string): UseCheckoutResult {
  const [order, setOrder] = useState<Order | null>(null)
  const [isCreating, setIsCreating] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [createError, setCreateError] = useState<ApiError | null>(null)
  const [confirmError, setConfirmError] = useState<ApiError | null>(null)
  const [attempt, setAttempt] = useState(0)
  // Dedupes the purchase event: `order` can re-render with the same paid
  // order (e.g. a retried confirm returning the same authoritative state)
  // without pushing a second purchase event for the same reference.
  const purchaseEventSentFor = useRef<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const idempotencyKey = makeIdempotencyKey(courseId)

    setIsCreating(true)
    setCreateError(null)
    setOrder(null)

    pushDataLayerEvent('checkout_start', { courseId })

    createOrder({ courseId, idempotencyKey })
      .then((created) => {
        if (!controller.signal.aborted) {
          setOrder(created)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          const apiError = err instanceof ApiError ? err : new ApiError('Unknown error', 0)
          setCreateError(apiError)
          pushDataLayerEvent('checkout_error', {
            courseId,
            stage: 'create',
            statusCode: apiError.status,
          })
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsCreating(false)
        }
      })

    return () => controller.abort()
  }, [courseId, attempt])

  const pay = useCallback(
    async (simulate: PaymentSimulation = 'success') => {
      if (!order) return

      setIsConfirming(true)
      setConfirmError(null)
      try {
        const confirmed = await confirmOrder(order.orderReference, { simulate })
        setOrder(confirmed)

        if (
          confirmed.status === 'paid' &&
          purchaseEventSentFor.current !== confirmed.orderReference
        ) {
          purchaseEventSentFor.current = confirmed.orderReference
          pushDataLayerEvent('purchase', {
            orderReference: confirmed.orderReference,
            courseId,
            amountMinor: confirmed.amountMinor,
            currency: confirmed.currency,
          })
        } else if (confirmed.status === 'failed') {
          pushDataLayerEvent('checkout_error', {
            courseId,
            stage: 'confirm',
            reason: 'declined',
          })
        }
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new ApiError('Unknown error', 0)
        setConfirmError(apiError)
        pushDataLayerEvent('checkout_error', {
          courseId,
          stage: 'confirm',
          statusCode: apiError.status,
        })
      } finally {
        setIsConfirming(false)
      }
    },
    [order],
  )

  const retryCreate = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  return { order, isCreating, isConfirming, createError, confirmError, pay, retryCreate }
}
