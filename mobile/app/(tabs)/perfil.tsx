import { Link, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import {
  ApiError,
  fetchAdminStats,
  fetchMyDeliveries,
  fetchMyFarms,
  fetchMyOrders,
  SERVER_BASE,
  updateProfile,
  uploadProfilePhoto,
} from '../../lib/api'
import { colors } from '../../theme/colors'

export default function Perfil() {
  const { t } = useTranslation()
  const { user, token, logout, resendVerification, updateUser } = useAuth()
  const insets = useSafeAreaInsets()
  const [summary, setSummary] = useState<{ primary: string; secondary: string } | null>(null)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resendError, setResendError] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [bio, setBio] = useState(user?.bio ?? '')
  const [savingBio, setSavingBio] = useState(false)
  const [bioError, setBioError] = useState<string | null>(null)

  async function handleResendVerification() {
    setResendStatus('sending')
    setResendError(null)
    try {
      await resendVerification()
      setResendStatus('sent')
    } catch (err) {
      setResendStatus('error')
      setResendError(err instanceof ApiError ? err.message : t('perfil.resendVerificationError'))
    }
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setPhotoError(t('perfil.photoPermissionError'))
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    })

    if (result.canceled || !token) return

    setUploadingPhoto(true)
    setPhotoError(null)
    try {
      const updated = await uploadProfilePhoto(result.assets[0].uri, token)
      updateUser(updated)
    } catch (err) {
      setPhotoError(err instanceof ApiError ? err.message : t('perfil.photoError'))
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSaveBio() {
    if (!token) return
    setSavingBio(true)
    setBioError(null)
    try {
      const updated = await updateProfile({ bio }, token)
      updateUser(updated)
    } catch (err) {
      setBioError(err instanceof ApiError ? err.message : t('perfil.bioError'))
    } finally {
      setSavingBio(false)
    }
  }

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
    <View style={[styles.screen, { paddingTop: insets.top + 20 }]}>
      <View style={styles.card}>
        <Pressable onPress={handlePickPhoto} disabled={uploadingPhoto} style={styles.avatar}>
          {user?.profile_photo_url ? (
            <Image
              source={{ uri: `${SERVER_BASE}${user.profile_photo_url}` }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          )}
          <View style={styles.avatarEditBadge}>
            <MaterialCommunityIcons name="camera" size={12} color="#fff" />
          </View>
        </Pressable>
        {uploadingPhoto && (
          <Text style={styles.photoStatusText}>{t('perfil.uploadingPhoto')}</Text>
        )}
        {photoError && <Text style={styles.photoErrorText}>{photoError}</Text>}
        <Text style={styles.name}>{user?.name}</Text>
        {(user?.email || user?.phone) && (
          <Text style={styles.email}>{user?.email || user?.phone}</Text>
        )}
        {user?.role && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{roleLabels[user.role] ?? user.role}</Text>
          </View>
        )}

        <View style={styles.bioWrap}>
          <Text style={styles.sectionLabel}>{t('perfil.bio')}</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder={t('perfil.bioPlaceholder')}
            placeholderTextColor="rgba(15,36,17,0.4)"
            multiline
            maxLength={300}
            style={styles.bioInput}
          />
          {bioError && <Text style={styles.photoErrorText}>{bioError}</Text>}
          {bio !== (user?.bio ?? '') && (
            <Pressable
              style={[styles.bioSave, savingBio && styles.submitDisabled]}
              onPress={handleSaveBio}
              disabled={savingBio}
            >
              <Text style={styles.bioSaveText}>
                {savingBio ? t('perfil.savingBio') : t('perfil.saveBio')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {user?.email && !user.email_verified && (
        <View style={styles.verifyBanner}>
          <MaterialCommunityIcons name="email-alert-outline" size={18} color={colors.earth700} />
          <View style={styles.verifyBannerText}>
            <Text style={styles.verifyBannerTitle}>{t('perfil.emailNotVerified')}</Text>
            {resendStatus === 'sent' ? (
              <Text style={styles.verifyBannerSubtitle}>{t('perfil.resendVerificationSent')}</Text>
            ) : (
              <Pressable onPress={handleResendVerification} disabled={resendStatus === 'sending'}>
                <Text style={styles.verifyBannerLink}>
                  {resendStatus === 'sending'
                    ? t('perfil.resendVerificationSending')
                    : t('perfil.resendVerificationButton')}
                </Text>
              </Pressable>
            )}
            {resendError && <Text style={styles.verifyBannerSubtitle}>{resendError}</Text>}
          </View>
        </View>
      )}

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

      <Link href="/politica-privacidade" asChild>
        <Pressable style={styles.linkRow}>
          <MaterialCommunityIcons name="shield-lock-outline" size={20} color={colors.leaf700} />
          <Text style={styles.linkRowText}>{t('perfil.privacyPolicy')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.leaf700} />
        </Pressable>
      </Link>

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
    overflow: 'hidden',
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: colors.leaf950,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  photoStatusText: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(15,36,17,0.5)',
  },
  photoErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.earth700,
  },
  bioWrap: {
    marginTop: 18,
    width: '100%',
  },
  bioInput: {
    marginTop: 8,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: colors.cream50,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.leaf950,
    textAlignVertical: 'top',
  },
  bioSave: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bioSaveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  submitDisabled: {
    opacity: 0.6,
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
  verifyBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.earth200,
    backgroundColor: colors.earth50,
    padding: 14,
  },
  verifyBannerText: {
    flex: 1,
  },
  verifyBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.earth700,
  },
  verifyBannerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.earth700,
  },
  verifyBannerLink: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: colors.earth700,
    textDecorationLine: 'underline',
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
  linkRow: {
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
  linkRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.leaf950,
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
