'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  ready_for_review: 'Ready for review',
  revision_needed: 'Revision needed',
  done: 'Done',
}

type Program = {
  id: number
  name: string
  description: string | null
}

type ProgramPage = {
  id: number
  page_id: number
  order_index: number
  is_required: boolean
  page: {
    id: number
    title: string
    page_type: 'THEORY' | 'TASK'
    category: { id: number; name: string } | null
  }
}

type AssignmentProgram = {
  id: number
  program_id: number
  status: string
  assigned_at: string
  program: {
    id: number
    name: string
    description: string | null
  }
}

type AssignmentPage = {
  id: number
  assignment_id: number
  page_id: number
  status: string
  score: number | null
  updated_at: string
  assignment: AssignmentProgram
  page: {
    id: number
    title: string
    page_type: 'THEORY' | 'TASK'
    category: { id: number; name: string } | null
  }
}

type EmployeeInfo = {
  id: number
  first_name: string | null
  last_name: string | null
  email: string
}

export default function AcademyManagePage() {
  useEmployee()
  const searchParams = useSearchParams()
  const employeeIdParam = searchParams.get('employeeId')
  const employeeId = employeeIdParam ? Number(employeeIdParam) : null
  const isEmployeeIdValid = Number.isFinite(employeeId)

  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null)
  const [assignmentPages, setAssignmentPages] = useState<AssignmentPage[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [programPages, setProgramPages] = useState<ProgramPage[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const [selectedPageIds, setSelectedPageIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPages, setIsLoadingPages] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const groupedPrograms = useMemo(() => {
    const groups = new Map<number, { assignment: AssignmentProgram; pages: AssignmentPage[] }>()
    assignmentPages.forEach((page) => {
      const assignmentId = page.assignment.id
      const group = groups.get(assignmentId)
      if (group) {
        group.pages.push(page)
      } else {
        groups.set(assignmentId, { assignment: page.assignment, pages: [page] })
      }
    })
    return Array.from(groups.values())
  }, [assignmentPages])

  const assignedPageIdsForProgram = useMemo(() => {
    if (!selectedProgramId) return new Set<number>()
    return new Set(
      assignmentPages
        .filter((page) => page.assignment.program_id === selectedProgramId)
        .map((page) => page.page_id)
    )
  }, [assignmentPages, selectedProgramId])

  useEffect(() => {
    if (!isEmployeeIdValid || !employeeId) {
      setIsLoading(false)
      return
    }

    const loadInitial = async () => {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()

      try {
        const [{ data: employeeRow, error: employeeError }, { data: assignmentRows }, { data: programsRows }] =
          await Promise.all([
            supabase
              .from('employees')
              .select('id, first_name, last_name, email')
              .eq('id', employeeId)
              .maybeSingle(),
            supabase
              .from('academy_assignment_pages')
              .select(
                `
                id,
                assignment_id,
                page_id,
                status,
                score,
                updated_at,
                assignment:academy_assignments!inner (
                  id,
                  program_id,
                  status,
                  assigned_at,
                  program:academy_programs ( id, name, description )
                ),
                page:academy_pages ( id, title, page_type, category:academy_categories ( id, name ) )
              `
              )
              .eq('assignment.employee_id', employeeId)
              .order('id', { ascending: true }),
            supabase.from('academy_programs').select('id, name, description').order('id', { ascending: true }),
          ])

        if (employeeError) throw employeeError

        setEmployeeInfo((employeeRow || null) as EmployeeInfo | null)
        setAssignmentPages((assignmentRows || []) as AssignmentPage[])
        setPrograms((programsRows || []) as Program[])
      } catch (err) {
        console.error('Failed to load academy data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load academy data')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitial()
  }, [employeeId, isEmployeeIdValid])

  useEffect(() => {
    if (!selectedProgramId || !isEmployeeIdValid || !employeeId) return

    const loadProgramPages = async () => {
      setIsLoadingPages(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('academy_program_pages')
        .select(
          `
          id,
          page_id,
          order_index,
          is_required,
          page:academy_pages ( id, title, page_type, category:academy_categories ( id, name ) )
        `
        )
        .eq('program_id', selectedProgramId)
        .order('order_index', { ascending: true })

      const rows = (data || []) as ProgramPage[]
      setProgramPages(rows)
      const defaultSelection = new Set(
        rows
          .filter((row) => row.is_required && !assignedPageIdsForProgram.has(row.page_id))
          .map((row) => row.page_id)
      )
      setSelectedPageIds(defaultSelection)
      setIsLoadingPages(false)
    }

    loadProgramPages()
  }, [selectedProgramId, employeeId, isEmployeeIdValid, assignedPageIdsForProgram])

  const handleTogglePage = (pageId: number) => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const selectable = programPages
      .filter((row) => !assignedPageIdsForProgram.has(row.page_id))
      .map((row) => row.page_id)
    setSelectedPageIds(new Set(selectable))
  }

  const handleSelectRequired = () => {
    const selectable = programPages
      .filter((row) => row.is_required && !assignedPageIdsForProgram.has(row.page_id))
      .map((row) => row.page_id)
    setSelectedPageIds(new Set(selectable))
  }

  const handleClearSelection = () => {
    setSelectedPageIds(new Set())
  }

  const handleAssignPages = async () => {
    if (!employeeId || !selectedProgramId) return
    if (selectedPageIds.size === 0) {
      setNotice('Select at least one page to assign.')
      return
    }

    setIsAssigning(true)
    setNotice(null)
    setError(null)

    const supabase = createClient()

    try {
      const { data: existingAssignment } = await supabase
        .from('academy_assignments')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('program_id', selectedProgramId)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      let assignmentId = existingAssignment?.id

      if (!assignmentId) {
        const { data: created, error: createError } = await supabase
          .from('academy_assignments')
          .insert({
            employee_id: employeeId,
            program_id: selectedProgramId,
            status: 'not_started',
            assigned_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (createError) throw createError
        assignmentId = created?.id
      }

      if (!assignmentId) throw new Error('Failed to create assignment')

      const pagesToInsert = Array.from(selectedPageIds)
        .filter((pageId) => !assignedPageIdsForProgram.has(pageId))
        .map((pageId) => ({
          assignment_id: assignmentId,
          page_id: pageId,
          status: 'not_started',
        }))

      if (!pagesToInsert.length) {
        setNotice('All selected pages are already assigned.')
        setIsAssigning(false)
        return
      }

      const { error: insertError } = await supabase.from('academy_assignment_pages').insert(pagesToInsert)
      if (insertError) throw insertError

      setNotice('Pages assigned successfully.')
      setSelectedPageIds(new Set())

      const { data: assignmentRows } = await supabase
        .from('academy_assignment_pages')
        .select(
          `
          id,
          assignment_id,
          page_id,
          status,
          score,
          updated_at,
          assignment:academy_assignments!inner (
            id,
            program_id,
            status,
            assigned_at,
            program:academy_programs ( id, name, description )
          ),
          page:academy_pages ( id, title, page_type, category:academy_categories ( id, name ) )
        `
        )
        .eq('assignment.employee_id', employeeId)
        .order('id', { ascending: true })

      setAssignmentPages((assignmentRows || []) as AssignmentPage[])
    } catch (err) {
      console.error('Failed to assign pages:', err)
      setError(err instanceof Error ? err.message : 'Failed to assign pages')
    } finally {
      setIsAssigning(false)
    }
  }

  if (!isEmployeeIdValid || !employeeId) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
          Select a team member to view academy progress.
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-[rgb(10_194_255)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const employeeName = employeeInfo
    ? `${employeeInfo.first_name ?? ''} ${employeeInfo.last_name ?? ''}`.trim()
    : 'Unknown employee'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] text-gray-500">Academy progress</div>
          <h1 className="text-[20px] font-semibold text-gray-900">
            {employeeName || employeeInfo?.email || 'Employee'}
          </h1>
          {employeeInfo?.email && <div className="text-[12px] text-gray-500">{employeeInfo.email}</div>}
        </div>
        <Link
          href="/team"
          className="inline-flex items-center justify-center px-3 py-2 text-[12px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Back to team
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-[12px] text-red-600">{error}</div>
      )}

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-[12px] text-emerald-700">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="text-[14px] font-semibold text-gray-900 mb-4">Progress overview</div>
            {assignmentPages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-[12px] text-gray-500">
                This employee has no assigned academy pages yet.
              </div>
            ) : (
              <div className="space-y-4">
                {groupedPrograms.map((group) => {
                  const total = group.pages.length
                  const done = group.pages.filter((page) => page.status === 'done').length
                  const progress = total ? Math.round((done / total) * 100) : 0
                  return (
                    <div key={group.assignment.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[13px] font-semibold text-gray-900">
                            {group.assignment.program.name}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {group.assignment.program.description || 'No description'}
                          </div>
                        </div>
                        <div className="text-[12px] font-semibold text-gray-700">{progress}%</div>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-[rgb(10_194_255)]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-3 text-[11px] text-gray-500">
                        {done} of {total} completed
                      </div>
                      <div className="mt-4 space-y-2">
                        {group.pages.map((page) => (
                          <div key={page.id} className="flex items-center justify-between text-[12px]">
                            <div>
                              <div className="text-gray-900">{page.page.title}</div>
                              <div className="text-[11px] text-gray-500">
                                {page.page.page_type === 'TASK' ? 'Task' : 'Theory'}
                                {page.page.category ? ` • ${page.page.category.name}` : ''}
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold text-gray-500 uppercase">
                              {STATUS_LABELS[page.status] ?? page.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="text-[14px] font-semibold text-gray-900 mb-4">Assign academy pages</div>
            <label className="text-[11px] font-semibold text-gray-500">Program</label>
            <select
              value={selectedProgramId ?? ''}
              onChange={(event) => setSelectedProgramId(Number(event.target.value) || null)}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            >
              <option value="">Select program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>

            {selectedProgramId ? (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
                    type="button"
                  >
                    Select all
                  </button>
                  <button
                    onClick={handleSelectRequired}
                    className="px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
                    type="button"
                  >
                    Required only
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
                    type="button"
                  >
                    Clear
                  </button>
                </div>

                {isLoadingPages ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-[rgb(10_194_255)] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : programPages.length === 0 ? (
                  <div className="mt-4 text-[12px] text-gray-500">No pages found for this program.</div>
                ) : (
                  <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {programPages.map((row) => {
                      const isAlreadyAssigned = assignedPageIdsForProgram.has(row.page_id)
                      const isSelected = selectedPageIds.has(row.page_id)
                      return (
                        <label
                          key={row.id}
                          className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-[12px] transition-colors ${
                            isAlreadyAssigned
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                              : isSelected
                                ? 'border-cyan-200 bg-cyan-50'
                                : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            disabled={isAlreadyAssigned}
                            checked={isAlreadyAssigned ? true : isSelected}
                            onChange={() => handleTogglePage(row.page_id)}
                          />
                          <div className="flex-1">
                            <div className="text-gray-900 font-semibold">{row.page.title}</div>
                            <div className="text-[11px] text-gray-500">
                              {row.page.page_type === 'TASK' ? 'Task' : 'Theory'}
                              {row.page.category ? ` • ${row.page.category.name}` : ''}
                              {row.is_required ? ' • Required' : ''}
                            </div>
                          </div>
                          {isAlreadyAssigned && (
                            <span className="text-[10px] font-semibold uppercase">Assigned</span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}

                <button
                  onClick={handleAssignPages}
                  disabled={isAssigning || selectedPageIds.size === 0}
                  className="mt-4 w-full rounded-lg bg-[rgb(10_194_255)] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[rgb(8_174_230)] disabled:opacity-60"
                >
                  {isAssigning ? 'Assigning...' : `Assign ${selectedPageIds.size} page(s)`}
                </button>
              </div>
            ) : (
              <div className="mt-4 text-[12px] text-gray-500">Choose a program to assign pages.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
