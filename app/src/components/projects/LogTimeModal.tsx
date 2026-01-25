'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Calendar, Clock, FileText, Folder, Hash, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0])
      setHours('')
      setDescription('')
      setIsCalendarOpen(false)
      setCalendarMonth(new Date())
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  useEffect(() => {
    if (!isCalendarOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCalendarOpen])

  if (!isOpen) return null

  const normalizeKey = (value: string | null) => {
    if (!value) return ''
    return value
      .toString()
      .trim()
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .toUpperCase()
  }

  const typeKey = normalizeKey(task.task_type)
  const isExternal = typeKey === 'EXTERNAL'
  const isInternal = typeKey === 'INTERNAL'
  const taskTypeLabel = isExternal ? 'External' : isInternal ? 'Internal' : 'Unknown'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!employeeId) {
      alert('Employee not found. Please make sure you are logged in with a valid account.')
      return
    }

    const parsedHours = Number.parseFloat(hours)
    if (!Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      alert('Please enter valid hours (0 < hours ≤ 24)')
      return
    }

    if (!/^\d+(\.\d{1,2})?$/.test(hours.trim())) {
      alert('Hours can have максимум 2 знаки після коми')
      return
    }

    setIsLoading(true)

    try {
      await onSubmit({
        task_id: task.id,
        project_id: projectId,
        employee_id: employeeId,
        date,
        hours: parsedHours,
        description,
      })

      onClose()
    } catch (error) {
      console.error('Failed to log time:', error)
      alert('Failed to log time. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedDate = useMemo(() => {
    try {
      return parseISO(date)
    } catch {
      return new Date()
    }
  }, [date])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 })
    const end = endOfMonth(calendarMonth)
    const days: Date[] = []
    let current = start
    while (current <= end || days.length % 7 !== 0) {
      days.push(current)
      current = addDays(current, 1)
    }
    return days
  }, [calendarMonth])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/60" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[rgb(10_194_255)]/15 flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm border-2 border-[rgb(10_194_255)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">QuitCode</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors -mr-2 -mt-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Folder className="w-4 h-4" />
              Project
            </label>
            <input
              type="text"
              value={`P-${projectId} ${projectName}`}
              readOnly
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Task
              </span>
              <span className={`
                inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md
                ${isExternal
                  ? 'bg-[rgb(10_194_255)] text-white'
                  : 'bg-[rgb(235_235_240)] text-gray-700'}
              `}>
                {taskTypeLabel}
              </span>
            </label>
            <input
              type="text"
              value={`T-${task.id} ${task.name}`}
              readOnly
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900"
            />
          </div>

          {/* Date and Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Date
              </label>
              <div className="relative" ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen((prev) => !prev)}
                  className="w-full text-left px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(10_194_255)]/20 focus:border-[rgb(10_194_255)]/40 transition-colors"
                >
                  {format(selectedDate, 'dd.MM.yyyy')}
                </button>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                {isCalendarOpen && (
                  <div className="absolute z-30 mt-2 w-full min-w-[280px] rounded-2xl border border-gray-200 bg-white shadow-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => subMonths(prev, 1))}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="text-sm font-semibold text-gray-900">
                        {format(calendarMonth, 'MMMM yyyy')}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-[11px] font-medium text-gray-500 mb-1">
                      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((label) => (
                        <div key={label} className="text-center py-1">
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day) => {
                        const isCurrentMonth = isSameMonth(day, calendarMonth)
                        const isSelected = isSameDay(day, selectedDate)
                        const minDate = addDays(startOfDay(new Date()), -2)
                        const isDisabled = day < minDate
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              if (isDisabled) return
                              setDate(format(day, 'yyyy-MM-dd'))
                              setIsCalendarOpen(false)
                            }}
                            className={`h-9 rounded-lg text-[12px] font-medium transition-colors ${
                              isSelected
                                ? 'bg-[rgb(10_194_255)] text-white'
                                : isToday(day)
                                  ? 'bg-[rgb(10_194_255)]/10 text-gray-900'
                                  : isCurrentMonth
                                    ? 'text-gray-900 hover:bg-gray-100'
                                    : 'text-gray-400 hover:bg-gray-100'
                            } ${isDisabled ? 'text-gray-300 hover:bg-transparent cursor-not-allowed' : ''}`}
                          >
                            {day.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                Hours
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={hours}
                  onChange={(e) => {
                    const next = e.target.value.replace(',', '.')
                    if (next === '') {
                      setHours('')
                      return
                    }
                    if (!/^\d+(\.\d{0,2})?$/.test(next)) return
                    const numeric = Number.parseFloat(next)
                    if (Number.isNaN(numeric)) return
                    if (numeric > 24) return
                    setHours(next)
                  }}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(10_194_255)]/20 focus:border-[rgb(10_194_255)]/40 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              What was done
            </label>
            <textarea
              placeholder="Type here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(10_194_255)]/20 focus:border-[rgb(10_194_255)]/40 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
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
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[rgb(10_194_255)] rounded-lg hover:bg-[rgb(8_174_230)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
