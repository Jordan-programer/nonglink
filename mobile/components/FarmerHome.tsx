import { Link, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import {
  fetchMyFarms,
  fetchMyProducts,
  fetchPriceForecast,
  fetchSales,
  type Farm,
  type Product,
  type Sale,
} from '../lib/api'
import { colors } from '../theme/colors'

type CropForecast = {
  cropId: number
  cropName: string
  status: 'ok' | 'insufficient_data' | 'error'
  firstPrice?: number
  lastPrice?: number
  changePct?: number
}

export default function FarmerHome() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [forecasts, setForecasts] = useState<CropForecast[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      let cancelled = false

      async function load() {
        const [farmsRes, productsRes, salesRes] = await Promise.all([
          fetchMyFarms(token!),
          fetchMyProducts(token!),
          fetchSales(token!),
        ])
        if (cancelled) return
        setFarms(farmsRes)
        setProducts(productsRes)
        setSales(salesRes)
        setStatus('ready')

        const regionId = farmsRes[0]?.region_id
        if (!regionId) return

        const uniqueCrops = Array.from(
          new Map(productsRes.map((p) => [p.crop_id, p.crop_name])).entries(),
        ).slice(0, 3)

        const results = await Promise.all(
          uniqueCrops.map(async ([cropId, cropName]): Promise<CropForecast> => {
            try {
              const forecast = await fetchPriceForecast({ crop_id: cropId, region_id: regionId })
              if (forecast.status !== 'ok' || forecast.forecast.length < 2) {
                return { cropId, cropName, status: 'insufficient_data' }
              }
              const first = forecast.forecast[0].predicted_price
              const last = forecast.forecast[forecast.forecast.length - 1].predicted_price
              return {
                cropId,
                cropName,
                status: 'ok',
                firstPrice: first,
                lastPrice: last,
                changePct: first ? ((last - first) / first) * 100 : 0,
              }
            } catch {
              return { cropId, cropName, status: 'error' }
            }
          }),
        )
        if (!cancelled) setForecasts(results)
      }

      load()
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

  const revenue = sales.reduce((sum, s) => sum + s.quantity * s.unit_price, 0)
  const pending = sales.filter((s) => s.status === 'pending').length

  const stats = [
    { icon: 'sprout' as const, label: t('painel.statFarms'), value: String(farms.length) },
    {
      icon: 'package-variant' as const,
      label: t('painel.statActiveProducts'),
      value: String(products.length),
    },
    {
      icon: 'cart-outline' as const,
      label: t('painel.statPendingOrders'),
      value: String(pending),
    },
    {
      icon: 'cash' as const,
      label: t('painel.statRevenue'),
      value: `${revenue.toLocaleString('pt-AO')} Kz`,
    },
  ]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>
        {t('painel.welcomeBack')}
        <Text style={styles.welcomeName}>{user?.name}</Text>.
      </Text>

      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <MaterialCommunityIcons name={s.icon} size={22} color={colors.leaf700} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {farms.length === 0 && (
        <View style={styles.ctaBox}>
          <Text style={styles.ctaText}>{t('painel.createFarmCta')}</Text>
          <Link href="/painel/lavra" asChild>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>{t('painel.createFarmButton')}</Text>
            </Pressable>
          </Link>
        </View>
      )}

      {forecasts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('home.aiForecastTitle')}</Text>
          <View style={styles.forecastList}>
            {forecasts.map((f) => (
              <View key={f.cropId} style={styles.forecastCard}>
                <View style={styles.forecastHeader}>
                  <Text style={styles.forecastCrop}>{f.cropName}</Text>
                  {f.status === 'ok' && f.changePct !== undefined && (
                    <View style={styles.trendBadge}>
                      <MaterialCommunityIcons
                        name={
                          f.changePct > 2
                            ? 'trending-up'
                            : f.changePct < -2
                              ? 'trending-down'
                              : 'trending-neutral'
                        }
                        size={16}
                        color={
                          f.changePct > 2
                            ? colors.leaf700
                            : f.changePct < -2
                              ? '#c1462b'
                              : 'rgba(15,36,17,0.5)'
                        }
                      />
                      <Text
                        style={[
                          styles.trendText,
                          {
                            color:
                              f.changePct > 2
                                ? colors.leaf700
                                : f.changePct < -2
                                  ? '#c1462b'
                                  : 'rgba(15,36,17,0.5)',
                          },
                        ]}
                      >
                        {f.changePct > 0 ? '+' : ''}
                        {f.changePct.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
                {f.status === 'ok' ? (
                  <Text style={styles.forecastText}>
                    {t('home.aiForecastText', {
                      from: Math.round(f.firstPrice ?? 0).toLocaleString('pt-AO'),
                      to: Math.round(f.lastPrice ?? 0).toLocaleString('pt-AO'),
                    })}
                  </Text>
                ) : (
                  <Text style={styles.forecastMuted}>{t('home.aiForecastInsufficientData')}</Text>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>{t('painel.recentOrders')}</Text>
      {sales.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t('painel.noOrdersYet')}</Text>
        </View>
      ) : (
        <View style={styles.saleList}>
          {sales.slice(0, 5).map((sale) => (
            <View key={sale.order_item_id} style={styles.saleRow}>
              <View style={styles.saleInfo}>
                <Text style={styles.saleProduct}>{sale.product_name}</Text>
                <Text style={styles.saleBuyer}>
                  {sale.buyer_name} · {sale.quantity} un.
                </Text>
              </View>
              <Text style={styles.saleTotal}>
                {(sale.quantity * sale.unit_price).toLocaleString('pt-AO')} Kz
              </Text>
            </View>
          ))}
        </View>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcome: {
    fontSize: 14,
    color: 'rgba(15,36,17,0.7)',
  },
  welcomeName: {
    fontWeight: '600',
    color: colors.leaf900,
  },
  statsGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
  },
  statValue: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
    color: colors.leaf950,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  ctaBox: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.earth200,
    backgroundColor: colors.earth50,
    padding: 18,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.earth800,
  },
  ctaButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.earth600,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '700',
    color: colors.leaf950,
  },
  forecastList: {
    gap: 10,
  },
  forecastCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forecastCrop: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.leaf950,
    textTransform: 'capitalize',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  forecastText: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(15,36,17,0.65)',
  },
  forecastMuted: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(15,36,17,0.45)',
  },
  emptyBox: {
    borderRadius: 16,
    backgroundColor: colors.leaf50,
    padding: 28,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  saleList: {
    gap: 8,
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  saleInfo: {
    flexShrink: 1,
  },
  saleProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.leaf950,
  },
  saleBuyer: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  saleTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.leaf900,
  },
})
