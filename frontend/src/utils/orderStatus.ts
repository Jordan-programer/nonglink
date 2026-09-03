import { useTranslation } from 'react-i18next'
import type { OrderStatus } from '../api/client'

export function useOrderStatusLabels(): Record<OrderStatus, string> {
  const { t } = useTranslation()
  return {
    pending: t('orderStatus.pending'),
    confirmed: t('orderStatus.confirmed'),
    collected: t('orderStatus.collected'),
    shipped: t('orderStatus.shipped'),
    delivered: t('orderStatus.delivered'),
    cancelled: t('orderStatus.cancelled'),
  }
}

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-earth-100 text-earth-700',
  confirmed: 'bg-leaf-100 text-leaf-700',
  collected: 'bg-leaf-100 text-leaf-700',
  shipped: 'bg-leaf-100 text-leaf-700',
  delivered: 'bg-leaf-200 text-leaf-800',
  cancelled: 'bg-red-100 text-red-700',
}
