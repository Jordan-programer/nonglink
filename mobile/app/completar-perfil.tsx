import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import {
  ApiError,
  fetchCountries,
  fetchRegions,
  updateProfile,
  type Country,
  type Region,
  type UserRole,
} from '../lib/api'
import { colors } from '../theme/colors'

const CALLING_CODES: Record<string, string> = {
  AO: '+244',
  CN: '+86',
  CG: '+242',
  CD: '+243',
}

export default function CompletarPerfil() {
  const { t } = useTranslation()
  const { token, updateUser } = useAuth()
  const insets = useSafeAreaInsets()

  const roles: { value: UserRole; label: string }[] = [
    { value: 'farmer', label: t('register.roleFarmer') },
    { value: 'buyer', label: t('register.roleBuyer') },
    { value: 'distributor', label: t('register.roleDistributor') },
    { value: 'transporter', label: t('register.roleTransporter') },
  ]

  const [role, setRole] = useState<UserRole>('farmer')
  const [countries, setCountries] = useState<Country[]>([])
  const [countryId, setCountryId] = useState<number | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [regionId, setRegionId] = useState<number | null>(null)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCountries().then((data) => {
      setCountries(data)
      const angola = data.find((c) => c.code === 'AO')
      setCountryId((angola ?? data[0])?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!countryId) return
    setRegionId(null)
    fetchRegions(countryId)
      .then(setRegions)
      .catch(() => setRegions([]))
  }, [countryId])

  const selectedCountry = countries.find((c) => c.id === countryId)
  const callingCode = selectedCountry ? CALLING_CODES[selectedCountry.code] ?? '' : ''

  async function handleSubmit() {
    if (!token) return
    if (!regionId) {
      setError(t('register.selectRegionError'))
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const updated = await updateProfile(
        {
          role,
          region_id: regionId,
          phone: phone ? `${callingCode} ${phone}` : undefined,
        },
        token,
      )
      updateUser(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('completeProfile.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{t('completeProfile.title')}</Text>
          <Text style={styles.subtitle}>{t('completeProfile.subtitle')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('completeProfile.roleLabel')}</Text>
            <View style={styles.roleRow}>
              {roles.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => setRole(r.value)}
                  style={[styles.roleChip, role === r.value && styles.roleChipActive]}
                >
                  <Text
                    style={[styles.roleChipText, role === r.value && styles.roleChipTextActive]}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('register.country')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.regionRow}
            >
              {countries.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCountryId(c.id)}
                  style={[styles.regionChip, countryId === c.id && styles.roleChipActive]}
                >
                  <Text
                    style={[styles.roleChipText, countryId === c.id && styles.roleChipTextActive]}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('register.region')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.regionRow}
            >
              {regions.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => setRegionId(r.id)}
                  style={[styles.regionChip, regionId === r.id && styles.roleChipActive]}
                >
                  <Text
                    style={[styles.roleChipText, regionId === r.id && styles.roleChipTextActive]}
                  >
                    {r.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('completeProfile.phoneOptional')}</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.callingCode}>{callingCode || '+...'}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={t('register.phonePlaceholder')}
                placeholderTextColor="rgba(15,36,17,0.4)"
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.submit, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? t('completeProfile.submitting') : t('completeProfile.submit')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.leaf50,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 28,
    borderWidth: 1,
    borderColor: colors.leaf100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.leaf950,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  field: {
    marginTop: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.8)',
  },
  roleRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    paddingVertical: 10,
    alignItems: 'center',
  },
  regionChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: colors.leaf600,
    backgroundColor: colors.leaf700,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.7)',
  },
  roleChipTextActive: {
    color: '#fff',
  },
  phoneRow: {
    marginTop: 6,
    flexDirection: 'row',
  },
  callingCode: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.leaf200,
    backgroundColor: colors.leaf50,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.7)',
  },
  phoneInput: {
    flex: 1,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.leaf950,
  },
  errorBox: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: colors.earth50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.earth800,
  },
  submit: {
    marginTop: 24,
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
})
