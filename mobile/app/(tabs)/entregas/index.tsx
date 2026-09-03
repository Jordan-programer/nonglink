import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useFocusEffect } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import type { LocationSubscription } from 'expo-location'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import {
  ApiError,
  claimDelivery,
  completeDeliveryStop,
  fetchAvailableDeliveries,
  fetchMyDeliveries,
  fetchMyTransporterProfile,
  fetchOrderTracking,
  fetchTransportEarnings,
  setAvailability,
  updateDeliveryStatus,
  updateTransporterLocation,
  type EarningsSummary,
  type OrderTracking,
  type TransporterProfile,
  type TransportOrder,
} from '../../../lib/api'
import { STATUS_COLORS, useOrderStatusLabels } from '../../../lib/orderStatus'
import { colors } from '../../../theme/colors'

type Tab = 'available' | 'mine'

export default function Entregas() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('available')
  const [available, setAvailable] = useState<TransportOrder[]>([])
  const [mine, setMine] = useState<TransportOrder[]>([])
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [error, setError] = useState<string | null>(null)
  const statusLabels = useOrderStatusLabels()

  const [transporterProfile, setTransporterProfile] = useState<TransporterProfile | null>(null)
  const [savingAvailability, setSavingAvailability] = useState(false)

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const [orderTracking, setOrderTracking] = useState<OrderTracking | null>(null)
  const [completingStopId, setCompletingStopId] = useState<number | null>(null)

  const watchRef = useRef<LocationSubscription | null>(null)

  const load = useCallback(() => {
    if (!token) return
    Promise.all([
      fetchAvailableDeliveries(token),
      fetchMyDeliveries(token),
      fetchTransportEarnings(token),
      fetchMyTransporterProfile(token),
    ])
      .then(([availableRes, mineRes, earningsRes, profileRes]) => {
        setAvailable(availableRes)
        setMine(mineRes)
        setEarnings(earningsRes)
        setTransporterProfile(profileRes)
      })
      .finally(() => setStatus('ready'))
  }, [token])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  async function handleClaim(orderId: number) {
    if (!token) return
    setError(null)
    try {
      await claimDelivery(orderId, token)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('entregas.actionError'))
    }
  }

  async function handleAdvanceStatus(order: TransportOrder) {
    if (!token) return
    const nextStatus = order.status === 'confirmed' ? 'shipped' : 'delivered'
    setError(null)
    try {
      await updateDeliveryStatus(order.id, nextStatus, token)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('entregas.actionError'))
    }
  }

  async function handleToggleAvailability() {
    if (!token || !transporterProfile) return
    setError(null)
    setSavingAvailability(true)
    try {
      const updated = await setAvailability(!transporterProfile.is_available, token)
      setTransporterProfile(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('entregas.availabilityError'))
    } finally {
      setSavingAvailability(false)
    }
  }

  async function handleToggleStops(orderId: number) {
    if (!token) return
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
      setOrderTracking(null)
      return
    }
    setExpandedOrderId(orderId)
    try {
      setOrderTracking(await fetchOrderTracking(orderId, token))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('entregas.actionError'))
    }
  }

  async function handleCompleteStop(orderId: number, stopId: number) {
    if (!token) return
    setCompletingStopId(stopId)
    try {
      await completeDeliveryStop(orderId, stopId, token)
      setOrderTracking(await fetchOrderTracking(orderId, token))
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('entregas.actionError'))
    } finally {
      setCompletingStopId(null)
    }
  }

  const hasActiveDelivery = mine.some(
    (o) => o.status === 'confirmed' || o.status === 'collected' || o.status === 'shipped',
  )

  useEffect(() => {
    let cancelled = false

    async function startWatching() {
      if (!token || !transporterProfile?.is_available || !hasActiveDelivery) return
      const permission = await Location.requestForegroundPermissionsAsync()
      if (!permission.granted || cancelled) return

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 50 },
        (position) => {
          updateTransporterLocation(
            position.coords.latitude,
            position.coords.longitude,
            token,
          ).catch(() => {
            // transient location update failures are fine, next tick retries
          })
        },
      )
    }

    startWatching()

    return () => {
      cancelled = true
      watchRef.current?.remove()
      watchRef.current = null
    }
  }, [token, transporterProfile?.is_available, hasActiveDelivery])

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  const data = tab === 'available' ? available : mine

  return (
    <FlatList
      style={styles.screen}
      data={data}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{t('entregas.title')}</Text>
          <Text style={styles.subtitle}>{t('entregas.subtitle')}</Text>

          {transporterProfile && (
            <View style={styles.availabilityCard}>
              {transporterProfile.verification_status === 'approved' ? (
                <>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.availabilityTitle}>{t('entregas.availabilityTitle')}</Text>
                    <Text style={styles.availabilitySubtitle}>
                      {transporterProfile.is_available
                        ? t('entregas.availabilityOn')
                        : t('entregas.availabilityOff')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleToggleAvailability}
                    disabled={savingAvailability}
                    style={[
                      styles.availabilityButton,
                      transporterProfile.is_available
                        ? styles.availabilityButtonOn
                        : styles.availabilityButtonOff,
                    ]}
                  >
                    <Text
                      style={[
                        styles.availabilityButtonText,
                        !transporterProfile.is_available && styles.availabilityButtonTextOff,
                      ]}
                    >
                      {transporterProfile.is_available
                        ? t('entregas.goOffline')
                        : t('entregas.goOnline')}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.availabilityTitle}>
                      {t(`entregas.verification.${transporterProfile.verification_status}`)}
                    </Text>
                    <Text style={styles.availabilitySubtitle}>{t('entregas.verificationHint')}</Text>
                  </View>
                  <Link href="/entregas/documentos" asChild>
                    <Pressable style={[styles.availabilityButton, styles.availabilityButtonOn]}>
                      <Text style={styles.availabilityButtonText}>
                        {t('entregas.manageDocuments')}
                      </Text>
                    </Pressable>
                  </Link>
                </>
              )}
            </View>
          )}

          {earnings && (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <MaterialCommunityIcons name="wallet-outline" size={18} color={colors.leaf700} />
                <Text style={styles.summaryValue}>
                  {earnings.gross_sales.toLocaleString('pt-AO')} Kz
                </Text>
                <Text style={styles.summaryLabel}>{t('entregas.statTotalSales')}</Text>
              </View>
              <View style={styles.summaryCard}>
                <MaterialCommunityIcons name="percent-outline" size={18} color={colors.leaf700} />
                <Text style={styles.summaryValue}>
                  {earnings.commission.toLocaleString('pt-AO')} Kz
                </Text>
                <Text style={styles.summaryLabel}>{t('entregas.statCommission')}</Text>
              </View>
              <View style={styles.summaryCard}>
                <MaterialCommunityIcons name="cash-multiple" size={18} color={colors.leaf700} />
                <Text style={styles.summaryValue}>
                  {earnings.available_balance.toLocaleString('pt-AO')} Kz
                </Text>
                <Text style={styles.summaryLabel}>{t('entregas.statAvailableBalance')}</Text>
              </View>
            </View>
          )}

          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setTab('available')}
              style={[styles.tabChip, tab === 'available' && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, tab === 'available' && styles.tabChipTextActive]}>
                {t('entregas.available')} ({available.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('mine')}
              style={[styles.tabChip, tab === 'mine' && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, tab === 'mine' && styles.tabChipTextActive]}>
                {t('entregas.mine')} ({mine.length})
              </Text>
            </Pressable>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {tab === 'available' ? t('entregas.noAvailable') : t('entregas.noMine')}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const statusColor = STATUS_COLORS[item.status]
        const isActive =
          item.status === 'confirmed' || item.status === 'collected' || item.status === 'shipped'
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

            <Text style={styles.buyer}>{item.buyer_name}</Text>
            {item.buyer_phone && <Text style={styles.phone}>{item.buyer_phone}</Text>}

            {item.items.map((line) => (
              <Text key={line.id} style={styles.itemLine}>
                {line.quantity}× {line.product_name}
              </Text>
            ))}

            <View style={styles.cardFooter}>
              <Text style={styles.total}>{item.total_amount.toLocaleString('pt-AO')} Kz</Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {tab === 'mine' && isActive && (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => handleToggleStops(item.id)}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {expandedOrderId === item.id ? t('entregas.hideStops') : t('entregas.viewStops')}
                    </Text>
                  </Pressable>
                )}

                {tab === 'available' && (
                  <Pressable style={styles.actionButton} onPress={() => handleClaim(item.id)}>
                    <Text style={styles.actionButtonText}>{t('entregas.claim')}</Text>
                  </Pressable>
                )}

                {tab === 'mine' && item.status !== 'delivered' && item.status !== 'cancelled' && (
                  <Pressable style={styles.actionButton} onPress={() => handleAdvanceStatus(item)}>
                    <Text style={styles.actionButtonText}>
                      {item.status === 'confirmed'
                        ? t('entregas.markShipped')
                        : t('entregas.markDelivered')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {expandedOrderId === item.id && (
              <View style={styles.stopsBox}>
                {!orderTracking ? (
                  <Text style={styles.stopsLoading}>{t('entregas.loadingStops')}</Text>
                ) : (
                  orderTracking.stops.map((stop, index) => (
                    <View key={stop.id} style={styles.stopRow}>
                      <View style={styles.stopLabel}>
                        <View style={styles.stopIndex}>
                          <Text style={styles.stopIndexText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stopText}>
                          {stop.stop_type === 'pickup'
                            ? t('entregas.pickupAt', { name: stop.farm_name ?? t('entregas.farm') })
                            : t('entregas.dropoffAtBuyer')}
                        </Text>
                      </View>
                      {stop.status === 'completed' ? (
                        <Text style={styles.stopCompleted}>{t('entregas.stopCompleted')}</Text>
                      ) : (
                        <Pressable
                          style={styles.stopButton}
                          disabled={completingStopId === stop.id}
                          onPress={() => handleCompleteStop(item.id, stop.id)}
                        >
                          <Text style={styles.stopButtonText}>
                            {completingStopId === stop.id
                              ? '...'
                              : t('entregas.markStopComplete')}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
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
    marginBottom: 8,
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
  availabilityCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
  },
  availabilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.leaf950,
  },
  availabilitySubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  availabilityButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  availabilityButtonOn: {
    backgroundColor: colors.leaf700,
  },
  availabilityButtonOff: {
    borderWidth: 1,
    borderColor: colors.leaf300,
    backgroundColor: '#fff',
  },
  availabilityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  availabilityButtonTextOff: {
    color: colors.leaf700,
  },
  summaryGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flexBasis: '30%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 12,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: colors.leaf950,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(15,36,17,0.6)',
  },
  tabRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.leaf200,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabChipActive: {
    borderColor: colors.leaf600,
    backgroundColor: colors.leaf700,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.7)',
  },
  tabChipTextActive: {
    color: '#fff',
  },
  errorBox: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: colors.earth50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.earth800,
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
  buyer: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.8)',
  },
  phone: {
    marginTop: 1,
    fontSize: 12,
    color: 'rgba(15,36,17,0.55)',
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
  actionButton: {
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.leaf300,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.leaf700,
  },
  stopsBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.leaf100,
    paddingTop: 10,
    gap: 8,
  },
  stopsLoading: {
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.leaf50,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stopLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  stopIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.leaf700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  stopText: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.leaf950,
  },
  stopCompleted: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.leaf700,
  },
  stopButton: {
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stopButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
})
