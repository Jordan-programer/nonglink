import type { User } from '../api/client'

const UNSCOPED_ROLES = new Set(['admin', 'superadmin'])

export function needsProfileCompletion(user: User | null): boolean {
  if (!user) return false
  if (UNSCOPED_ROLES.has(user.role)) return false
  return !user.region_id
}
