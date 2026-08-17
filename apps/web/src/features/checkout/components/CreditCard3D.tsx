import { useCallback, useRef, useState } from 'react'
import type { CardBrand } from '../lib/card-utils'

interface CreditCard3DProps {
  number: string
  holderName: string
  expiry: string
  cvv: string
  brand: CardBrand
  flipped: boolean
}

function prefersReducedMotion(): boolean {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.getAttribute('data-reduce-motion') === '1'
  )
}

function BrandMark({ brand }: { brand: CardBrand }) {
  switch (brand) {
    case 'visa':
      return <span className="cbrand cbrand-visa">VISA</span>
    case 'mastercard':
      return (
        <span className="cbrand cbrand-mastercard" aria-hidden="true">
          <i />
          <i />
        </span>
      )
    case 'amex':
      return <span className="cbrand cbrand-amex">AMEX</span>
    case 'mada':
      return (
        <span className="cbrand cbrand-mada">
          <span className="ms" aria-hidden="true">
            credit_card
          </span>
          mada
        </span>
      )
    default:
      return (
        <span className="cbrand cbrand-unknown" aria-hidden="true">
          <span className="ms">credit_card</span>
        </span>
      )
  }
}

function displayNumber(number: string): string {
  return number || '•••• •••• •••• ••••'
}

function displayCvv(cvv: string): string {
  const length = Math.max(cvv.length, 3)
  return '•'.repeat(Math.min(length, 4))
}

export function CreditCard3D({ number, holderName, expiry, cvv, brand, flipped }: CreditCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState<{ rx: number; ry: number; gx: number; gy: number } | null>(null)

  const handleMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    const ry = (px - 0.5) * 16
    const rx = (0.5 - py) * 16
    setTilt({
      rx: Math.max(-10, Math.min(10, rx)),
      ry: Math.max(-10, Math.min(10, ry)),
      gx: px * 100,
      gy: py * 100,
    })
  }, [])

  const handleLeave = useCallback(() => setTilt(null), [])

  const tiltStyle = tilt
    ? ({
        transform: `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
        '--gx': `${tilt.gx.toFixed(1)}%`,
        '--gy': `${tilt.gy.toFixed(1)}%`,
      } as React.CSSProperties)
    : undefined

  return (
    <div
      className={`ccard-wrap${flipped ? ' flipped' : ''}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      aria-hidden="true"
    >
      <div ref={cardRef} className="ccard" style={tiltStyle}>
        <div className="ccard-inner">
          <div dir="ltr" className="ccard-face ccard-front">
          <span className="ccard-blob ccard-blob-a" />
          <span className="ccard-blob ccard-blob-b" />
          <span className="ccard-glare" />
          <div className="ccard-top">
            <span className="ccard-chip" />
            <span className="ccard-contactless" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="ccard-number">{displayNumber(number)}</div>
          <div className="ccard-bottom">
            <div className="ccard-holder">
              <span className="ccard-label">حامل البطاقة</span>
              <strong>{holderName || 'اسم حامل البطاقة'}</strong>
            </div>
            <div className="ccard-expiry">
              <span className="ccard-label">تاريخ الانتهاء</span>
              <strong dir="ltr">{expiry || 'MM/YY'}</strong>
            </div>
          </div>
          <div className="ccard-brand">
            <BrandMark brand={brand} />
          </div>
        </div>

        <div dir="ltr" className="ccard-face ccard-back">
          <span className="ccard-blob ccard-blob-a" />
          <span className="ccard-blob ccard-blob-b" />
          <span className="ccard-glare" />
          <div className="ccard-magstripe" />
          <div className="ccard-back-body">
            <div className="ccard-signature">
              <span className="ccard-signature-svg">أمان</span>
              <span className="ccard-cvv">{displayCvv(cvv)}</span>
            </div>
            <div className="ccard-brand">
              <BrandMark brand={brand} />
            </div>
          </div>
          <p className="ccard-back-note">بطاقة تجريبية — بياناتها لا تُرسل خارج المتصفح</p>
        </div>
        </div>
      </div>
    </div>
  )
}