import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { fetchMyOrders, type Order } from '../../lib/api'
import { STATUS_COLORS, useOrderStatusLabels } from '../../lib/orderStatus'
import { colors } from '../../theme/colors'

export default function Encomendas() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const insets = useSafeAreaInsets()
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const statusLabels = useOrderStatusLabels()

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      let cancelled = false

      fetchMyOrders(token).then((data) => {
        if (cancelled) return
        setOrders(data)
        setStatus('ready')
      })

      return () => {
        cancelled = true
      }
    }, [token]),
  )

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  return (
    <FlatList
      style={styles.screen}
      data={orders}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{t('orders.title')}</Text>
          <Text style={styles.subtitle}>{t('orders.subtitle')}</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t('orders.noOrdersYet')}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const statusColor = STATUS_COLORS[item.status]
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{t('orders.orderNumber', { id: item.id })}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
                <Text style={[styles.badgeText, { color: statusColor.text }]}>
                  {statusLabels[item.status]}
                </Text>
              </View>
            </View>

            {item.items.map((line) => (
              <Text key={line.id} style={styles.itemLine}>
                {line.quantity}× {line.product_name}
              </Text>
            ))}

            <View style={styles.cardFooter}>
              <Text style={styles.total}>{item.total_amount.toLocaleString('pt-AO')} Kz</Text>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('pt-AO')}
              </Text>
            </View>
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream50,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream50,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.leaf950,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  emptyBox: {
    borderRadius: 16,
    backgroundColor: colors.leaf50,
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderId: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.leaf950,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemLine: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(15,36,17,0.65)',
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  total: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.leaf900,
  },
  date: {
    fontSize: 12,
    color: 'rgba(15,36,17,0.5)',
  },
})
