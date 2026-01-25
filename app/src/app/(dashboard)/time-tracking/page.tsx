'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Search, Edit2, Trash2, ExternalLink, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

interface TimeEntry {
  id: number
  date: string
  hours: number
  description: string
  is_billable: boolean
  created_at: string
  tasks: {
    id: number
    name: string
    task_type: string | null
    projects: {
      id: number
      name: string
    }
  }
}

export default function TimeTrackingPage() {
  const { employee, isLoading: isLoadingEmployee } = useEmployee()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    if (employee) {
      loadEntries()
    }
  }, [employee, dateFilter, customStartDate, customEndDate])

  useEffect(() => {
    // Set date range based on filter
    const today = new Date()
    if (dateFilter === 'today') {
      setStartDate(format(startOfDay(today), 'yyyy-MM-dd'))
      setEndDate(format(endOfDay(today), 'yyyy-MM-dd'))
    } else if (dateFilter === 'week') {
      setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
    } else if (dateFilter === 'month') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'))
    } else if (dateFilter === 'custom') {
      setStartDate(customStartDate)
      setEndDate(customEndDate || customStartDate)
    }
  }, [dateFilter, customStartDate, customEndDate])

  const loadEntries = async () => {
    if (!employee) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      let query = supabase
        .from('time_tracking')
        .select(`
          id,
          date,
          hours,
          description,
          is_billable,
          created_at,
          tasks (
            id,
            name,
            task_type,
            projects (
              id,
              name
            )
          )
        `)
        .eq('employee_id', employee.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      // Apply date filter
      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate)
      }

      const { data, error } = await query

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading time entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('time_tracking')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Reload entries
      loadEntries()
    } catch (error) {
      console.error('Error deleting time entry:', error)
      alert('Failed to delete time entry')
    }
  }

  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      entry.tasks.projects.name.toLowerCase().includes(searchLower) ||
      entry.tasks.name.toLowerCase().includes(searchLower) ||
      entry.description?.toLowerCase().includes(searchLower) ||
      `P-${entry.tasks.projects.id}`.toLowerCase().includes(searchLower) ||
      `T-${entry.tasks.id}`.toLowerCase().includes(searchLower)
    )
  })

  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const externalHours = filteredEntries.filter(e => e.is_billable).reduce((sum, entry) => sum + entry.hours, 0)
  const internalHours = totalHours - externalHours

  const handleApplyCustomDates = () => {
    if (customStartDate) {
      setDateFilter('custom')
      setShowDatePicker(false)
    }
  }

  const handleClearCustomDates = () => {
    setCustomStartDate('')
    setCustomEndDate('')
    setDateFilter('week')
    setShowDatePicker(false)
  }

  if (isLoadingEmployee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">External Hours</p>
              <p className="text-2xl font-bold text-gray-900">{externalHours.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Internal Hours</p>
              <p className="text-2xl font-bold text-gray-900">{internalHours.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by project, task or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {['today', 'week', 'month'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter as any)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-md transition-all
                    ${dateFilter === filter
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {filter === 'today' ? 'Today' : filter === 'week' ? 'Current Week' : 'Current Month'}
                </button>
              ))}
            </div>
            
            {/* Custom Date Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all
                  ${dateFilter === 'custom'
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Calendar className="w-4 h-4" />
                {dateFilter === 'custom' && customStartDate ? (
                  <span>
                    {format(new Date(customStartDate), 'MMM dd')}
                    {customEndDate && customEndDate !== customStartDate && ` - ${format(new Date(customEndDate), 'MMM dd')}`}
                  </span>
                ) : (
                  'Custom Date'
                )}
              </button>

              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDatePicker(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Select Date Range</h3>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        min={customStartDate}
                        disabled={!customStartDate}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for single day</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleClearCustomDates}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleApplyCustomDates}
                        disabled={!customStartDate}
                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700">{filteredEntries.length}</span> entr{filteredEntries.length !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      {/* Time Entries Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading time entries...</p>
          </div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No time entries found</h3>
            <p className="text-gray-500 text-center max-w-sm">
              {searchQuery 
                ? 'Try adjusting your search query.' 
                : 'Start logging time to see your entries here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">
                          P-{entry.tasks.projects.id}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {entry.tasks.projects.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">
                          T-{entry.tasks.id}
                        </span>
                        <span className="text-sm text-gray-700">{entry.tasks.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {entry.description || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full
                        ${entry.is_billable 
                          ? 'bg-cyan-50 text-cyan-700' 
                          : 'bg-gray-100 text-gray-700'}
                      `}>
                        {entry.is_billable ? (
                          <>
                            <ExternalLink className="w-3 h-3" />
                            Billable
                          </>
                        ) : (
                          'Internal'
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {entry.hours.toFixed(2)}h
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
