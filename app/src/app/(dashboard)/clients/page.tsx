'use client'

import { useState, useEffect, FormEvent } from 'react'
import { Search, Filter, Building2, Globe, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'

type Client = {
  id: number
  first_name: string
  last_name: string
  company_name: string
  company_website: string
  email: string
  industry: string
  legal_address: string
  legal_city: string
  legal_country: string
  legal_state: string
  legal_zip: string
  status: string
  created_at: string | null
}

const emptyForm = {
  first_name: '',
  last_name: '',
  company_name: '',
  company_website: '',
  email: '',
  industry: '',
  legal_address: '',
  legal_city: '',
  legal_country: '',
  legal_state: '',
  legal_zip: '',
  status: 'Active',
}

export default function ClientsPage() {
  const { employee, isLoading: isLoadingEmployee, error: employeeError } = useEmployee()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Active')
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
  }, [statusFilter])

  const loadClients = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      let query = supabase
        .from('clients')
        .select('*')
        .order('company_name', { ascending: true })

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        console.error('Query error:', queryError)
        throw queryError
      }

      setClients(data || [])
    } catch (err) {
      console.error('Error loading clients:', err)
      setError(err instanceof Error ? err.message : 'Failed to load clients')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Inactive':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'Lead':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const openModal = () => {
    setForm(emptyForm)
    setSaveError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setForm(emptyForm)
    setSaveError(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)

    try {
      const supabase = createClient()
      const { error: insertError } = await supabase.from('clients').insert(form)

      if (insertError) throw insertError

      closeModal()
      await loadClients()
    } catch (err) {
      console.error('Error creating client:', err)
      setSaveError(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setIsSaving(false)
    }
  }

  if (employeeError) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">{employeeError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client relationships</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#12B7F5] text-white hover:bg-[#0ea5e0] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#12B7F5]"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name, company, email or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {['Active', 'Inactive', 'Lead', 'All'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-md transition-all
                    ${statusFilter === status
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700">{filteredClients.length}</span> client{filteredClients.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading clients...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadClients}
            className="px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
            <p className="text-gray-500 text-center max-w-sm">
              {searchQuery
                ? 'Try adjusting your search query or filters.'
                : 'No clients match the current filter.'}
            </p>
          </div>
        </div>
      ) : (
        /* ───── Table ───── */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Industry</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Website</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Company */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-cyan-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                          {client.company_name}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {client.first_name} {client.last_name}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <a href={`mailto:${client.email}`} className="text-sm text-cyan-600 hover:underline">
                        {client.email}
                      </a>
                    </td>

                    {/* Industry */}
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      {client.industry}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap hidden lg:table-cell">
                      {client.legal_city}, {client.legal_country}
                    </td>

                    {/* Website */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {client.company_website ? (
                        <a
                          href={client.company_website.startsWith('http') ? client.company_website : `https://${client.company_website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {client.company_website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───── Add Client Modal ───── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal} />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add New Client</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
              {/* Contact info */}
              <fieldset>
                <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Person</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input name="first_name" required value={form.first_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input name="last_name" required value={form.last_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input name="email" type="email" required value={form.email} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                </div>
              </fieldset>

              {/* Company info */}
              <fieldset>
                <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Company</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input name="company_name" required value={form.company_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                    <input name="industry" required value={form.industry} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website *</label>
                    <input name="company_website" required value={form.company_website} onChange={handleChange} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select name="status" required value={form.status} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Lead">Lead</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Legal address */}
              <fieldset>
                <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Legal Address</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input name="legal_address" required value={form.legal_address} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input name="legal_city" required value={form.legal_city} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input name="legal_state" required value={form.legal_state} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                    <input name="legal_zip" required value={form.legal_zip} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input name="legal_country" required value={form.legal_country} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                </div>
              </fieldset>

              {/* Error */}
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{saveError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#12B7F5] text-white hover:bg-[#0ea5e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#12B7F5]"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
