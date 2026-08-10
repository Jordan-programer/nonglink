import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import ProductCard from '../../components/ProductCard'
import { fetchProducts, type Product } from '../../lib/api'
import { colors } from '../../theme/colors'

export default function Marketplace() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.crop_name))),
    [products],
  )

  const filtered = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = !category || p.crop_name === category
    return matchesQuery && matchesCategory
  })

  return (
    <View style={styles.screen}>
      <FlatList
        data={status === 'ready' ? filtered : []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t('marketplace.title')}</Text>
            <Text style={styles.subtitle}>{t('marketplace.subtitle')}</Text>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('marketplace.searchPlaceholder')}
              placeholderTextColor="rgba(15,36,17,0.4)"
              style={styles.search}
            />

            {categories.length > 0 && (
              <View style={styles.categoryRow}>
                <Pressable
                  onPress={() => setCategory(null)}
                  style={[styles.chip, category === null && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === null && styles.chipTextActive]}>
                    {t('marketplace.all')}
                  </Text>
                </Pressable>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.chip, category === cat && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, category === cat && styles.chipTextActive]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {status === 'loading' && (
              <ActivityIndicator style={styles.loading} color={colors.leaf700} />
            )}

            {status === 'error' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{t('marketplace.errorLoading')}</Text>
              </View>
            )}

            {status === 'ready' && filtered.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{t('marketplace.noProducts')}</Text>
              </View>
            )}
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream50,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.leaf950,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(15,36,17,0.7)',
  },
  search: {
    marginTop: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.leaf950,
  },
  categoryRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: colors.leaf700,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.leaf700,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#fff',
  },
  loading: {
    marginTop: 32,
  },
  errorBox: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: colors.earth50,
    borderWidth: 1,
    borderColor: colors.earth200,
    padding: 20,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.earth800,
    textAlign: 'center',
  },
  emptyBox: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: colors.leaf50,
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(15,36,17,0.6)',
  },
})
