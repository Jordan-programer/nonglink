import Constants from 'expo-constants'
import { Platform } from 'react-native'

export type Region = {
  id: number
  name: string
}

export type CropCategory =
  | 'cereais'
  | 'leguminosas'
  | 'tuberculos'
  | 'frutas'
  | 'hortalicas'
  | 'outros'

export type Crop = {
  id: number
  name: string
  category: CropCategory
  default_unit: string
}

export type ProductQuality = 'A' | 'B' | 'C'
export type ProductCertification = 'none' | 'organic' | 'in_transition'

export type Product = {
  id: number
  farm_id: number
  name: string
  description: string | null
  image_url: string | null
  crop_id: number
  crop_name: string
  crop_category: CropCategory
  unit: string
  price_per_unit: number
  quantity_available: number
  quality: ProductQuality | null
  certification: ProductCertification
  farm_name: string
  farm_owner_id: number
  farm_owner_name: string
}

export type UserRole =
  | 'farmer'
  | 'buyer'
  | 'distributor'
  | 'transporter'
  | 'admin'
  | 'superadmin'

export type User = {
  id: number
  name: string
  email: string | null
  phone: string | null
  role: UserRole
  region_id: number | null
  is_active: boolean
}

export type AuthResponse = {
  access_token: string
  token_type: string
  user: User
}

