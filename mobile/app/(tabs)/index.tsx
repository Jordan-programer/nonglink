import { Redirect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import FarmerHome from '../../components/FarmerHome'
import GenericHome from '../../components/GenericHome'

export default function Home() {
  const { user } = useAuth()

  if (user?.role === 'buyer' || user?.role === 'distributor') {
    return <Redirect href="/mercado" />
  }

  if (user?.role === 'admin' || user?.role === 'superadmin') {
    return <Redirect href="/admin" />
  }

  if (user?.role === 'transporter') {
    return <Redirect href="/entregas" />
  }

  if (user?.role === 'farmer') {
    return <FarmerHome />
  }

  return <GenericHome />
}
