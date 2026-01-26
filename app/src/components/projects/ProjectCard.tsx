'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CustomSelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  options: CustomSelectOption[]
  onChange: (value: string) => void
  buttonClassName?: string
  menuClassName?: string
  optionClassName?: string
}

function CustomSelect({
  value,
  options,
  onChange,
  buttonClassName = '',
  menuClassName = '',
  optionClassName = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((option) => option.value === value)
  const label = selectedOption?.label ?? ''

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          w-full inline-flex items-center justify-between gap-2
          focus:outline-none focus:ring-2 focus:ring-cyan-500/20
          ${buttonClassName}
        `}
      >
        <span className={`truncate ${label ? '' : 'text-gray-400'}`}>
          {label || '\u00A0'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-current transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          className={`
            absolute z-20 mt-2 w-full min-w-[220px] rounded-2xl border border-gray-200 bg-white shadow-xl
            p-3 max-h-72 overflow-auto
            ${menuClassName}
          `}
        >
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`
                  w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-gray-900
                  ${optionClassName}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export interface Task {
  id: number
  name: string
  status: string | null
  priority: string | null
  task_type: string | null
  task_category: string
  description: string | null
  due_date: string | null
  trackedHours?: number
}

export interface Project {
  id: number
  name: string
  status: string
  billing_type: string
  clients: {
    id: number
    first_name: string | null
    last_name: string | null
    company_name: string | null
  } | null
}

interface ProjectCardProps {
  project: Project
  onLogTime: (projectId: number, projectName: string, task: Task) => void
}

export default function ProjectCard({ project, onLogTime }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXTERNAL' | 'INTERNAL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'TODO' | 'DONE' | 'BLOCKED' | 'ALL'>('ACTIVE')

  const STATUS_OPTIONS = [
    { value: 'DONE', label: 'Done' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'ARCHIVE', label: 'Archive' },
    { value: 'READY_FOR_INTERNAL_REVIEW', label: 'Ready For Internal Review' },
    { value: 'CLIENT_REVIEW', label: 'Client Review' },
    { value: 'RECURRING', label: 'Recurring' },
    { value: 'BLOCKED', label: 'Blocked' },
    { value: 'TODO', label: 'To Do' },
    { value: 'INVESTIGATION', label: 'Investigation' },
  ] as const

  const PRIORITY_OPTIONS = [
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
    { value: 'CRITICAL', label: 'Critical' },
  ] as const

  const clientName = project.clients?.company_name || 
    (project.clients?.first_name && project.clients?.last_name 
      ? `${project.clients.first_name} ${project.clients.last_name}`
      : null)

  useEffect(() => {
    if (isExpanded && !hasLoaded) {
      loadTasks()
    }
  }, [isExpanded])

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const pageSize = 1000
      let allTasks: Task[] = []
      let allTime: { task_id: number; hours: number | null }[] = []

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', project.id)
          .order('id', { ascending: true })
          .range(from, from + pageSize - 1)

        if (error) throw error
        if (!data || data.length === 0) break
        allTasks = allTasks.concat(data as Task[])
        if (data.length < pageSize) break
      }

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from('time_tracking')
          .select('task_id, hours')
          .eq('project_id', project.id)
          .order('id', { ascending: true })
          .range(from, from + pageSize - 1)

        if (error) throw error
        if (!data || data.length === 0) break
        allTime = allTime.concat(data as { task_id: number; hours: number | null }[])
        if (data.length < pageSize) break
      }

      const hoursByTask = new Map<number, number>()
      allTime.forEach((entry) => {
        const hours = Number(entry.hours || 0)
        const current = hoursByTask.get(entry.task_id) || 0
        hoursByTask.set(entry.task_id, current + hours)
      })

      const enrichedTasks = allTasks
        .map((task) => ({
          ...task,
          trackedHours: hoursByTask.get(task.id) || 0,
        }))
        .sort((a, b) => b.id - a.id)

      setTasks(enrichedTasks)
      setHasLoaded(true)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
      case 'Paused':
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
      case 'Archived':
        return 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20'
      default:
        return 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20'
    }
  }

  const normalizeKey = (value: string | null) => {
    if (!value) return ''
    return value
      .toString()
      .trim()
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .toUpperCase()
  }

  const findStatusOption = (status: string | null) => {
    const key = normalizeKey(status)
    return STATUS_OPTIONS.find(
      (option) =>
        normalizeKey(option.value) === key || normalizeKey(option.label) === key
    )
  }

  const findPriorityOption = (priority: string | null) => {
    const key = normalizeKey(priority)
    return PRIORITY_OPTIONS.find(
      (option) =>
        normalizeKey(option.value) === key || normalizeKey(option.label) === key
    )
  }

  const getStatusLabel = (status: string | null) => {
    const option = findStatusOption(status)
    if (option) return option.label
    return status ? status.toString() : ''
  }

  const getTaskStatusStyle = (_status: string | null) => {
    return 'bg-[rgb(235_235_240)] text-gray-700'
  }

  const getPriorityLabel = (priority: string | null) => {
    const option = findPriorityOption(priority)
    if (option) return option.label
    return priority ? priority.toString() : ''
  }

  const getPriorityStyle = (priority: string | null) => {
    const key = normalizeKey(getPriorityLabel(priority))
    switch (key) {
      case 'HIGH':
        return 'bg-[#D94B4B] text-white'
      case 'CRITICAL':
        return 'bg-[#B54242] text-white'
      case 'MEDIUM':
        return 'bg-[#6C7C8C] text-white'
      case 'LOW':
      default:
        return 'bg-[#6DBF6D] text-white'
    }
  }

  const updateTaskField = async (
    taskId: number,
    updates: Partial<Pick<Task, 'status' | 'priority'>>,
    previousTask: Task
  ) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating task:', error)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? previousTask : t)))
    }
  }

  const isActiveStatus = (status: string | null) => {
    const key = normalizeKey(status)
    return (
      key === 'TODO' ||
      key === 'TO DO' ||
      key === 'IN PROGRESS' ||
      key === 'READY FOR INTERNAL REVIEW' ||
      key === 'CLIENT REVIEW' ||
      key === 'INVESTIGATION' ||
      key === 'RECURRING'
    )
  }

  const filteredTasks = tasks.filter((task) => {
    if (typeFilter === 'EXTERNAL' && normalizeKey(task.task_type) !== 'EXTERNAL') return false
    if (typeFilter === 'INTERNAL' && normalizeKey(task.task_type) !== 'INTERNAL') return false

    const statusKey = normalizeKey(task.status)
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'ACTIVE') return isActiveStatus(task.status)
    if (statusFilter === 'TODO') return statusKey === 'TODO' || statusKey === 'TO DO'
    if (statusFilter === 'DONE') return statusKey === 'DONE'
    if (statusFilter === 'BLOCKED') return statusKey === 'BLOCKED'
    return true
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Project Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8">
            {isExpanded ? (
              <ChevronDown className={`w-3.5 h-3.5 ${project.status === 'Active' ? 'text-cyan-600' : 'text-gray-500'}`} />
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 ${project.status === 'Active' ? 'text-cyan-600' : 'text-gray-500'}`} />
            )}
          </div>
          
          <h3 className="text-sm font-semibold text-gray-900">
            P-{project.id} {project.name}
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap ${getStatusStyle(project.status)}`}>
            {project.status}
          </span>
        </div>
      </button>

      {/* Expanded Content - Tasks */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Loading tasks...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-visible">
              <div className="px-4 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 p-1">
                  {(['ALL', 'EXTERNAL', 'INTERNAL'] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setTypeFilter(value)}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-xl transition-colors ${
                        typeFilter === value
                          ? 'bg-[rgb(10_194_255)] text-white'
                          : 'text-gray-700 hover:bg-white'
                      }`}
                    >
                      {value === 'ALL' ? 'All' : value === 'EXTERNAL' ? 'External' : 'Internal'}
                    </button>
                  ))}
                </div>

                <div className="inline-flex items-center gap-2">
                  {([
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'TODO', label: 'To Do' },
                    { value: 'DONE', label: 'Done' },
                    { value: 'BLOCKED', label: 'Blocked' },
                    { value: 'ALL', label: 'All' },
                  ] as const).map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setStatusFilter(item.value)}
                      className={`px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-colors border ${
                        statusFilter === item.value
                          ? 'bg-[rgb(10_194_255)] text-white border-[rgb(10_194_255)]'
                          : 'text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="ml-auto text-[12px] font-medium text-gray-500 whitespace-nowrap">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                </div>
              </div>
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No tasks yet</p>
                  <p className="text-sm text-gray-500 text-center">
                    Create tasks for this project to start tracking time.
                  </p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-6">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No tasks found</p>
                  <p className="text-sm text-gray-500 text-center">
                    Try changing the filters to see tasks.
                  </p>
                </div>
              ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Priority
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28 whitespace-nowrap">
                      Time Tracking
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-24">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-[12px] font-medium text-gray-900 truncate">
                          T-{task.id} {task.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CustomSelect
                          value={findStatusOption(task.status)?.value ?? ''}
                          options={STATUS_OPTIONS}
                          onChange={(nextValue) => {
                            const nextStatus = nextValue || null
                            const previousTask = { ...task }
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id ? { ...t, status: nextStatus } : t
                              )
                            )
                            updateTaskField(task.id, { status: nextStatus }, previousTask)
                          }}
                          optionClassName="bg-[rgb(235_235_240)] text-gray-600"
                          buttonClassName={`
                            px-3 py-1.5 text-[12px] font-medium rounded-md whitespace-nowrap text-gray-900
                            ${getTaskStatusStyle(task.status)}
                          `}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <CustomSelect
                          value={findPriorityOption(task.priority)?.value ?? ''}
                          options={PRIORITY_OPTIONS}
                          onChange={(nextValue) => {
                            const nextPriority = nextValue || null
                            const previousTask = { ...task }
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id ? { ...t, priority: nextPriority } : t
                              )
                            )
                            updateTaskField(task.id, { priority: nextPriority }, previousTask)
                          }}
                          optionClassName="bg-[rgb(235_235_240)] text-gray-600"
                          buttonClassName={`
                            px-3 py-1.5 text-[12px] font-medium rounded-md whitespace-nowrap text-gray-900
                            ${getPriorityStyle(task.priority)}
                          `}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[12px] font-medium text-gray-900">
                          {(task.trackedHours || 0).toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const typeKey = normalizeKey(task.task_type)
                          const typeLabel = typeKey === 'INTERNAL'
                            ? 'Internal'
                            : typeKey === 'EXTERNAL'
                              ? 'External'
                              : 'Unknown'
                          const typeStyle = typeKey === 'INTERNAL'
                            ? 'bg-gray-100 text-gray-700 ring-1 ring-gray-500/20'
                            : typeKey === 'EXTERNAL'
                              ? 'bg-[rgb(10_194_255)] text-white ring-1 ring-[rgb(10_194_255)]'
                              : 'bg-gray-100 text-gray-700 ring-1 ring-gray-500/20'
                          return (
                            <span
                              className={`
                                inline-flex items-center px-3 py-1.5 text-[12px] font-medium rounded-md whitespace-nowrap text-gray-900
                                ${typeStyle}
                              `}
                            >
                              {typeLabel}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onLogTime(project.id, project.name, task)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-[rgb(248_249_250)] hover:bg-[rgb(238_239_240)] rounded-md border border-[rgb(220_222_224)] transition-colors shadow-sm shadow-[rgb(248_249_250)]/40 whitespace-nowrap"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Log Time
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
