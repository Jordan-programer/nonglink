import { Link } from 'expo-router'
import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import {
  fetchMyAlerts,
  fetchMyFarms,
  fetchMyProducts,
  fetchSales,
  type Farm,
  type Product,
  type Sale,
  type SensorAlert,
} from '../../../lib/api'
import { colors } from '../../../theme/colors'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [alerts, setAlerts] = useState<SensorAlert[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const shortcuts = [
    { href: '/painel/produtos' as const, icon: 'package-variant', label: t('painel.shortcutProducts') },
    { href: '/painel/encomendas' as const, icon: 'cart-outline', label: t('painel.shortcutOrders') },
    { href: '/painel/monitorizacao' as const, icon: 'water-percent', label: t('painel.shortcutMonitoring') },
    { href: '/painel/lavra' as const, icon: 'sprout', label: t('painel.shortcutFarm') },
    { href: '/painel/solo' as const, icon: 'satellite-variant', label: t('painel.shortcutSoil') },
    { href: '/painel/exportacao' as const, icon: 'ferry', label: t('painel.shortcutExport') },
  ] as const

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      let cancelled = false

      Promise.all([
        fetchMyFarms(token),
        fetchMyProducts(token),
        fetchSales(token),
        fetchMyAlerts(token),
      ]).then(([farmsRes, productsRes, salesRes, alertsRes]) => {
        if (cancelled) return
        setFarms(farmsRes)
        setProducts(productsRes)
        setSales(salesRes)
        setAlerts(alertsRes)
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

  const revenue = sales.reduce((sum, s) => sum + s.quantity * s.unit_price, 0)
  const pending = sales.filter((s) => s.status === 'pending').length

  const stats = [
    { icon: 'sprout' as const, label: t('painel.statFarms'), value: String(farms.length) },
    { icon: 'package-variant' as const, label: t('painel.statActiveProducts'), value: String(products.length) },
    { icon: 'cart-outline' as const, label: t('painel.statPendingOrders'), value: String(pending) },
    { icon: 'cash' as const, label: t('painel.statRevenue'), value: `${revenue.toLocaleString('pt-AO')} Kz` },
  ]

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>
        {t('painel.welcomeBack')}<Text style={styles.welcomeName}>{user?.name}</Text>.
      </Text>

      {unacknowledgedAlerts.length > 0 && (
        <Link href="/painel/monitorizacao" asChild>
          <Pressable style={styles.alertBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#c1462b" />
            <Text style={styles.alertBannerText}>
              {t('painel.alertBanner', { count: unacknowledgedAlerts.length })}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#c1462b" />
          </Pressable>
        </Link>
      )}

      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <MaterialCommunityIcons name={s.icon} size={22} color={colors.leaf700} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.shortcutRow}>
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} asChild>
            <Pressable style={styles.shortcut}>
              <MaterialCommunityIcons name={s.icon} size={20} color={colors.leaf800} />
              <Text style={styles.shortcutLabel}>{s.label}</Text>
            </Pressable>
          </Link>
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('painel.recentOrders')}</Text>
        <Link href="/painel/encomendas">
          <Text style={styles.sectionLink}>{t('painel.viewAll')}</Text>
        </Link>
      </View>

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
  alertBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0c9bd',
    backgroundColor: '#fdf1ed',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  alertBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#8a3018',
  },
  shortcutRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shortcut: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 14,
    backgroundColor: colors.leaf50,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.leaf800,
    textAlign: 'center',
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
  sectionHeader: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.leaf950,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf700,
  },
  emptyBox: {
    marginTop: 14,
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
    marginTop: 14,
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
