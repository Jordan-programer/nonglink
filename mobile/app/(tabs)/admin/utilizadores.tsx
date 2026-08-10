import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import {
  ApiError,
  deleteUser,
  fetchAllUsers,
  updateUserRole,
  updateUserStatus,
  type User,
  type UserRole,
} from '../../../lib/api'
import { colors } from '../../../theme/colors'

const ROLES: UserRole[] = [
  'farmer',
  'buyer',
  'distributor',
  'transporter',
  'admin',
  'superadmin',
]

export default function Utilizadores() {
  const { t } = useTranslation()
  const { user: me, token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [error, setError] = useState<string | null>(null)

  const isSuperadmin = me?.role === 'superadmin'

  const roleLabels: Record<UserRole, string> = {
    farmer: t('perfil.roleFarmer'),
    buyer: t('perfil.roleBuyer'),
    distributor: t('perfil.roleDistributor'),
    transporter: t('perfil.roleTransporter'),
    admin: t('perfil.roleAdmin'),
    superadmin: t('perfil.roleSuperadmin'),
  }

  const load = useCallback(() => {
    if (!token) return
    fetchAllUsers(token)
      .then(setUsers)
      .finally(() => setStatus('ready'))
  }, [token])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  async function handleToggleStatus(target: User) {
    if (!token) return
    setError(null)
    try {
      await updateUserStatus(target.id, !target.is_active, token)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('admin.actionError'))
    }
  }

  async function handleChangeRole(target: User, role: UserRole) {
    if (!token || role === target.role) return
    setError(null)
    try {
      await updateUserRole(target.id, role, token)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('admin.actionError'))
    }
  }

  function handleDelete(target: User) {
    if (!token) return
    Alert.alert(t('admin.deleteConfirmTitle'), t('admin.deleteConfirmMessage'), [
      { text: t('myProducts.cancel'), style: 'cancel' },
      {
        text: t('myProducts.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(target.id, token)
            load()
          } catch (err) {
            setError(err instanceof ApiError ? err.message : t('admin.actionError'))
          }
        },
      },
    ])
  }

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
      data={users}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={
        error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const isSelf = item.id === me?.id
        return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={styles.identity}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.contact}>{item.email || item.phone}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: item.is_active ? colors.leaf100 : '#fdf1ed' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: item.is_active ? colors.leaf700 : '#c1462b' },
                  ]}
                >
                  {item.is_active ? t('admin.active') : t('admin.suspended')}
                </Text>
              </View>
            </View>

            {isSuperadmin ? (
              <View style={styles.roleChipRow}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => handleChangeRole(item, r)}
                    style={[styles.roleChip, item.role === r && styles.roleChipActive]}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        item.role === r && styles.roleChipTextActive,
                      ]}
                    >
                      {roleLabels[r]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleLabels[item.role]}</Text>
              </View>
            )}

            {!isSelf && (
              <View style={styles.actionsRow}>
                <Pressable style={styles.actionButton} onPress={() => handleToggleStatus(item)}>
                  <MaterialCommunityIcons
                    name={item.is_active ? 'account-cancel-outline' : 'account-check-outline'}
                    size={16}
                    color={colors.leaf700}
                  />
                  <Text style={styles.actionText}>
                    {item.is_active ? t('admin.suspend') : t('admin.activate')}
                  </Text>
                </Pressable>

                {isSuperadmin && (
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#c1462b" />
                    <Text style={[styles.actionText, styles.deleteText]}>
                      {t('myProducts.remove')}
                    </Text>
                  </Pressable>
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
  },
  errorBox: {
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: colors.earth50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.earth800,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: colors.leaf700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  identity: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.leaf950,
  },
  contact: {
    marginTop: 1,
    fontSize: 12,
    color: 'rgba(15,36,17,0.55)',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.leaf50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.leaf700,
  },
  roleChipRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.leaf200,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleChipActive: {
    borderColor: colors.leaf600,
    backgroundColor: colors.leaf700,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.7)',
  },
  roleChipTextActive: {
    color: '#fff',
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: colors.leaf50,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButton: {
    backgroundColor: '#fdf1ed',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.leaf700,
  },
  deleteText: {
    color: '#c1462b',
  },
})
