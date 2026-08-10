import { Link, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import { fetchAdminStats, type AdminStats } from '../../../lib/api'
import { colors } from '../../../theme/colors'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      let cancelled = false

      fetchAdminStats(token).then((data) => {
        if (cancelled) return
        setStats(data)
        setStatus('ready')
      })

      return () => {
        cancelled = true
      }
    }, [token]),
  )

  if (status === 'loading' || !stats) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  const cards = [
    { icon: 'account-multiple' as const, label: t('admin.statUsers'), value: String(stats.total_users) },
    { icon: 'sprout' as const, label: t('admin.statFarms'), value: String(stats.total_farms) },
    { icon: 'package-variant' as const, label: t('admin.statProducts'), value: String(stats.total_products) },
    { icon: 'cart-outline' as const, label: t('admin.statOrders'), value: String(stats.total_orders) },
    { icon: 'clock-alert-outline' as const, label: t('admin.statPending'), value: String(stats.pending_orders) },
    {
      icon: 'cash' as const,
      label: t('admin.statRevenue'),
      value: `${stats.total_revenue.toLocaleString('pt-AO')} Kz`,
    },
  ]

  const roleRows: { role: keyof AdminStats['users_by_role']; label: string }[] = [
    { role: 'farmer', label: t('perfil.roleFarmer') },
    { role: 'buyer', label: t('perfil.roleBuyer') },
    { role: 'distributor', label: t('perfil.roleDistributor') },
    { role: 'admin', label: t('perfil.roleAdmin') },
    { role: 'superadmin', label: t('perfil.roleSuperadmin') },
  ]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.statsGrid}>
        {cards.map((c) => (
          <View key={c.label} style={styles.statCard}>
            <MaterialCommunityIcons name={c.icon} size={22} color={colors.leaf700} />
            <Text style={styles.statValue}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      <Link href="/admin/utilizadores" asChild>
        <Pressable style={styles.usersButton}>
          <MaterialCommunityIcons name="account-group-outline" size={20} color={colors.leaf800} />
          <Text style={styles.usersButtonText}>{t('admin.manageUsers')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.leaf800} />
        </Pressable>
      </Link>

      <Text style={styles.sectionTitle}>{t('admin.usersByRole')}</Text>
      <View style={styles.roleList}>
        {roleRows.map((r) => (
          <View key={r.role} style={styles.roleRow}>
            <Text style={styles.roleLabel}>{r.label}</Text>
            <Text style={styles.roleValue}>{stats.users_by_role[r.role]}</Text>
          </View>
        ))}
      </View>
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
  statsGrid: {
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
  usersButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.leaf50,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  usersButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.leaf800,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '700',
    color: colors.leaf950,
  },
  roleList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.leaf100,
  },
  roleLabel: {
    fontSize: 13,
    color: 'rgba(15,36,17,0.75)',
  },
  roleValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.leaf950,
  },
})
