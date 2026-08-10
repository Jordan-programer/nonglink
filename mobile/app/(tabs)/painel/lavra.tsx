import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import {
  ApiError,
  createFarm,
  fetchMyFarms,
  fetchRegions,
  updateFarm,
  type Farm,
  type Region,
} from '../../../lib/api'
import { colors } from '../../../theme/colors'

export default function MyFarm() {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const [farm, setFarm] = useState<Farm | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [sizeHectares, setSizeHectares] = useState('')
  const [regions, setRegions] = useState<Region[]>([])
  const [regionId, setRegionId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRegions()
      .then(setRegions)
      .catch(() => setRegions([]))
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      let cancelled = false

      fetchMyFarms(token).then((farms) => {
        if (cancelled) return
        const existing = farms[0] ?? null
        setFarm(existing)
        if (existing) {
          setName(existing.name)
          setLocation(existing.location ?? '')
          setSizeHectares(existing.size_hectares?.toString() ?? '')
          setRegionId(existing.region_id ?? null)
        } else if (user?.region_id) {
          setRegionId(user.region_id)
        }
        setStatus('ready')
      })

      return () => {
        cancelled = true
      }
    }, [token, user]),
  )

  async function handleSubmit() {
    if (!token) return

    setError(null)
    setSaved(false)
    setSubmitting(true)

    const payload = {
      name,
      location: location || undefined,
      size_hectares: sizeHectares ? Number(sizeHectares) : undefined,
      region_id: regionId ?? undefined,
    }

    try {
      const result = farm
        ? await updateFarm(farm.id, payload, token)
        : await createFarm(payload, token)
      setFarm(result)
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('myFarm.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{farm ? t('myFarm.titleExisting') : t('myFarm.titleNew')}</Text>
          <Text style={styles.subtitle}>
            {farm ? t('myFarm.subtitleExisting') : t('myFarm.subtitleNew')}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('myFarm.name')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('myFarm.namePlaceholder')}
              placeholderTextColor="rgba(15,36,17,0.4)"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('myFarm.location')}</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={t('myFarm.locationPlaceholder')}
              placeholderTextColor="rgba(15,36,17,0.4)"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('myFarm.region')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.regionRow}
            >
              {regions.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => setRegionId(r.id)}
                  style={[styles.regionChip, regionId === r.id && styles.regionChipActive]}
                >
                  <Text
                    style={[
                      styles.regionChipText,
                      regionId === r.id && styles.regionChipTextActive,
                    ]}
                  >
                    {r.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('myFarm.sizeHectares')}</Text>
            <TextInput
              value={sizeHectares}
              onChangeText={setSizeHectares}
              placeholder={t('myFarm.sizeHectaresPlaceholder')}
              placeholderTextColor="rgba(15,36,17,0.4)"
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {saved && (
            <View style={styles.savedBox}>
              <Text style={styles.savedText}>{t('myFarm.savedSuccess')}</Text>
            </View>
          )}

          <Pressable
            style={[styles.submit, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? t('myFarm.saving') : farm ? t('myFarm.saveChanges') : t('myFarm.createFarm')}
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
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.leaf950,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  field: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.8)',
  },
  input: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.leaf950,
  },
  regionRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 8,
  },
  regionChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  regionChipActive: {
    borderColor: colors.leaf600,
    backgroundColor: colors.leaf700,
  },
  regionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.7)',
  },
  regionChipTextActive: {
    color: '#fff',
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
  savedBox: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  savedText: {
    fontSize: 13,
    color: colors.leaf800,
  },
  submit: {
    marginTop: 20,
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
