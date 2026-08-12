import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from '../api/client'

const CART_KEY = 'agrilink_cart'

export type CartItem = {
  product_id: number
  name: string
  image_url: string | null
  price_per_unit: number
  unit: string
  quantity: number
  quantity_available: number
  farm_name: string
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  totalAmount: number
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readCart())

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  function addItem(product: Product, quantity: number) {
    setItems((prev) => {
      const maxQty = Math.max(product.quantity_available, 0)
      const existing = prev.find((i) => i.product_id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: Math.min(maxQty, i.quantity + quantity), quantity_available: maxQty }
            : i,
        )
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          image_url: product.image_url,
          price_per_unit: product.price_per_unit,
          unit: product.unit,
          quantity: Math.min(maxQty, quantity),
          quantity_available: maxQty,
          farm_name: product.farm_name,
        },
      ]
    })
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  function updateQuantity(productId: number, quantity: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: Math.max(1, Math.min(i.quantity_available, quantity)) }
          : i,
      ),
    )
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price_per_unit, 0)

  return (
    <CartContext.Provider
      value={{ items, itemCount, totalAmount, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
