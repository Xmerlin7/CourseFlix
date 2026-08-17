import { type FormEvent, useState } from 'react'
import type { PaymentSimulation } from '../types/checkout.types'
import {
  formatCardNumber,
  formatExpiry,
  isExpired,
  isValidCardNumber,
} from '../lib/card-utils'

export const SUCCESS_TEST_CARD = '5123456789012345'
export const DECLINE_TEST_CARD = '4242424242424242'

interface CardPaymentFormProps {
  name: string
  number: string
  expiry: string
  cvv: string
  isConfirming: boolean
  onNameChange: (value: string) => void
  onNumberChange: (value: string) => void
  onExpiryChange: (value: string) => void
  onCvvChange: (value: string) => void
  onCvvFocusChange: (focused: boolean) => void
  onPay: (simulate: PaymentSimulation) => Promise<void>
}

interface FieldErrors {
  name?: string
  number?: string
  expiry?: string
  cvv?: string
}

function validate(name: string, number: string, expiry: string, cvv: string): FieldErrors {
  const errors: FieldErrors = {}
  if (name.trim().length < 3) {
    errors.name = 'أدخل اسم حامل البطاقة'
  }
  if (!isValidCardNumber(number)) {
    errors.number = 'رقم البطاقة غير صحيح'
  }
  if (!/^\d{2}\/\d{2}$/.test(expiry) || isExpired(expiry)) {
    errors.expiry = 'تاريخ انتهاء غير صحيح'
  }
  const cvvDigits = cvv.replace(/\D/g, '')
  if (cvvDigits.length < 3) {
    errors.cvv = 'رمز الأمان غير صحيح'
  }
  return errors
}

function outcomeFor(number: string): PaymentSimulation {
  const digits = number.replace(/\D/g, '')
  if (digits === DECLINE_TEST_CARD) return 'decline'
  return 'success'
}

export function CardPaymentForm({
  name,
  number,
  expiry,
  cvv,
  isConfirming,
  onNameChange,
  onNumberChange,
  onExpiryChange,
  onCvvChange,
  onCvvFocusChange,
  onPay,
}: CardPaymentFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(name, number, expiry, cvv)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    void onPay(outcomeFor(number))
  }

  return (
    <form className="ccard-form" onSubmit={handleSubmit} noValidate>
      <div className="tf">
        <label htmlFor="card-holder">اسم حامل البطاقة</label>
        <input
          id="card-holder"
          className={`field${errors.name ? ' invalid' : ''}`}
          autoComplete="cc-name"
          autoCapitalize="words"
          placeholder="الاسم كما يظهر على البطاقة"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>

      <div className="tf">
        <label htmlFor="card-number">رقم البطاقة</label>
        <input
          id="card-number"
          className={`field${errors.number ? ' invalid' : ''}`}
          dir="ltr"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          value={number}
          onChange={(event) => onNumberChange(formatCardNumber(event.target.value))}
        />
        {errors.number && <span className="error-text">{errors.number}</span>}
      </div>

      <div className="ccard-fields-row">
        <div className="tf">
          <label htmlFor="card-expiry">تاريخ الانتهاء</label>
          <input
            id="card-expiry"
            className={`field${errors.expiry ? ' invalid' : ''}`}
            dir="ltr"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            maxLength={5}
            value={expiry}
            onChange={(event) => onExpiryChange(formatExpiry(event.target.value))}
          />
          {errors.expiry && <span className="error-text">{errors.expiry}</span>}
        </div>

        <div className="tf">
          <label htmlFor="card-cvv">رمز الأمان (CVV)</label>
          <input
            id="card-cvv"
            className={`field${errors.cvv ? ' invalid' : ''}`}
            dir="ltr"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="•••"
            maxLength={4}
            value={cvv}
            onFocus={() => onCvvFocusChange(true)}
            onBlur={() => onCvvFocusChange(false)}
            onChange={(event) => onCvvChange(event.target.value.replace(/\D/g, ''))}
          />
          {errors.cvv && <span className="error-text">{errors.cvv}</span>}
        </div>
      </div>

      <button type="submit" className="btn big" disabled={isConfirming}>
        <span className="ms" aria-hidden="true">
          lock
        </span>
        {isConfirming ? 'جاري تأكيد الدفع...' : 'ادفع الآن'}
      </button>

      <p className="ccard-dev-hint">
        <span className="ms" aria-hidden="true">
          science
        </span>
        وضع تجريبي — جرّب <b dir="ltr">5123 4567 8901 2345</b> للنجاح أو{' '}
        <b dir="ltr">4242 4242 4242 4242</b> للرفض
      </p>
    </form>
  )
}