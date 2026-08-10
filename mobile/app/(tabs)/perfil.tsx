import { Link, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { fetchAdminStats, fetchMyDeliveries, fetchMyFarms, fetchMyOrders } from '../../lib/api'
import { colors } from '../../theme/colors'

export default function Perfil() {
  const { t } = useTranslation()
  const { user, token, logout } = useAuth()
  const [summary, setSummary] = useState<{ primary: string; secondary: string } | null>(null)

  const roleLabels: Record<string, string> = {
    farmer: t('perfil.roleFarmer'),
    buyer: t('perfil.roleBuyer'),
    distributor: t('perfil.roleDistributor'),
    transporter: t('perfil.roleTransporter'),
    admin: t('perfil.roleAdmin'),
    superadmin: t('perfil.roleSuperadmin'),
  }

  useFocusEffect(
    useCallback(() => {
      if (!token || !user) return
      let cancelled = false

      if (user.role === 'farmer') {
        fetchMyFarms(token).then((farms) => {
          if (cancelled) return
          setSummary({
            primary: t('perfil.summaryFarms', { count: farms.length }),
            secondary: t('perfil.summaryFarmsGoTo'),
          })
        })
      } else if (user.role === 'buyer' || user.role === 'distributor') {
        fetchMyOrders(token).then((orders) => {
          if (cancelled) return
          setSummary({
            primary: t('perfil.summaryOrders', { count: orders.length }),
            secondary: t('perfil.summaryOrdersGoTo'),
          })
        })
      } else if (user.role === 'transporter') {
        fetchMyDeliveries(token).then((deliveries) => {
          if (cancelled) return
          const active = deliveries.filter((d) => d.status !== 'delivered' && d.status !== 'cancelled')
          setSummary({
            primary: t('perfil.summaryDeliveries', { count: active.length }),
            secondary: t('perfil.summaryDeliveriesGoTo'),
          })
        })
      } else if (user.role === 'admin' || user.role === 'superadmin') {
        fetchAdminStats(token).then((stats) => {
          if (cancelled) return
          setSummary({
            primary: t('perfil.summaryAdmin', {
              users: stats.total_users,
              pending: stats.pending_orders,
            }),
            secondary: t('perfil.summaryAdminGoTo'),
          })
        })
      }

      return () => {
        cancelled = true
      }
    }, [token, user, t]),
  )

  function summaryDestination() {
    switch (user?.role) {
      case 'farmer':
        return { href: '/painel' as const, icon: 'sprout' as const }
      case 'buyer':
      case 'distributor':
        return { href: '/encomendas' as const, icon: 'clipboard-list-outline' as const }
      case 'transporter':
        return { href: '/entregas' as const, icon: 'truck-delivery-outline' as const }
      default:
        return { href: '/admin' as const, icon: 'shield-account-outline' as const }
    }
  }

  const { href: summaryHref, icon: summaryIcon } = summaryDestination()

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        {(user?.email || user?.phone) && (
          <Text style={styles.email}>{user?.email || user?.phone}</Text>
        )}
        {user?.role && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{roleLabels[user.role] ?? user.role}</Text>
          </View>
        )}
      </View>

      {summary && (
        <Link href={summaryHref} asChild>
          <Pressable style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons name={summaryIcon} size={20} color={colors.leaf700} />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryPrimary}>{summary.primary}</Text>
              <Text style={styles.summarySecondary}>{summary.secondary}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.leaf700} />
          </Pressable>
        </Link>
      )}

      <View style={styles.languageSection}>
        <Text style={styles.sectionLabel}>{t('perfil.language')}</Text>
        <LanguageSwitcher />
      </View>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>{t('perfil.logout')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream50,
    padding: 20,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.leaf100,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: colors.leaf700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: colors.leaf950,
  },
  email: {
    marginTop: 2,
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  badge: {
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.leaf700,
  },
  summaryCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 16,
  },
  summaryIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: colors.leaf50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.leaf950,
  },
  summarySecondary: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(15,36,17,0.55)',
  },
  languageSection: {
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.leaf100,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.8)',
    marginBottom: 12,
    textAlign: 'center',
  },
  logout: {
    marginTop: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.earth300,
    paddingVertical: 13,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.earth700,
  },
})
