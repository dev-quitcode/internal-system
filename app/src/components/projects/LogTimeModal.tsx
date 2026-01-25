'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, FileText, ExternalLink } from 'lucide-react'

interface Task {
  id: number
  name: string
  task_type: string | null
}

interface LogTimeModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: number
  projectName: string
  task: Task
  employeeId: number | null
  onSubmit: (data: {
    task_id: number
    project_id: number
    employee_id: number
    date: string
    hours: number
    description: string
    is_billable: boolean
  }) => Promise<void>
}

export default function LogTimeModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  task,
  employeeId,
  onSubmit,
}: LogTimeModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0])
      setHours('')
      setDescription('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const isExternal = task.task_type !== 'INTERNAL'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!employeeId) {
      alert('Employee not found. Please make sure you are logged in with a valid account.')
      return
    }

    if (!hours || parseFloat(hours) <= 0) {
      alert('Please enter valid hours')
      return
    }

    setIsLoading(true)

    try {
      await onSubmit({
        task_id: task.id,
        project_id: projectId,
        employee_id: employeeId,
        date,
        hours: parseFloat(hours),
        description,
        is_billable: isExternal,
      })

      onClose()
    } catch (error) {
      console.error('Failed to log time:', error)
      alert('Failed to log time. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Log Time</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
                P-{projectId}
              </span>
              <span className="text-sm text-gray-600">{projectName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors -mr-2 -mt-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
                T-{task.id}
              </span>
              <span className="text-sm font-medium text-gray-900">{task.name}</span>
            </div>
            <span className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full
              ${isExternal 
                ? 'bg-cyan-100 text-cyan-700' 
                : 'bg-gray-200 text-gray-700'}
            `}>
              {isExternal ? (
                <>
                  <ExternalLink className="w-3 h-3" />
                  Billable
                </>
              ) : (
                'Internal'
              )}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date and Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  placeholder="0.00"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                placeholder="What did you work on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : (
                'Log Time'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
