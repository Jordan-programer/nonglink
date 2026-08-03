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
import ProductCard from '../../components/ProductCard'
import { fetchProducts, type Product } from '../../lib/api'
import { colors } from '../../theme/colors'

export default function Marketplace() {
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
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products],
  )

  const filtered = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = !category || p.category === category
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
            <Text style={styles.title}>Mercado agrícola</Text>
            <Text style={styles.subtitle}>
              Produtos frescos vendidos diretamente por agricultores em Angola, sem
              intermediários.
            </Text>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Procurar produtos..."
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
                    Todos
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
                <Text style={styles.errorText}>
                  Não foi possível carregar os produtos. Verifica se o backend está a
                  correr em http://localhost:8000.
                </Text>
              </View>
            )}

            {status === 'ready' && filtered.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
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
