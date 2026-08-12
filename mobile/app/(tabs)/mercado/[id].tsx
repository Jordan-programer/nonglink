import { useCallback, useState } from 'react'
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import { useCart } from '../../../context/CartContext'
import { SERVER_BASE, fetchProduct, type Product } from '../../../lib/api'
import { colors } from '../../../theme/colors'

const TILE_COLORS = [colors.leaf500, colors.earth500, colors.leaf700]

export default function ProductDetail() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!id) return
      let cancelled = false

      setStatus('loading')
      setAdded(false)
      setQuantity(1)

      fetchProduct(id)
        .then((data) => {
          if (!cancelled) {
            setProduct(data)
            setStatus('ready')
          }
        })
        .catch(() => {
          if (!cancelled) setStatus('error')
        })

      return () => {
        cancelled = true
      }
    }, [id]),
  )

  function handleAddToCart() {
    if (!product) return
    addItem(product, quantity)
    setAdded(true)
  }

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  if (status === 'error' || !product) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{t('productDetail.notFound')}</Text>
        <Link href="/mercado" asChild>
          <Pressable style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={16} color={colors.leaf700} />
            <Text style={styles.backButtonText}>{t('productDetail.backToMarket')}</Text>
          </Pressable>
        </Link>
      </View>
    )
  }

  const maxQuantity = Math.max(product.quantity_available, 0)
  const isOwnProduct = user?.id === product.farm_owner_id

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {product.image_url ? (
        <Image
          source={{ uri: `${SERVER_BASE}${product.image_url}` }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.imagePlaceholder,
            { backgroundColor: TILE_COLORS[product.id % TILE_COLORS.length] },
          ]}
        >
          <Text style={styles.imagePlaceholderIcon}>🌿</Text>
        </View>
      )}

      <View style={styles.titleRow}>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{product.crop_name}</Text>
        </View>
      </View>

      {product.description && <Text style={styles.description}>{product.description}</Text>}

      <View style={styles.priceBox}>
        <Text style={styles.price}>
          {product.price_per_unit.toLocaleString('pt-AO')} Kz
          <Text style={styles.unit}> / {product.unit}</Text>
        </Text>
        <Text style={styles.availableText}>
          {product.quantity_available} {product.unit} {t('productDetail.available')}
        </Text>
      </View>

      <View style={styles.sellerBox}>
        <MaterialCommunityIcons name="sprout" size={18} color={colors.leaf700} />
        <Text style={styles.sellerText}>
          {t('productDetail.soldBy')}{' '}
          <Text style={styles.sellerName}>{product.farm_owner_name}</Text> · {product.farm_name}
        </Text>
      </View>

      {isOwnProduct ? (
        <View style={styles.mutedBox}>
          <Text style={styles.mutedText}>{t('productDetail.ownProduct')}</Text>
        </View>
      ) : maxQuantity <= 0 ? (
        <View style={styles.mutedBox}>
          <Text style={styles.outOfStockText}>{t('productDetail.outOfStock')}</Text>
        </View>
      ) : (
        <View style={styles.orderSection}>
          <Text style={styles.quantityLabel}>{t('productDetail.quantity')}</Text>
          <View style={styles.stepperRow}>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => {
                  setQuantity((q) => Math.max(1, q - 1))
                  setAdded(false)
                }}
                style={styles.stepperButton}
                accessibilityLabel={t('productDetail.decrease')}
              >
                <MaterialCommunityIcons name="minus" size={18} color={colors.leaf700} />
              </Pressable>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <Pressable
                onPress={() => {
                  setQuantity((q) => Math.min(maxQuantity, q + 1))
                  setAdded(false)
                }}
                style={styles.stepperButton}
                accessibilityLabel={t('productDetail.increase')}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.leaf700} />
              </Pressable>
            </View>
            <Text style={styles.stepperUnit}>{product.unit}</Text>
          </View>

          {added && (
            <View style={styles.successBox}>
              <View style={styles.successRow}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.leaf700} />
                <Text style={styles.successText}>{t('productDetail.addedToCart')}</Text>
              </View>
              <Link href="/mercado/carrinho" asChild>
                <Pressable>
                  <Text style={styles.successLink}>{t('productDetail.viewCart')} →</Text>
                </Pressable>
              </Link>
            </View>
          )}

          <Pressable style={styles.orderButton} onPress={handleAddToCart}>
            <MaterialCommunityIcons name="cart-plus" size={18} color="#fff" />
            <Text style={styles.orderButtonText}>{t('productDetail.addToCart')}</Text>
          </Pressable>
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
    backgroundColor: colors.cream50,
  },
  notFoundText: {
    fontSize: 14,
    color: 'rgba(15,36,17,0.6)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.leaf700,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  image: {
    height: 220,
    borderRadius: 20,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 48,
  },
  titleRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  name: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.leaf950,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.leaf700,
    textTransform: 'capitalize',
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(15,36,17,0.7)',
  },
  priceBox: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: colors.leaf50,
    padding: 18,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.leaf900,
  },
  unit: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(15,36,17,0.5)',
  },
  availableText: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  sellerBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.leaf100,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sellerText: {
    flexShrink: 1,
    fontSize: 13,
    color: 'rgba(15,36,17,0.7)',
  },
  sellerName: {
    fontWeight: '600',
    color: colors.leaf950,
  },
  successBox: {
    marginTop: 22,
    gap: 10,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf800,
  },
  successLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf700,
  },
  mutedBox: {
    marginTop: 22,
    borderRadius: 14,
    backgroundColor: colors.leaf50,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  mutedText: {
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  outOfStockText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.earth700,
  },
  orderSection: {
    marginTop: 22,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.8)',
  },
  stepperRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.leaf200,
  },
  stepperButton: {
    padding: 12,
  },
  stepperValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.leaf950,
  },
  stepperUnit: {
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  orderButton: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingVertical: 15,
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
})
