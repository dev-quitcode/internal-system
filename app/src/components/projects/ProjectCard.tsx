'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Clock, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
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

  const getTaskStatusStyle = (status: string | null) => {
    switch (status) {
      case 'DONE':
        return 'bg-emerald-50 text-emerald-700'
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700'
      case 'TODO':
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getPriorityStyle = (priority: string | null) => {
    switch (priority) {
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-red-50 text-red-700'
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700'
      case 'LOW':
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatStatus = (status: string | null) => {
    if (!status) return 'To Do'
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Project Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`
            flex items-center justify-center w-9 h-9 rounded-lg
            ${project.status === 'Active' ? 'bg-cyan-50' : 'bg-gray-100'}
          `}>
            {isExpanded ? (
              <ChevronDown className={`w-4 h-4 ${project.status === 'Active' ? 'text-cyan-600' : 'text-gray-500'}`} />
            ) : (
              <ChevronRight className={`w-4 h-4 ${project.status === 'Active' ? 'text-cyan-600' : 'text-gray-500'}`} />
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-cyan-600">P-{project.id}</span>
            <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasLoaded && tasks.length > 0 && (
            <span className="text-sm text-gray-500">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getStatusStyle(project.status)}`}>
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
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No tasks yet</p>
              <p className="text-sm text-gray-500 text-center">
                Create tasks for this project to start tracking time.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">
                            T-{task.id}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{task.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getTaskStatusStyle(task.status)}`}>
                          {formatStatus(task.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityStyle(task.priority)}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`
                          inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full
                          ${task.task_type === 'INTERNAL' 
                            ? 'bg-gray-100 text-gray-700' 
                            : 'bg-cyan-50 text-cyan-700'}
                        `}>
                          {task.task_type === 'INTERNAL' ? (
                            'Internal'
                          ) : (
                            <>
                              <ExternalLink className="w-3 h-3" />
                              External
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onLogTime(project.id, project.name, task)
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                          Log Time
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
