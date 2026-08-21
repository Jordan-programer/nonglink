import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
  PaypalEnvironment,
  PayPalWebCheckoutFundingSource,
  startCheckout,
  type PayPalWebCheckoutEvent,
} from 'react-native-paypal-web-payments'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../../context/AuthContext'
import {
  ApiError,
  capturePayPalOrder,
  createPayPalOrder,
  fetchMyPaymentMethods,
  fetchOrder,
  fetchPayPalClientId,
  setOrderPaymentMethod,
  type Order,
  type PaymentMethod,
} from '../../../../lib/api'
import { colors } from '../../../../theme/colors'

const PAYPAL_URL_SCHEME = 'agrilink'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PAYMENT_METHOD_IMAGES: Record<string, any> = {
  multicaixa_express: require('../../../../assets/payment-methods/multicaixa_express.png'),
  alipay: require('../../../../assets/payment-methods/alipay.png'),
  wechat_pay: require('../../../../assets/payment-methods/wechat_pay.png'),
  airtel_money: require('../../../../assets/payment-methods/airtel_money.png'),
  mtn_momo: require('../../../../assets/payment-methods/mtn_momo.png'),
  orange_money: require('../../../../assets/payment-methods/orange_money.png'),
  mpesa: require('../../../../assets/payment-methods/mpesa.png'),
  paypal: require('../../../../assets/payment-methods/paypal.png'),
  unitel_money: require('../../../../assets/payment-methods/unitel_money.png'),
}

export default function Payment() {
  const { t } = useTranslation()
  const router = useRouter()
  const { orderId } = useLocalSearchParams<{ orderId: string }>()
  const { token } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payingWithPayPal, setPayingWithPayPal] = useState(false)

  useEffect(() => {
    if (!token || !orderId) return
    let cancelled = false

    Promise.all([fetchOrder(Number(orderId), token), fetchMyPaymentMethods(token)])
      .then(([orderRes, methodsRes]) => {
        if (cancelled) return
        setOrder(orderRes)
        setMethods(methodsRes)
        setSelectedId(orderRes.payment_method?.id ?? null)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('not-found')
      })

    return () => {
      cancelled = true
    }
  }, [orderId, token])

  const selectedMethod = methods.find((m) => m.id === selectedId)
  const isPayPal = selectedMethod?.code === 'paypal'
  const alreadyPaid = order?.payment_status === 'paid'

  async function handleSelect(method: PaymentMethod) {
    setSelectedId(method.id)
    setSaved(false)
    setError(null)
    if (!order || !token) return

    setSaving(true)
    try {
      const updated = await setOrderPaymentMethod(order.id, method.id, token)
      setOrder(updated)
      if (method.code !== 'paypal') setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('payment.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handlePayPalEvent(event: PayPalWebCheckoutEvent) {
    if (event.type === 'success') {
      if (!token) return
      try {
        await capturePayPalOrder(event.orderID, token)
        router.replace('/encomendas')
        return
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('cart.paypalCaptureError'))
      }
    } else if (event.type === 'error') {
      setError(event.errorDescription || t('cart.paypalStartError'))
    }
    setPayingWithPayPal(false)
  }

  async function handlePayWithPayPal() {
    if (!order || !token) return
    setPayingWithPayPal(true)
    setError(null)
    try {
      const [{ client_id, environment }, paypalOrder] = await Promise.all([
        fetchPayPalClientId(),
        createPayPalOrder(order.id, token),
      ])
      startCheckout({
        clientID: client_id,
        environment: environment === 'live' ? PaypalEnvironment.live : PaypalEnvironment.sandbox,
        urlScheme: PAYPAL_URL_SCHEME,
        orderID: paypalOrder.id,
        fundingSource: PayPalWebCheckoutFundingSource.paypal,
        onEvent: handlePayPalEvent,
      })
    } catch (err) {
      setPayingWithPayPal(false)
      setError(err instanceof ApiError ? err.message : t('cart.paypalStartError'))
    }
  }

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  if (status === 'not-found' || !order) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyText}>{t('payment.orderNotFound')}</Text>
        <Link href="/encomendas" asChild>
          <Pressable>
            <Text style={styles.emptyLink}>{t('payment.viewOrders')}</Text>
          </Pressable>
        </Link>
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        {t('payment.subtitle', {
          id: order.id,
          total: order.total_amount.toLocaleString('pt-AO'),
        })}
      </Text>

      {alreadyPaid ? (
        <View style={styles.successBox}>
          <MaterialCommunityIcons name="check-circle" size={18} color={colors.leaf700} />
          <Text style={styles.successText}>{t('payment.alreadyPaid')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            {methods.map((method) => {
              const image = PAYMENT_METHOD_IMAGES[method.code]
              const selected = selectedId === method.id
              return (
                <Pressable
                  key={method.id}
                  onPress={() => handleSelect(method)}
                  style={[styles.card, selected && styles.cardSelected]}
                >
                  {image ? (
                    <Image source={image} style={styles.cardImage} resizeMode="contain" />
                  ) : (
                    <MaterialCommunityIcons
                      name="credit-card-outline"
                      size={28}
                      color={colors.leaf700}
                    />
                  )}
                  <Text style={styles.cardLabel} numberOfLines={2}>
                    {method.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {isPayPal ? (
            <View style={styles.paypalWrap}>
              <Text style={styles.paypalHint}>{t('cart.completePaypalPayment')}</Text>
              <Pressable
                style={[styles.paypalButton, payingWithPayPal && styles.paypalButtonDisabled]}
                onPress={handlePayWithPayPal}
                disabled={payingWithPayPal}
              >
                <Text style={styles.paypalButtonText}>
                  {payingWithPayPal ? t('cart.paypalLoading') : t('cart.payWithPaypal')}
                </Text>
              </Pressable>
            </View>
          ) : (
            saved && (
              <View style={styles.successBox}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.leaf700} />
                <Text style={styles.successText}>{t('payment.methodSaved')}</Text>
              </View>
            )
          )}

          {saving && <Text style={styles.savingText}>{t('payment.saving')}</Text>}

          <Link href="/encomendas" asChild>
            <Pressable style={styles.viewOrdersLink}>
              <Text style={styles.viewOrdersText}>{t('payment.viewOrders')} →</Text>
            </Pressable>
          </Link>
        </>
      )}
    </ScrollView>
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
  emptyScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
    backgroundColor: colors.cream50,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(15,36,17,0.6)',
    textAlign: 'center',
  },
  emptyLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.leaf700,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  grid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
  },
  cardSelected: {
    borderColor: colors.leaf600,
    backgroundColor: colors.leaf50,
  },
  cardImage: {
    height: 32,
    width: '100%',
  },
  cardLabel: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.leaf950,
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: colors.earth50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.earth800,
  },
  successBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf800,
  },
  paypalWrap: {
    marginTop: 16,
  },
  paypalHint: {
    fontSize: 13,
    color: 'rgba(15,36,17,0.7)',
  },
  paypalButton: {
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: '#0070ba',
    paddingVertical: 14,
    alignItems: 'center',
  },
  paypalButtonDisabled: {
    opacity: 0.6,
  },
  paypalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  savingText: {
    marginTop: 10,
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  viewOrdersLink: {
    marginTop: 20,
  },
  viewOrdersText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf700,
  },
})
