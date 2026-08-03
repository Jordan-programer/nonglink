import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Product } from '../lib/api'
import { colors } from '../theme/colors'

const TILE_COLORS = [colors.leaf500, colors.earth500, colors.leaf700]

function tileColor(id: number) {
  return TILE_COLORS[id % TILE_COLORS.length]
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <View style={styles.card}>
      <View style={[styles.tile, { backgroundColor: tileColor(product.id) }]}>
        <Text style={styles.tileIcon}>🌿</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {product.name}
          </Text>
          {product.category && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{product.category}</Text>
            </View>
          )}
        </View>

        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>
              {product.price_per_unit.toLocaleString('pt-AO')} Kz
              <Text style={styles.unit}> / {product.unit}</Text>
            </Text>
            <Text style={styles.available}>
              {product.quantity_available} {product.unit} disponíveis
            </Text>
          </View>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>Ver detalhes</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  tile: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIcon: {
    fontSize: 32,
  },
  body: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.leaf950,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.leaf700,
    textTransform: 'capitalize',
  },
  description: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.leaf900,
  },
  unit: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(15,36,17,0.5)',
  },
  available: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(15,36,17,0.5)',
  },
  cta: {
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
})
