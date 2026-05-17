import { useState, useEffect, useCallback } from 'react'
import { customersApi } from '../api/customersApi'
import toast from 'react-hot-toast'

/**
 * Hook for fetching + managing customers list with search + filter
 */
export function useCustomers(initialParams = { page: 1, limit: 12 }) {
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [params,    setParams]    = useState(initialParams)
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 })

  const fetchCustomers = useCallback(async (fetchParams = params) => {
    setLoading(true)
    setError(null)
    try {
      const res = await customersApi.getAll(fetchParams)
      if (res.data.success) {
        setCustomers(res.data.data)
        if (res.data.pagination) {
          setPagination(res.data.pagination)
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load customers'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const updateParams = useCallback((newParams) => {
    setParams(prev => {
      // If updating status or search, reset page to 1
      const page = ('status' in newParams || 'search' in newParams) ? 1 : (newParams.page || prev.page || 1);
      return { ...prev, ...newParams, page };
    })
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

  return { customers, loading, error, updateParams, deleteCustomer, refetch: fetchCustomers, pagination }
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

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  return { customer, loading, error, refetch: fetchCustomer, setCustomer }
}