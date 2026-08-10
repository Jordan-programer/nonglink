import { Link } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import {
  ApiError,
  createProduct,
  deleteProduct,
  fetchCrops,
  fetchMyFarms,
  fetchMyProducts,
  SERVER_BASE,
  suggestPrice,
  updateProduct,
  uploadProductImage,
  type Crop,
  type Farm,
  type PriceSuggestion,
  type Product,
  type ProductCertification,
  type ProductQuality,
} from '../../../lib/api'
import { colors } from '../../../theme/colors'

type FormState = {
  name: string
  description: string
  image_url: string
  crop_id: string
  unit: string
  price_per_unit: string
  quantity_available: string
  quality: ProductQuality | ''
  certification: ProductCertification
}

const emptyForm: FormState = {
  name: '',
  description: '',
  image_url: '',
  crop_id: '',
  unit: 'kg',
  price_per_unit: '',
  quantity_available: '',
  quality: '',
  certification: 'none',
}

export default function MyProducts() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [appliedSuggestionId, setAppliedSuggestionId] = useState<number | null>(null)

  const qualityOptions: { value: ProductQuality | ''; label: string }[] = [
    { value: '', label: t('myProducts.qualityNotDeclared') },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
  ]

  const certificationOptions: { value: ProductCertification; label: string }[] = [
    { value: 'none', label: t('myProducts.certificationNone') },
    { value: 'organic', label: t('myProducts.certificationOrganic') },
    { value: 'in_transition', label: t('myProducts.certificationInTransition') },
  ]

  const confidenceLabels: Record<string, string> = {
    alta: t('myProducts.confidenceHigh'),
    media: t('myProducts.confidenceMedium'),
    baixa: t('myProducts.confidenceLow'),
  }

  const loadAll = useCallback(() => {
    if (!token) return Promise.resolve()
    return Promise.all([fetchMyFarms(token), fetchMyProducts(token)]).then(
      ([farmsRes, productsRes]) => {
        setFarms(farmsRes)
        setProducts(productsRes)
        setStatus('ready')
      },
    )
  }, [token])

  useFocusEffect(
    useCallback(() => {
      loadAll()
    }, [loadAll]),
  )

  useEffect(() => {
    fetchCrops()
      .then(setCrops)
      .catch(() => setCrops([]))
  }, [])

  function startCreate() {
    setForm(emptyForm)
    setError(null)
    setSuggestion(null)
    setSuggestionError(null)
    setAppliedSuggestionId(null)
    setEditingId('new')
  }

  function startEdit(product: Product) {
    setForm({
      name: product.name,
      description: product.description ?? '',
      image_url: product.image_url ?? '',
      crop_id: String(product.crop_id),
      unit: product.unit,
      price_per_unit: String(product.price_per_unit),
      quantity_available: String(product.quantity_available),
      quality: product.quality ?? '',
      certification: product.certification,
    })
    setError(null)
    setSuggestion(null)
    setSuggestionError(null)
    setAppliedSuggestionId(null)
    setEditingId(product.id)
  }

  function cancelForm() {
    setEditingId(null)
    setError(null)
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError(t('myProducts.photoPermissionError'))
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    })

    if (result.canceled || !token) return

    setUploadingImage(true)
    setError(null)
    try {
      const imageUrl = await uploadProductImage(result.assets[0].uri, token)
      setForm((f) => ({ ...f, image_url: imageUrl }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('myProducts.photoUploadError'))
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSuggestPrice() {
    if (!form.crop_id || farms.length === 0) return
    const farm = farms[0]
    if (!farm.region_id) {
      setSuggestionError(t('myProducts.noRegionError'))
      return
    }

    setSuggesting(true)
    setSuggestionError(null)
    setSuggestion(null)

    try {
      const result = await suggestPrice(
        {
          crop_id: Number(form.crop_id),
          region_id: farm.region_id,
          quality: form.quality || undefined,
          certification: form.certification,
          farm_id: farm.id,
        },
        token ?? undefined,
      )
      if (result.status !== 'ok') {
        setSuggestionError(t('myProducts.suggestInsufficientData'))
      } else {
        setSuggestion(result)
      }
    } catch (err) {
      setSuggestionError(err instanceof ApiError ? err.message : t('myProducts.suggestError'))
    } finally {
      setSuggesting(false)
    }
  }

  function applySuggestion() {
    if (!suggestion || suggestion.suggested_price == null) return
    setForm({ ...form, price_per_unit: String(suggestion.suggested_price) })
    setAppliedSuggestionId(suggestion.suggestion_id)
  }

  async function handleSubmit() {
    if (!token) return

    setSubmitting(true)
    setError(null)

    const payload = {
      name: form.name,
      description: form.description || undefined,
      image_url: form.image_url || undefined,
      crop_id: Number(form.crop_id),
      unit: form.unit || 'kg',
      price_per_unit: Number(form.price_per_unit),
      quantity_available: form.quantity_available ? Number(form.quantity_available) : 0,
      quality: form.quality || undefined,
      certification: form.certification,
      price_suggestion_id: appliedSuggestionId ?? undefined,
    }

    try {
      if (editingId === 'new') {
        await createProduct({ ...payload, farm_id: farms[0].id }, token)
      } else if (editingId !== null) {
        await updateProduct(editingId, payload, token)
      }
      setEditingId(null)
      await loadAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('myProducts.error'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleDelete(id: number) {
    if (!token) return
    Alert.alert(t('myProducts.deleteConfirmTitle'), t('myProducts.deleteConfirmMessage'), [
      { text: t('myProducts.cancel'), style: 'cancel' },
      {
        text: t('myProducts.remove'),
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(id, token)
          await loadAll()
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

  if (farms.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>{t('myProducts.noFarmTitle')}</Text>
          <Text style={styles.ctaSubtitle}>{t('myProducts.noFarmSubtitle')}</Text>
          <Link href="/painel/lavra" asChild>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>{t('myProducts.createFarm')}</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {editingId === null && (
          <Pressable style={styles.newButton} onPress={startCreate}>
            <Text style={styles.newButtonText}>+ {t('myProducts.newProduct')}</Text>
          </Pressable>
        )}

        {editingId !== null && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingId === 'new' ? t('myProducts.newProduct') : t('myProducts.editProduct')}
              </Text>
              <Pressable onPress={cancelForm}>
                <Text style={styles.formClose}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('myProducts.photo')}</Text>
              <Pressable
                style={styles.photoPicker}
                onPress={handlePickPhoto}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color={colors.leaf700} />
                ) : form.image_url ? (
                  <Image
                    source={{ uri: `${SERVER_BASE}${form.image_url}` }}
                    style={styles.photoPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderIcon}>📷</Text>
                    <Text style={styles.photoPlaceholderText}>{t('myProducts.addPhoto')}</Text>
                  </View>
                )}
              </Pressable>
              {form.image_url && !uploadingImage && (
                <Pressable onPress={handlePickPhoto}>
                  <Text style={styles.photoChangeText}>{t('myProducts.changePhoto')}</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('myProducts.name')}</Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('myProducts.crop')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cropRow}
              >
                {crops.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setForm({ ...form, crop_id: String(c.id) })}
                    style={[
                      styles.cropChip,
                      form.crop_id === String(c.id) && styles.cropChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cropChipText,
                        form.crop_id === String(c.id) && styles.cropChipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('myProducts.quality')}</Text>
              <View style={styles.cropRow}>
                {qualityOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setForm({ ...form, quality: opt.value })}
                    style={[styles.cropChip, form.quality === opt.value && styles.cropChipActive]}
                  >
                    <Text
                      style={[
                        styles.cropChipText,
                        form.quality === opt.value && styles.cropChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('myProducts.certification')}</Text>
              <View style={styles.cropRow}>
                {certificationOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setForm({ ...form, certification: opt.value })}
                    style={[
                      styles.cropChip,
                      form.certification === opt.value && styles.cropChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cropChipText,
                        form.certification === opt.value && styles.cropChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('myProducts.description')}</Text>
              <TextInput
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                multiline
                numberOfLines={2}
                style={[styles.input, styles.textarea]}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.flex1]}>
                <Text style={styles.label}>{t('myProducts.pricePerUnit')}</Text>
                <TextInput
                  value={form.price_per_unit}
                  onChangeText={(v) => {
                    setForm({ ...form, price_per_unit: v })
                    setAppliedSuggestionId(null)
                  }}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
              <View style={[styles.field, styles.flex1]}>
                <Text style={styles.label}>{t('myProducts.unit')}</Text>
                <TextInput
                  value={form.unit}
                  onChangeText={(v) => setForm({ ...form, unit: v })}
                  placeholder={t('myProducts.unitPlaceholder')}
                  placeholderTextColor="rgba(15,36,17,0.4)"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('myProducts.quantityAvailable')}</Text>
              <TextInput
                value={form.quantity_available}
                onChangeText={(v) => setForm({ ...form, quantity_available: v })}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Pressable
                onPress={handleSuggestPrice}
                disabled={!form.crop_id || suggesting}
                style={[styles.suggestButton, (!form.crop_id || suggesting) && styles.submitDisabled]}
              >
                <Text style={styles.suggestButtonText}>
                  {suggesting ? t('myProducts.calculatingSuggestion') : `✨ ${t('myProducts.suggestPrice')}`}
                </Text>
              </Pressable>

              {suggestionError && <Text style={styles.suggestionHint}>{suggestionError}</Text>}

              {suggestion && suggestion.suggested_price != null && (
                <View style={styles.suggestionCard}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionPrice}>
                      {suggestion.suggested_price.toLocaleString('pt-AO')} Kz
                    </Text>
                    <Text style={styles.suggestionConfidence}>
                      {t('myProducts.confidence')} {confidenceLabels[suggestion.confidence ?? ''] ?? '—'}
                    </Text>
                  </View>
                  {suggestion.range_low != null && suggestion.range_high != null && (
                    <Text style={styles.suggestionHint}>
                      {t('myProducts.range')} {suggestion.range_low.toLocaleString('pt-AO')} –{' '}
                      {suggestion.range_high.toLocaleString('pt-AO')} Kz
                    </Text>
                  )}
                  {suggestion.factors.map((f, i) => (
                    <Text key={i} style={styles.suggestionFactor}>
                      {f.label}: {f.delta_pct > 0 ? '+' : ''}
                      {f.delta_pct.toFixed(1)}%
                    </Text>
                  ))}
                  <Pressable onPress={applySuggestion} style={styles.applyButton}>
                    <Text style={styles.applyButtonText}>{t('myProducts.useThisPrice')}</Text>
                  </Pressable>
                </View>
              )}
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
                {submitting ? t('myProducts.saving') : t('myProducts.saveProduct')}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.list}>
          {products.length === 0 && editingId === null && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{t('myProducts.noProductsYet')}</Text>
            </View>
          )}

          {products.map((product) => (
            <View key={product.id} style={styles.productRow}>
              {product.image_url ? (
                <Image
                  source={{ uri: `${SERVER_BASE}${product.image_url}` }}
                  style={styles.productThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productThumbPlaceholder}>
                  <Text style={styles.productThumbIcon}>🌿</Text>
                </View>
              )}
              <View style={styles.productInfo}>
                <View style={styles.productTitleRow}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{product.crop_name}</Text>
                  </View>
                </View>
                <Text style={styles.productMeta}>
                  {product.price_per_unit.toLocaleString('pt-AO')} Kz / {product.unit} ·{' '}
                  {product.quantity_available} {product.unit} {t('myProducts.available')}
                </Text>
              </View>

              <View style={styles.productActions}>
                <Pressable onPress={() => startEdit(product)} style={styles.actionButton}>
                  <Text style={styles.actionIcon}>✏️</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(product.id)} style={styles.actionButton}>
                  <Text style={styles.actionIcon}>🗑️</Text>
                </Pressable>
              </View>
            </View>
          ))}
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
    paddingBottom: 40,
  },
  ctaBox: {
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.earth200,
    backgroundColor: colors.earth50,
    padding: 20,
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.earth800,
  },
  ctaSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.earth800,
  },
  ctaButton: {
    marginTop: 14,
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
  newButton: {
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingVertical: 12,
    alignItems: 'center',
  },
  newButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  formCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.leaf50,
    borderWidth: 1,
    borderColor: colors.leaf100,
    padding: 18,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.leaf950,
  },
  formClose: {
    fontSize: 15,
    color: 'rgba(15,36,17,0.5)',
  },
  field: {
    marginTop: 14,
  },
  photoPicker: {
    marginTop: 6,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoPlaceholderIcon: {
    fontSize: 28,
  },
  photoPlaceholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf700,
  },
  photoChangeText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.leaf700,
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
  textarea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  cropRow: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  cropChipActive: {
    borderColor: colors.leaf600,
    backgroundColor: colors.leaf700,
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.7)',
  },
  cropChipTextActive: {
    color: '#fff',
  },
  suggestButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.leaf300,
    backgroundColor: '#fff',
    paddingVertical: 11,
    alignItems: 'center',
  },
  suggestButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf700,
  },
  suggestionHint: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  suggestionCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    padding: 14,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  suggestionPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.leaf950,
  },
  suggestionConfidence: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.6)',
  },
  suggestionFactor: {
    marginTop: 3,
    fontSize: 12,
    color: 'rgba(15,36,17,0.7)',
  },
  applyButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: colors.earth100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.earth800,
  },
  submit: {
    marginTop: 16,
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
  list: {
    marginTop: 16,
    gap: 10,
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
  productRow: {
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
  productThumb: {
    height: 44,
    width: 44,
    borderRadius: 10,
  },
  productThumbPlaceholder: {
    height: 44,
    width: 44,
    borderRadius: 10,
    backgroundColor: colors.leaf100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productThumbIcon: {
    fontSize: 18,
  },
  productInfo: {
    flexShrink: 1,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.leaf950,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.leaf700,
  },
  productMeta: {
    marginTop: 3,
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  productActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 16,
  },
})
