import { useTranslation } from 'react-i18next'
import type { OrderStatus } from './api'
import { colors } from '../theme/colors'

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

export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: colors.earth100, text: colors.earth700 },
  confirmed: { bg: colors.leaf100, text: colors.leaf700 },
  collected: { bg: colors.leaf100, text: colors.leaf700 },
  shipped: { bg: colors.leaf100, text: colors.leaf700 },
  delivered: { bg: colors.leaf200, text: colors.leaf800 },
  cancelled: { bg: '#fee2e2', text: '#b91c1c' },
}
