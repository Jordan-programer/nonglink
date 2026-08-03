import { Link } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Logo from '../../components/Logo'
import { colors } from '../../theme/colors'

const stats = [
  { value: '+30%', label: 'rendimento estimado' },
  { value: '-25%', label: 'desperdício pós-colheita' },
  { value: '24/7', label: 'monitorização das lavras' },
]

const features = [
  {
    title: 'Marketplace agrícola',
    description:
      'Vende diretamente a compradores, distribuidores e consumidores, sem passar por intermediários.',
  },
  {
    title: 'Monitorização IoT',
    description:
      'Sensores de baixo custo medem humidade do solo, temperatura, nível de água e condições ambientais em tempo real.',
  },
  {
    title: 'Apoio inteligente à decisão',
    description:
      'A plataforma analisa os dados recolhidos e sugere quando irrigar, alerta sobre riscos e prevê a produção.',
  },
]

const impact = [
  'Aumento da renda dos agricultores',
  'Redução do desperdício pós-colheita',
  'Melhoria da produtividade agrícola',
  'Mais segurança alimentar',
]

export default function Home() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <Logo size={32} />
        <Text style={styles.brand}>AgriLink</Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>🌱 AgriTech feita para Angola</Text>
      </View>

      <Text style={styles.heading}>
        Da lavra ao mercado, <Text style={styles.headingAccent}>sem intermediários.</Text>
      </Text>

      <Text style={styles.paragraph}>
        AgriLink liga agricultores diretamente a compradores, monitoriza as suas
        lavras com sensores IoT e usa dados para recomendar a melhor altura de
        irrigar, colher e vender.
      </Text>

      <Link href="/mercado" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Explorar o mercado →</Text>
        </Pressable>
      </Link>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Um ecossistema completo</Text>
      <View style={styles.featureList}>
        {features.map((f) => (
          <View key={f.title} style={styles.featureCard}>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDescription}>{f.description}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Impacto real na cadeia de valor</Text>
      <View style={styles.impactGrid}>
        {impact.map((label) => (
          <View key={label} style={styles.impactItem}>
            <Text style={styles.impactText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.finalCta}>
        <Text style={styles.finalCtaTitle}>
          Pronto para vender direto e cultivar com dados?
        </Text>
        <Link href="/mercado" asChild>
          <Pressable style={styles.finalCtaButton}>
            <Text style={styles.finalCtaButtonText}>Começar agora</Text>
          </Pressable>
        </Link>
      </View>
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
    gap: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.leaf950,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf800,
  },
  heading: {
    marginTop: 16,
    fontSize: 30,
    fontWeight: '700',
    color: colors.leaf950,
    lineHeight: 36,
  },
  headingAccent: {
    color: colors.leaf600,
  },
  paragraph: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(15,36,17,0.7)',
  },
  cta: {
    marginTop: 20,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statsRow: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.leaf900,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  sectionTitle: {
    marginTop: 36,
    marginBottom: 14,
    fontSize: 20,
    fontWeight: '700',
    color: colors.leaf950,
  },
  featureList: {
    gap: 12,
  },
  featureCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 16,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.leaf950,
  },
  featureDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(15,36,17,0.7)',
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  impactItem: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    backgroundColor: colors.leaf50,
    padding: 14,
    alignItems: 'center',
  },
  impactText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    color: 'rgba(15,36,17,0.8)',
  },
  finalCta: {
    marginTop: 32,
    borderRadius: 24,
    backgroundColor: colors.leaf700,
    padding: 24,
    alignItems: 'center',
  },
  finalCtaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  finalCtaButton: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  finalCtaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.leaf800,
  },
})
