import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  ActivityIndicator,
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
  fetchMyExportBatches,
  fetchMyProducts,
  joinExportBatch,
  type ExportBatch,
  type ExportBatchStatus,
  type Product,
} from '../../../lib/api'
import { colors } from '../../../theme/colors'

const STATUS_COLORS: Record<ExportBatchStatus, string> = {
  collecting: colors.leaf700,
  certified: colors.earth700,
  claimed: colors.leaf950,
}

export default function Exportacao() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<ExportBatch[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const statusLabels: Record<ExportBatchStatus, string> = {
    collecting: t('export.statusCollecting'),
    certified: t('export.statusCertified'),
    claimed: t('export.statusClaimed'),
  }

  function load() {
    if (!token) return
    Promise.all([fetchMyProducts(token), fetchMyExportBatches(token)]).then(
      ([productsData, batchesData]) => {
        setProducts(productsData)
        setBatches(batchesData)
        setStatus('ready')
      },
    )
  }

  useFocusEffect(useCallback(load, [token]))

  async function handleJoin() {
    if (!token || !selectedProductId || !quantity) return
    setError(null)
    setSubmitting(true)
    try {
      await joinExportBatch({ product_id: selectedProductId, quantity: Number(quantity) }, token)
      setSelectedProductId(null)
      setQuantity('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('export.joinError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{t('export.subtitle')}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('export.joinTitle')}</Text>

        <Text style={styles.label}>{t('export.product')}</Text>
        <View style={styles.chipRow}>
          {products.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setSelectedProductId(p.id)}
              style={[styles.chip, selectedProductId === p.id && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedProductId === p.id && styles.chipTextActive,
                ]}
              >
                {p.name} ({p.quantity_available} {p.unit})
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t('export.quantity')}</Text>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="rgba(15,36,17,0.4)"
          style={styles.input}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submit, submitting && styles.submitDisabled]}
          onPress={handleJoin}
          disabled={submitting || !selectedProductId || !quantity}
        >
          <Text style={styles.submitText}>
            {submitting ? t('export.joining') : t('export.joinButton')}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>{t('export.myBatches')}</Text>
      {batches.length === 0 ? (
        <Text style={styles.emptyText}>{t('export.noBatches')}</Text>
      ) : (
        batches.map((b) => (
          <View key={b.id} style={styles.batchCard}>
            <View style={styles.batchInfo}>
              <Text style={styles.batchTitle}>
                {b.crop_name} — {b.origin_country_name} → {b.destination_country_name}
              </Text>
              <Text style={styles.batchSubtitle}>
                {t('export.volumeProgress', {
                  current: b.total_volume,
                  target: b.min_volume_target,
                })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[b.status] }]}>
              <Text style={styles.statusBadgeText}>{statusLabels[b.status]}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream50,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream50,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  card: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.leaf100,
    padding: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.leaf950,
  },
  label: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.8)',
  },
  chipRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipActive: {
    borderColor: colors.leaf600,
    backgroundColor: colors.leaf700,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.7)',
  },
  chipTextActive: {
    color: '#fff',
  },
  input: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.leaf950,
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.earth700,
  },
  submit: {
    marginTop: 18,
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingVertical: 13,
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
  sectionLabel: {
    marginTop: 24,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.8)',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: 'rgba(15,36,17,0.5)',
  },
  batchCard: {
    marginTop: 10,
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
  batchInfo: {
    flex: 1,
  },
  batchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.leaf950,
  },
  batchSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
})