export type Farm = {
  id: number
  owner_id: number
  name: string
  location: string | null
  latitude: number | null
  longitude: number | null
  size_hectares: number | null
  region_id: number | null
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export type Sale = {
  order_id: number
  order_item_id: number
  status: OrderStatus
  created_at: string
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  buyer_name: string
  buyer_email: string | null
}

export type SuggestionConfidence = 'alta' | 'media' | 'baixa'

export type SuggestionFactor = {
  label: string
  delta_pct: number
}

export type PriceSuggestion = {
  status: string
  suggestion_id: number | null
  crop_id: number
  region_id: number
  base_price: number | null
  suggested_price: number | null
  range_low: number | null
  range_high: number | null
  confidence: SuggestionConfidence | null
  factors: SuggestionFactor[]
  price_forecast_status: string
  demand_forecast_status: string
  note: string | null
}

export type PriceForecastPoint = {
  date: string
  predicted_price: number
  lower_bound: number
  upper_bound: number
}

export type PriceForecast = {
  status: string
  crop_id: number
  region_id: number
  data_points: number
  forecast: PriceForecastPoint[]
  note: string | null
}

export type DemandForecastPoint = {
  date: string
  predicted_quantity: number
  lower_bound: number
  upper_bound: number
}

export type DemandForecast = {
  status: string
  crop_id: number
  region_id: number
  data_points: number
  forecast: DemandForecastPoint[]
  note: string | null
}

export type SensorType = 'soil_moisture' | 'temperature' | 'water_level' | 'humidity'

export type Sensor = {
  id: number
  farm_id: number
  type: SensorType
  label: string | null
}

export type SensorReading = {
  id: number
  sensor_id: number
  value: number
  recorded_at: string
}

export type SensorDailyAggregate = {
  day: string
  avg_value: number
  min_value: number
  max_value: number
  count: number
}

export type SensorAlert = {
  id: number
  sensor_id: number
  reading_id: number
  severity: 'critical'
  message: string
  acknowledged: boolean
  created_at: string
}

export type OrderItem = {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
}

export type Order = {
  id: number
  buyer_id: number
  transporter_id: number | null
  status: OrderStatus
  total_amount: number
  created_at: string
  items: OrderItem[]
}

export type TransportOrder = Order & {
  buyer_name: string
  buyer_phone: string | null
}

export type UsersByRole = {
  farmer: number
  buyer: number
  distributor: number
  admin: number
  superadmin: number
}

export type AdminStats = {
  total_users: number
  users_by_role: UsersByRole
  total_farms: number
  total_products: number
  total_orders: number
  pending_orders: number
  total_revenue: number
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// Metro's hostUri gives the LAN/localhost address the dev bundler is served
// from, so the app can reach a backend running on the same machine whether
// it's opened on a simulator, an emulator, or a physical device.
function resolveHost(): string {
  const hostUri = Constants.expoConfig?.hostUri
  if (hostUri) return hostUri.split(':')[0]
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
}

export const SERVER_BASE = `http://${resolveHost()}:8000`
export const API_BASE = `${SERVER_BASE}/api/v1`

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options

  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(rest.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!res.ok) {
    let message = `Erro ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
      else if (Array.isArray(body.detail)) message = body.detail[0]?.msg ?? message
    } catch {
      // response wasn't JSON, keep the default message
    }
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export function fetchProducts(): Promise<Product[]> {
  return request<Product[]>('/products/')
}

export function fetchProduct(id: number | string): Promise<Product> {
  return request<Product>(`/products/${id}`)
}

export function createOrder(
  items: { product_id: number; quantity: number }[],
  token: string,
): Promise<Order> {
  return request<Order>('/orders/', {
    method: 'POST',
    token,
    body: JSON.stringify({ items }),
  })
}

export function fetchRegions(): Promise<Region[]> {
  return request<Region[]>('/regions/')
}

export function fetchCrops(): Promise<Crop[]> {
  return request<Crop[]>('/crops/')
}

export function registerUser(payload: {
  name: string
  email?: string
  phone?: string
  password: string
  role: UserRole
  region_id: number
}): Promise<User> {
  return request<User>('/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: { identifier: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchMe(token: string): Promise<User> {
  return request<User>('/auth/me', { token })
}

export function fetchMyFarms(token: string): Promise<Farm[]> {
  return request<Farm[]>('/farms/mine', { token })
}

export function createFarm(
  payload: {
    name: string
    location?: string
    latitude?: number
    longitude?: number
    size_hectares?: number
    region_id?: number
  },
  token: string,
): Promise<Farm> {
  return request<Farm>('/farms/', { method: 'POST', token, body: JSON.stringify(payload) })
}

export function updateFarm(
  id: number,
  payload: Partial<{
    name: string
    location: string
    latitude: number
    longitude: number
    size_hectares: number
    region_id: number
  }>,
  token: string,
): Promise<Farm> {
  return request<Farm>(`/farms/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function fetchMyProducts(token: string): Promise<Product[]> {
  return request<Product[]>('/products/mine', { token })
}

export function createProduct(
  payload: {
    farm_id: number
    name: string
    description?: string
    image_url?: string
    crop_id: number
    unit?: string
    price_per_unit: number
    quantity_available?: number
    quality?: ProductQuality
    certification?: ProductCertification
    price_suggestion_id?: number
  },
  token: string,
): Promise<Product> {
  return request<Product>('/products/', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function updateProduct(
  id: number,
  payload: Partial<{
    name: string
    description: string
    image_url: string
    crop_id: number
    unit: string
    price_per_unit: number
    quantity_available: number
    quality: ProductQuality
    certification: ProductCertification
    price_suggestion_id: number
  }>,
  token: string,
): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export async function uploadProductImage(uri: string, token: string): Promise<string> {
  const filename = uri.split('/').pop() || 'photo.jpg'
  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase()
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  const formData = new FormData()
  formData.append('file', { uri, name: filename, type: mime } as unknown as Blob)

  const res = await request<{ image_url: string }>('/products/upload-image', {
    method: 'POST',
    token,
    body: formData,
  })
  return res.image_url
}

export function suggestPrice(
  payload: {
    crop_id: number
    region_id: number
    quality?: ProductQuality
    certification?: ProductCertification
    farm_id?: number
  },
  token?: string,
): Promise<PriceSuggestion> {
  return request<PriceSuggestion>('/market/price-suggestions', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function deleteProduct(id: number, token: string): Promise<void> {
  return request<void>(`/products/${id}`, { method: 'DELETE', token })
}

export function fetchPriceForecast(payload: {
  crop_id: number
  region_id: number
  horizon_days?: number
}): Promise<PriceForecast> {
  const params = new URLSearchParams({
    crop_id: String(payload.crop_id),
    region_id: String(payload.region_id),
    ...(payload.horizon_days ? { horizon_days: String(payload.horizon_days) } : {}),
  })
  return request<PriceForecast>(`/market/price-forecast?${params}`)
}

export function fetchDemandForecast(payload: {
  crop_id: number
  region_id: number
  horizon_days?: number
}): Promise<DemandForecast> {
  const params = new URLSearchParams({
    crop_id: String(payload.crop_id),
    region_id: String(payload.region_id),
    ...(payload.horizon_days ? { horizon_days: String(payload.horizon_days) } : {}),
  })
  return request<DemandForecast>(`/market/demand-forecast?${params}`)
}

export function fetchSales(token: string): Promise<Sale[]> {
  return request<Sale[]>('/orders/sales', { token })
}

export function fetchSensors(): Promise<Sensor[]> {
  return request<Sensor[]>('/sensors/')
}

export function fetchSensorReadings(sensorId: number): Promise<SensorReading[]> {
  return request<SensorReading[]>(`/sensors/${sensorId}/readings`)
}

export function fetchSensorDailyReadings(sensorId: number): Promise<SensorDailyAggregate[]> {
  return request<SensorDailyAggregate[]>(`/sensors/${sensorId}/readings/daily`)
}

export function fetchMyAlerts(token: string): Promise<SensorAlert[]> {
  return request<SensorAlert[]>('/sensors/alerts/mine', { token })
}

export function acknowledgeAlert(alertId: number, token: string): Promise<SensorAlert> {
  return request<SensorAlert>(`/sensors/alerts/${alertId}/acknowledge`, {
    method: 'PATCH',
    token,
  })
}

export function fetchMyOrders(token: string): Promise<Order[]> {
  return request<Order[]>('/orders/', { token })
}

export function fetchAdminStats(token: string): Promise<AdminStats> {
  return request<AdminStats>('/admin/stats', { token })
}

export function fetchAllUsers(token: string): Promise<User[]> {
  return request<User[]>('/users/', { token })
}

export function updateUserRole(userId: number, role: UserRole, token: string): Promise<User> {
  return request<User>(`/users/${userId}/role`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ role }),
  })
}

export function updateUserStatus(
  userId: number,
  isActive: boolean,
  token: string,
): Promise<User> {
  return request<User>(`/users/${userId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ is_active: isActive }),
  })
}

export function deleteUser(userId: number, token: string): Promise<void> {
  return request<void>(`/users/${userId}`, { method: 'DELETE', token })
}

export function fetchAvailableDeliveries(token: string): Promise<TransportOrder[]> {
  return request<TransportOrder[]>('/transport/available', { token })
}

export function fetchMyDeliveries(token: string): Promise<TransportOrder[]> {
  return request<TransportOrder[]>('/transport/mine', { token })
}

export function claimDelivery(orderId: number, token: string): Promise<TransportOrder> {
  return request<TransportOrder>(`/transport/${orderId}/claim`, { method: 'PATCH', token })
}

export function updateDeliveryStatus(
  orderId: number,
  status: 'shipped' | 'delivered',
  token: string,
): Promise<TransportOrder> {
  return request<TransportOrder>(`/transport/${orderId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  })
}
