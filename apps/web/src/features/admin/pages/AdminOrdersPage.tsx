import { useState, useCallback } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { ORDER_STATUS_LABEL } from '../lib/order-labels'
import { useAdminOrders } from '../hooks/useAdminOrders'
import type { OrderStatus, AdminOrderListItem } from '../types/admin.types'

type StatusFilter = OrderStatus | 'all'

function formatMoney(minor: number, currency: string) {
  return `${(minor / 100).toLocaleString('ar-EG')} ${currency}`
}

const PAGE_SIZE = 10

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function AdminOrdersPage() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const { data, isLoading, error, refetch } = useAdminOrders({
    status: status === 'all' ? undefined : status,
  })

  const toHaystack = useCallback((order: AdminOrderListItem) => `${order.studentName} ${order.status} ${order.paymentStatus}`, [])
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)

  return (
    <>
      <PageHeader title="الطلبات" description="كل طلبات الشراء على المنصة" />

      <div className="actions section" style={{ flexWrap: 'wrap', gap: 8 }}>
        {(['all', 'pending', 'paid', 'failed'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`chip clickable outline${status === option ? ' selected' : ''}`}
            aria-pressed={status === option}
            onClick={() => setStatus(option)}
          >
            {option === 'all' ? 'كل الحالات' : ORDER_STATUS_LABEL[option].label}
          </button>
        ))}
      </div>

      <SearchField
        id="admin-orders-search"
        label="بحث في الطلبات"
        placeholder="ابحث باسم الطالب..."
        value={list.query}
        onChange={list.search}
      />

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && (
        <ErrorState
          title="تعذر تحميل الطلبات"
          message="لم نتمكن من تحميل قائمة الطلبات، جرب مرة أخرى."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <EmptyState fullPage title="لا توجد طلبات" message="مفيش طلبات مطابقة للفلتر الحالي" />
      )}

      {!isLoading && !error && list.isEmptyResult && (
        <EmptyState fullPage title="لا توجد نتائج" message="مفيش نتائج مطابقة لبحثك، جرّب كلمة تانية" />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="table-wrap section">
          <table className="mtable">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الحالة</th>
                <th>حالة الدفع</th>
                <th>الإجمالي</th>
                <th>تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {list.pageItems.map((order) => {
                const statusLabel = ORDER_STATUS_LABEL[order.status]
                const paymentLabel = ORDER_STATUS_LABEL[order.paymentStatus]
                return (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/admin/orders/${order.id}`}>
                        <strong>{order.studentName}</strong>
                      </Link>
                    </td>
                    <td>
                      <span className={`chip ${statusLabel.chip}`}>{statusLabel.label}</span>
                    </td>
                    <td>
                      <span className={`chip ${paymentLabel.chip}`}>{paymentLabel.label}</span>
                    </td>
                    <td>
                      <strong>{formatMoney(order.totalMinor, order.currency)}</strong>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="طلب"
        />
      )}
    </>
  )
}
