import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { pushDataLayerEvent } from '../../../shared/analytics/dataLayer'
import { uuid } from '../../../shared/lib/uuid'
import {
  createOrder,
  getOrder,
  getPaymobPaymentStatus,
  initiatePaymob,
} from '../api/checkout.api'
import type { Order } from '../types/checkout.types'

interface UseCheckoutResult {
  order: Order | null
  isCreating: boolean
  isInitiatingPaymob: boolean
  paymentUrl: string | null
  createError: ApiError | null
  paymobError: ApiError | null
  payWithPaymob: () => Promise<void>
}

// One idempotency key per checkout attempt (bumped by retryCreate) so a
// re-mount or an accidental double submit returns the existing draft
// order instead of creating a second one — see docs/api/sprint3-commerce.md.
function makeIdempotencyKey(courseId: string): string {
  return `checkout-${courseId}-${uuid()}`
}

export function useCheckout(
  courseId: string,
  existingOrderId?: string | null,
  pollMs = 2500,
): UseCheckoutResult {
  const [order, setOrder] = useState<Order | null>(null)
  const [isCreating, setIsCreating] = useState(true)
  const [isInitiatingPaymob, setIsInitiatingPaymob] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [createError, setCreateError] = useState<ApiError | null>(null)
  const [paymobError, setPaymobError] = useState<ApiError | null>(null)

  const openPaymobFor = useCallback(
    async (target: Order): Promise<void> => {
      setIsInitiatingPaymob(true)
      setPaymobError(null)
      try {
        const { paymentUrl: url } = await initiatePaymob(target.orderReference)
        pushDataLayerEvent('checkout_redirect', {
          courseId,
          orderReference: target.orderReference,
        })
        // Present the Paymob session as the acceptance iframe embedded in
        // the checkout page. On completion Paymob redirects the browser
        // back to the API's GET webhook, which fulfils the order and
        // routes to the receipt page (success) or back to the checkout
        // to retry (decline).
        setPaymentUrl(url)
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new ApiError('Unknown error', 0)
        setPaymobError(apiError)
        pushDataLayerEvent('checkout_error', {
          courseId,
          stage: 'paymob_init',
          statusCode: apiError.status,
        })
      } finally {
        setIsInitiatingPaymob(false)
      }
    },
    [courseId],
  )

  const payWithPaymob = useCallback((): Promise<void> => {
    if (!order) return Promise.resolve()
    return openPaymobFor(order)
  }, [order, openPaymobFor])

  useEffect(() => {
    if (!order || !paymentUrl) return
    if (order.status === 'paid' || order.paymentStatus === 'failed') return

    let cancelled = false

    const timer = window.setInterval(() => {
      // The API answers this by asking Paymob directly (transaction
      // inquiry), so the local order settles even when the Paymob
      // dashboard callbacks point at the deployed API instead of this
      // developer machine.
      getPaymobPaymentStatus(order.orderReference)
        .then((current) => {
          if (cancelled) return
          if (current.status === 'paid' || current.paymentStatus === 'failed') {
            setOrder(current)
            setPaymentUrl(null)
          }
        })
        .catch(() => {
          // transient failure — keep polling until the order settles
        })
    }, pollMs)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [order, paymentUrl, pollMs])

  useEffect(() => {
    const controller = new AbortController()

    // After a real Paymob success the browser lands here with the paid
    // order id (see the API's GET webhook redirect); fetch the receipt
    // instead of opening a brand-new draft for an already-owned course.
    if (existingOrderId) {
      getOrder(existingOrderId)
        .then((fetched) => {
          if (!controller.signal.aborted) {
            setOrder(fetched)
            // Open the Paymob gateway right away for a fresh pending
            // order; a declined order stays open for a manual retry and
            // a paid one is a receipt, not a new payment.
            if (fetched.status !== 'paid' && fetched.paymentStatus !== 'failed') {
              void openPaymobFor(fetched)
            }
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            const apiError = err instanceof ApiError ? err : new ApiError('Unknown error', 0)
            setCreateError(apiError)
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsCreating(false)
          }
        })
      return () => controller.abort()
    }

    const idempotencyKey = makeIdempotencyKey(courseId)

    pushDataLayerEvent('checkout_start', { courseId })

    createOrder({ courseId, idempotencyKey })
      .then((created) => {
        if (!controller.signal.aborted) {
          setOrder(created)
          if (created.status !== 'paid' && created.paymentStatus !== 'failed') {
            void openPaymobFor(created)
          }
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
  }, [courseId, existingOrderId, openPaymobFor])

  return {
    order,
    isCreating,
    isInitiatingPaymob,
    paymentUrl,
    createError,
    paymobError,
    payWithPaymob,
  }
}