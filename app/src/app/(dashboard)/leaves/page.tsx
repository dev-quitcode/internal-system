'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, Clock, Home, Heart, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'
import { format, differenceInYears, differenceInDays, addDays } from 'date-fns'

interface Leave {
  id: number
  leave_type: string
  start_date: string
  end_date: string
  status: string
  reason: string | null
  created_at: string
}

interface LeaveBalance {
  remote_days_used: number
  remote_days_total: number
  vacation_days_used: number
  vacation_days_total: number
}

export default function LeavesPage() {
  const { employee, isLoading: isLoadingEmployee } = useEmployee()
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState<LeaveBalance>({
    remote_days_used: 0,
    remote_days_total: 0,
    vacation_days_used: 0,
    vacation_days_total: 20, // Default
  })
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [formData, setFormData] = useState({
    leave_type: 'VACATION',
    start_date: '',
    end_date: '',
    reason: '',
  })

  useEffect(() => {
    if (employee) {
      loadLeaves()
      calculateBalance()
    }
  }, [employee])

  const calculateBalance = async () => {
    if (!employee) return

    try {
      const supabase = createClient()
      
      // Calculate remote days allowance based on employment duration
      const yearsEmployed = differenceInYears(new Date(), new Date(employee.employment_date))
      let remoteDaysTotal = 0
      if (yearsEmployed >= 1 && yearsEmployed < 2) {
        remoteDaysTotal = 4
      } else if (yearsEmployed >= 2) {
        remoteDaysTotal = 6
      }

      // Get used days from leaves table
      const currentYear = new Date().getFullYear()
      const { data: leavesData, error } = await supabase
        .from('leaves')
        .select('leave_type, start_date, end_date')
        .eq('employee_id', employee.id)
        .eq('status', 'APPROVED')
        .gte('start_date', `${currentYear}-01-01`)
        .lte('start_date', `${currentYear}-12-31`)

      if (error) throw error

      let remoteDaysUsed = 0
      let vacationDaysUsed = 0

      leavesData?.forEach((leave) => {
        const days = differenceInDays(
          new Date(leave.end_date),
          new Date(leave.start_date)
        ) + 1

        if (leave.leave_type === 'REMOTE') {
          remoteDaysUsed += days
        } else if (leave.leave_type === 'VACATION') {
          vacationDaysUsed += days
        }
      })

      setBalance({
        remote_days_used: remoteDaysUsed,
        remote_days_total: remoteDaysTotal,
        vacation_days_used: vacationDaysUsed,
        vacation_days_total: 20,
      })
    } catch (error) {
      console.error('Error calculating balance:', error)
    }
  }

  const loadLeaves = async () => {
    if (!employee) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leaves')
        .select('*')
        .eq('employee_id', employee.id)
        .order('start_date', { ascending: false })

      if (error) throw error
      setLeaves(data || [])
    } catch (error) {
      console.error('Error loading leaves:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return

    try {
      const supabase = createClient()

      // Calculate number of days
      const days = differenceInDays(
        new Date(formData.end_date),
        new Date(formData.start_date)
      ) + 1

      // Insert leave request
      const { data: leaveData, error: leaveError } = await supabase
        .from('leaves')
        .insert({
          employee_id: employee.id,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: 'APPROVED', // Auto-approve for now
          reason: formData.reason || null,
        })
        .select()
        .single()

      if (leaveError) throw leaveError

      // Create time tracking entries (8 hours per day)
      if (formData.leave_type === 'VACATION' || formData.leave_type === 'SICK') {
        const timeEntries = []
        let currentDate = new Date(formData.start_date)
        const endDate = new Date(formData.end_date)

        while (currentDate <= endDate) {
          // Skip weekends
          const dayOfWeek = currentDate.getDay()
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            timeEntries.push({
              employee_id: employee.id,
              project_id: 1, // You'll need a special "internal" project
              task_id: 1, // You'll need a special task for leaves
              date: format(currentDate, 'yyyy-MM-dd'),
              hours: 8,
              description: `${formData.leave_type} - ${formData.reason || 'N/A'}`,
              is_billable: false,
              leave_id: leaveData.id,
            })
          }
          currentDate = addDays(currentDate, 1)
        }

        if (timeEntries.length > 0) {
          const { error: timeError } = await supabase
            .from('time_tracking')
            .insert(timeEntries)

          if (timeError) throw timeError
        }
      }

      // Reset form and reload
      setFormData({
        leave_type: 'VACATION',
        start_date: '',
        end_date: '',
        reason: '',
      })
      setShowRequestModal(false)
      loadLeaves()
      calculateBalance()
    } catch (error) {
      console.error('Error submitting leave request:', error)
      alert('Failed to submit leave request')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return

    try {
      const supabase = createClient()

      // Delete related time tracking entries
      await supabase
        .from('time_tracking')
        .delete()
        .eq('leave_id', id)

      // Delete leave
      const { error } = await supabase
        .from('leaves')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadLeaves()
      calculateBalance()
    } catch (error) {
      console.error('Error deleting leave:', error)
      alert('Failed to delete leave request')
    }
  }

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'REMOTE':
        return <Home className="w-4 h-4" />
      case 'VACATION':
        return <Calendar className="w-4 h-4" />
      case 'SICK':
        return <Heart className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getLeaveTypeStyle = (type: string) => {
    switch (type) {
      case 'REMOTE':
        return 'bg-blue-50 text-blue-700'
      case 'VACATION':
        return 'bg-purple-50 text-purple-700'
      case 'SICK':
        return 'bg-red-50 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700'
      case 'PENDING':
        return 'bg-amber-50 text-amber-700'
      case 'REJECTED':
        return 'bg-red-50 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
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

  const remoteDaysRemaining = balance.remote_days_total - balance.remote_days_used
  const vacationDaysRemaining = balance.vacation_days_total - balance.vacation_days_used

  return (
    <div className="max-w-7xl mx-auto">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Remote Days</p>
              <p className="text-3xl font-bold">{remoteDaysRemaining}</p>
              <p className="text-blue-100 text-sm mt-1">
                of {balance.remote_days_total} days remaining
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <span className="text-sm text-blue-100">Used: {balance.remote_days_used} days</span>
            {balance.remote_days_total === 0 && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Available after 1 year</span>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm mb-1">Vacation Days</p>
              <p className="text-3xl font-bold">{vacationDaysRemaining}</p>
              <p className="text-purple-100 text-sm mt-1">
                of {balance.vacation_days_total} days remaining
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <span className="text-sm text-purple-100">Used: {balance.vacation_days_used} days</span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Leave History</h2>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      {/* Leaves List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading leaves...</p>
          </div>
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No leaves yet</h3>
            <p className="text-gray-500 text-center max-w-sm">
              Request your first leave to see it here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => {
            const days = differenceInDays(
              new Date(leave.end_date),
              new Date(leave.start_date)
            ) + 1

            return (
              <div
                key={leave.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getLeaveTypeStyle(leave.leave_type)}`}>
                      {getLeaveTypeIcon(leave.leave_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {leave.leave_type.charAt(0) + leave.leave_type.slice(1).toLowerCase()}
                        </h3>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyle(leave.status)}`}>
                          {leave.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(leave.start_date), 'MMM dd, yyyy')}
                          {leave.end_date !== leave.start_date && (
                            <> - {format(new Date(leave.end_date), 'MMM dd, yyyy')}</>
                          )}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {days} day{days !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {leave.reason && (
                        <p className="text-sm text-gray-500 mt-2">{leave.reason}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(leave.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Request Leave Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
            onClick={() => setShowRequestModal(false)}
          />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Request Leave</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['REMOTE', 'VACATION', 'SICK'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, leave_type: type })}
                      className={`
                        px-3 py-2 text-sm font-medium rounded-lg border transition-all
                        ${formData.leave_type === type
                          ? type === 'REMOTE' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            type === 'VACATION' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                            'bg-red-50 border-red-200 text-red-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  placeholder="Provide a reason for your leave request..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
