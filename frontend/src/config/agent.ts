export const AGENT_URL: string =
  (import.meta.env.VITE_AGENT_URL as string | undefined)?.trim() || 'https://agent.agrilink.store'

