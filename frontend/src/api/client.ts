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

export type UserRole = 'farmer' | 'buyer' | 'distributor' | 'admin'

export type User = {
  id: number
  name: string
  email: string
  phone: string | null
  role: UserRole
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
  buyer_email: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const API_BASE = '/api/v1'

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
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

export function registerUser(payload: {
  name: string
  email: string
  password: string
  role: UserRole
  phone?: string
}): Promise<User> {
  return request<User>('/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchMe(token: string): Promise<User> {
  return request<User>('/auth/me', { token })
}

export function createOrder(
  items: { product_id: number; quantity: number }[],
  token: string,
): Promise<unknown> {
  return request('/orders/', {
    method: 'POST',
    token,
    body: JSON.stringify({ items }),
  })
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
    category?: string
    unit?: string
    price_per_unit: number
    quantity_available?: number
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
    category: string
    unit: string
    price_per_unit: number
    quantity_available: number
  }>,
  token: string,
): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function deleteProduct(id: number, token: string): Promise<void> {
  return request<void>(`/products/${id}`, { method: 'DELETE', token })
}

export function fetchSales(token: string): Promise<Sale[]> {
  return request<Sale[]>('/orders/sales', { token })
}
