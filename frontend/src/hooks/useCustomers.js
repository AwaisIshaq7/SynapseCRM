import { useState, useEffect, useCallback } from 'react'
import { customersApi } from '../api/customersApi'
import toast from 'react-hot-toast'

/**
 * Hook for fetching + managing customers list with search + filter
 */
export function useCustomers(initialParams = {}) {
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [params,    setParams]    = useState(initialParams)

  const fetchCustomers = useCallback(async (fetchParams = params) => {
    setLoading(true)
    setError(null)
    try {
      const res = await customersApi.getAll(fetchParams)
      if (res.data.success) {
        setCustomers(res.data.data)
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load customers'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }))
  }, [])

  const deleteCustomer = useCallback(async (id) => {
    try {
      await customersApi.delete(id)
      setCustomers(prev => prev.filter(c => c._id !== id))
      toast.success('Customer deleted')
      return true
    } catch {
      toast.error('Failed to delete customer')
      return false
    }
  }, [])

  return { customers, loading, error, updateParams, deleteCustomer, refetch: fetchCustomers }
}

/**
 * Hook for a single customer by ID
 */
export function useCustomer(id) {
  const [customer, setCustomer] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetchCustomer = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await customersApi.getById(id)
      if (res.data.success) setCustomer(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Customer not found')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchCustomer() }, [fetchCustomer])

  return { customer, loading, error, refetch: fetchCustomer, setCustomer }
}