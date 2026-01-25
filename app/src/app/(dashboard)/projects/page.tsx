'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, FolderOpen } from 'lucide-react'
import ProjectCard, { Project, Task } from '@/components/projects/ProjectCard'
import LogTimeModal from '@/components/projects/LogTimeModal'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'

export default function ProjectsPage() {
  const { employee, isLoading: isLoadingEmployee, error: employeeError } = useEmployee()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Active')
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [logTimeModal, setLogTimeModal] = useState<{
    isOpen: boolean
    projectId: number
    projectName: string
    task: Task | null
  }>({
    isOpen: false,
    projectId: 0,
    projectName: '',
    task: null,
  })

  useEffect(() => {
    loadProjects()
  }, [statusFilter])

  const loadProjects = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          billing_type,
          clients (
            id,
            first_name,
            last_name,
            company_name
          )
        `)
        .order('id', { ascending: false })
      
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter)
      }
      
      const { data, error: queryError } = await query
      
      if (queryError) {
        console.error('Query error:', queryError)
        throw queryError
      }
      
      setProjects(data || [])
    } catch (err) {
      console.error('Error loading projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogTime = (projectId: number, projectName: string, task: Task) => {
    setLogTimeModal({
      isOpen: true,
      projectId,
      projectName,
      task,
    })
  }

  const handleCloseModal = () => {
    setLogTimeModal({
      isOpen: false,
      projectId: 0,
      projectName: '',
      task: null,
    })
  }

  const handleSubmitTime = async (data: {
    task_id: number
    project_id: number
    employee_id: number
    date: string
    hours: number
    description: string
  }) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('time_tracking')
      .insert(data)
    
    if (error) {
      console.error('Error logging time:', error)
      throw error
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `P-${project.id}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clients?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clients?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clients?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects by name, ID or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {['Active', 'Paused', 'Archived', 'All'].map((status) => (
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
          Showing <span className="font-medium text-gray-700">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading projects...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadProjects}
            className="px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
            <p className="text-gray-500 text-center max-w-sm">
              {searchQuery 
                ? 'Try adjusting your search query or filters.' 
                : 'No projects match the current filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onLogTime={handleLogTime}
            />
          ))}
        </div>
      )}

      {/* Log Time Modal */}
      {logTimeModal.task && (
        <LogTimeModal
          isOpen={logTimeModal.isOpen}
          onClose={handleCloseModal}
          projectId={logTimeModal.projectId}
          projectName={logTimeModal.projectName}
          task={logTimeModal.task}
          employeeId={employee?.id || null}
          onSubmit={handleSubmitTime}
        />
      )}
    </div>
  )
}
