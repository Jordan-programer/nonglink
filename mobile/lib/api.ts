import Constants from 'expo-constants'
import { Platform } from 'react-native'

export type Product = {
  id: number
  farm_id: number
  name: string
  description: string | null
  category: string | null
  unit: string
  price_per_unit: number
  quantity_available: number
}

// Metro's hostUri gives the LAN/localhost address the dev bundler is served
// from, so the app can reach a backend running on the same machine whether
// it's opened on a simulator, an emulator, or a physical device.
function resolveHost(): string {
  const hostUri = Constants.expoConfig?.hostUri
  if (hostUri) return hostUri.split(':')[0]
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
}

export const API_BASE = `http://${resolveHost()}:8000/api/v1`

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products/`)
  if (!res.ok) {
    throw new Error(`Failed to load products (${res.status})`)
  }
  return res.json()
}
