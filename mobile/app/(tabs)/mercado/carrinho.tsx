import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import { useCart } from '../../../context/CartContext'
import { ApiError, createOrder } from '../../../lib/api'
import { colors } from '../../../theme/colors'

export default function Cart() {
  const { t } = useTranslation()
  const router = useRouter()
  const { token } = useAuth()
  const { items, totalAmount, updateQuantity, removeItem, clearCart } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    if (!token || items.length === 0) return

    setCheckingOut(true)
    setError(null)
    try {
      const order = await createOrder(
        items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        token,
      )
      clearCart()
      router.replace({ pathname: '/mercado/pagamento/[orderId]', params: { orderId: String(order.id) } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('cart.checkoutError'))
    } finally {
      setCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <MaterialCommunityIcons name="cart-outline" size={40} color="rgba(15,36,17,0.3)" />
        <Text style={styles.emptyText}>{t('cart.empty')}</Text>
        <Link href="/mercado" asChild>
          <Pressable>
            <Text style={styles.emptyLink}>{t('cart.continueShopping')}</Text>
          </Pressable>
        </Link>
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.items}>
        {items.map((item) => (
          <View key={item.product_id} style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemFarm}>{item.farm_name}</Text>
              <Text style={styles.itemPrice}>
                {item.price_per_unit.toLocaleString('pt-AO')} Kz / {item.unit}
              </Text>
            </View>

            <View style={styles.itemActions}>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
                  style={styles.stepperButton}
                  accessibilityLabel={t('cart.decrease')}
                >
                  <MaterialCommunityIcons name="minus" size={16} color={colors.leaf700} />
                </Pressable>
                <Text style={styles.stepperValue}>{item.quantity}</Text>
                <Pressable
                  onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.quantity_available}
                  style={styles.stepperButton}
                  accessibilityLabel={t('cart.increase')}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color={item.quantity >= item.quantity_available ? colors.leaf200 : colors.leaf700}
                  />
                </Pressable>
              </View>

              <Text style={styles.itemSubtotal}>
                {(item.quantity * item.price_per_unit).toLocaleString('pt-AO')} Kz
              </Text>

              <Pressable
                onPress={() => removeItem(item.product_id)}
                style={styles.removeButton}
                accessibilityLabel={t('cart.remove')}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#c1462b" />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>{t('cart.total')}</Text>
        <Text style={styles.totalValue}>{totalAmount.toLocaleString('pt-AO')} Kz</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Pressable
        style={[styles.checkoutButton, checkingOut && styles.checkoutButtonDisabled]}
        onPress={handleCheckout}
        disabled={checkingOut}
      >
        <Text style={styles.checkoutButtonText}>
          {checkingOut ? t('cart.checkingOut') : t('cart.checkout')}
        </Text>
      </Pressable>

      <Pressable onPress={clearCart} style={styles.clearButton}>
        <Text style={styles.clearButtonText}>{t('cart.clearCart')}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream50,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
    backgroundColor: colors.cream50,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(15,36,17,0.6)',
  },
  emptyLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.leaf700,
  },
  items: {
    gap: 10,
  },
  item: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
  },
  itemInfo: {
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.leaf950,
  },
  itemFarm: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  itemPrice: {
    marginTop: 4,
    fontSize: 13,
    color: colors.leaf900,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.leaf200,
  },
  stepperButton: {
    padding: 8,
  },
  stepperValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.leaf950,
  },
  itemSubtotal: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: colors.leaf900,
  },
  removeButton: {
    padding: 8,
  },
  totalBox: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: colors.leaf50,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.8)',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.leaf900,
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: colors.earth50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.earth800,
  },
  checkoutButton: {
    marginTop: 18,
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingVertical: 15,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  clearButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.6)',
  },
})
