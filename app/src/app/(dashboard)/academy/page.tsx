'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CodeSquare,
  GraduationCap,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { format } from 'date-fns'

type AssignmentProgram = {
  id: number
  program_id: number
  status: string
  assigned_at: string
  program: {
    id: number
    name: string
    description: string | null
    type_id: number | null
    type?: { id: number; icon: string | null } | null
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
    content?: any
  }
}

type CommentRow = {
  id: number
  comment: string
  created_at: string
  author: { first_name: string | null; last_name: string | null; email: string } | null
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'ready_for_review', label: 'Ready for review' },
  { value: 'revision_needed', label: 'Revision needed' },
  { value: 'done', label: 'Done' },
] as const

function statusLabel(value: string) {
  const option = STATUS_OPTIONS.find((item) => item.value === value)
  return option?.label ?? value
}

function progressLabel(pages: AssignmentPage[]) {
  if (!pages.length) return '0/0 completed'
  const completed = pages.filter((page) => page.status === 'done').length
  const percent = Math.round((completed / pages.length) * 100)
  return `${completed}/${pages.length} completed • ${percent}%`
}

const academyIcons = [
  { value: 'graduation-cap', icon: GraduationCap },
  { value: 'book-open', icon: BookOpen },
  { value: 'code-square', icon: CodeSquare },
  { value: 'users', icon: Users },
  { value: 'target', icon: Target },
  { value: 'briefcase', icon: Briefcase },
  { value: 'sparkles', icon: Sparkles },
] as const

function getAcademyIcon(iconValue: string | null | undefined) {
  const match = academyIcons.find((item) => item.value === iconValue)
  return match?.icon ?? GraduationCap
}

function progressStats(pages: AssignmentPage[]) {
  const total = pages.length
  const completed = pages.filter((page) => page.status === 'done').length
  const percent = total ? Math.round((completed / total) * 100) : 0
  return { total, completed, percent }
}

export default function AcademyPage() {
  const { employee, isLoading } = useEmployee()
  const [assignmentPages, setAssignmentPages] = useState<AssignmentPage[]>([])
  const [selectedAssignmentPageId, setSelectedAssignmentPageId] = useState<number | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<CommentRow[]>([])
  const [isCommenting, setIsCommenting] = useState(false)
  const [commentBoxHeight, setCommentBoxHeight] = useState(40)
  const isResizingComment = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
      Image,
      Youtube.configure({ width: 640, height: 360 }),
    ],
    editable: false,
    content: {},
  })

  const selectedAssignmentPage = useMemo(
    () => assignmentPages.find((page) => page.id === selectedAssignmentPageId) ?? null,
    [assignmentPages, selectedAssignmentPageId]
  )

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

  const selectedProgramGroup = useMemo(() => {
    if (selectedProgramId === null) return null
    return groupedPrograms.find((group) => group.assignment.program_id === selectedProgramId) ?? null
  }, [groupedPrograms, selectedProgramId])

  const visiblePages = useMemo(() => {
    if (!selectedProgramGroup) return []
    return selectedProgramGroup.pages
  }, [selectedProgramGroup])

  const progressPercent = useMemo(() => {
    if (!visiblePages.length) return 0
    const completed = visiblePages.filter((page) => page.status === 'done').length
    return Math.round((completed / visiblePages.length) * 100)
  }, [visiblePages])

  useEffect(() => {
    if (employee) {
      loadAssignments()
    }
  }, [employee])

  useEffect(() => {
    if (!selectedAssignmentPage) return
    editor?.commands.setContent(selectedAssignmentPage.page?.content ?? {})
    loadComments(selectedAssignmentPage.id)
  }, [selectedAssignmentPage?.id, editor])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingComment.current) return
      const delta = event.movementY * -1
      setCommentBoxHeight((prev) => {
        const next = Math.min(160, Math.max(40, prev + delta))
        return next
      })
    }

    const handleMouseUp = () => {
      isResizingComment.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const loadAssignments = async () => {
    if (!employee) return
    setIsLoadingAssignments(true)
    const supabase = createClient()

    const { data } = await supabase
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
          program:academy_programs ( id, name, description, type_id, type:academy_types ( id, icon ) )
        ),
        page:academy_pages ( id, title, page_type, content, category:academy_categories ( id, name ) )
      `
      )
      .eq('assignment.employee_id', employee.id)
      .order('id', { ascending: true })

    const rows = (data || []) as AssignmentPage[]

    const programIds = Array.from(new Set(rows.map((row) => row.assignment.program_id)))
    const orderMap = new Map<string, number>()
    if (programIds.length) {
      const { data: programPages } = await supabase
        .from('academy_program_pages')
        .select('program_id, page_id, order_index')
        .in('program_id', programIds)

      ;(programPages || []).forEach((row) => {
        const key = `${row.program_id}:${row.page_id}`
        orderMap.set(key, row.order_index)
      })
    }

    const sorted = [...rows].sort((a, b) => {
      const aOrder = orderMap.get(`${a.assignment.program_id}:${a.page_id}`) ?? 9999
      const bOrder = orderMap.get(`${b.assignment.program_id}:${b.page_id}`) ?? 9999
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.id - b.id
    })

    setAssignmentPages(sorted)
    setIsLoadingAssignments(false)
  }

  const loadComments = async (assignmentPageId: number) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('academy_page_comments')
      .select('id, comment, created_at, author:employees ( first_name, last_name, email )')
      .eq('assignment_page_id', assignmentPageId)
      .order('created_at', { ascending: true })

    setComments((data || []) as CommentRow[])
  }

  const updateStatus = async (assignmentPage: AssignmentPage, status: string) => {
    const supabase = createClient()
    setAssignmentPages((prev) =>
      prev.map((item) => (item.id === assignmentPage.id ? { ...item, status } : item))
    )
    const { error } = await supabase
      .from('academy_assignment_pages')
      .update({ status })
      .eq('id', assignmentPage.id)

    if (error) {
      setAssignmentPages((prev) =>
        prev.map((item) => (item.id === assignmentPage.id ? assignmentPage : item))
      )
    }
  }

  const submitComment = async () => {
    if (!selectedAssignmentPage || !commentText.trim() || !employee) return
    setIsCommenting(true)
    const supabase = createClient()
    await supabase.from('academy_page_comments').insert({
      assignment_page_id: selectedAssignmentPage.id,
      comment: commentText.trim(),
      author_employee_id: employee.id,
    })
    setCommentText('')
    setIsCommenting(false)
    loadComments(selectedAssignmentPage.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-[rgb(10_194_255)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      {isLoadingAssignments ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[rgb(10_194_255)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : assignmentPages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500 text-[12px]">
          You have no assigned academy pages yet.
        </div>
      ) : selectedProgramId === null ? (
        <div className="mx-auto w-full max-w-7xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-[16px] font-semibold text-gray-900 tracking-tight">Choose an academy</h1>
            <p className="text-[12px] text-gray-500 mt-2">
              Select your assigned path to start or continue your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groupedPrograms.map((group) => {
              const { completed, total, percent } = progressStats(group.pages)
              const Icon = getAcademyIcon(group.assignment.program.type?.icon)
              const isActive = percent > 0 && percent < 100
              const isCompleted = percent === 100 && total > 0
              const statusLabelText = isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Not Started'
              const statusClass = isCompleted
                ? 'bg-green-100 text-green-700'
                : isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              const fillColor = isActive || isCompleted ? 'bg-blue-500' : 'bg-purple-500'
              const buttonStyle = isActive || isCompleted
                ? 'bg-gray-900 text-white hover:bg-black'
                : 'bg-white text-gray-900 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'

              return (
                <div
                  key={group.assignment.id}
                  className="relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm transition-shadow hover:shadow-md hover:border-gray-200"
                >
                  <div className={`absolute top-6 right-6 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${statusClass}`}>
                    {statusLabelText}
                  </div>
                  <div
                    className={`h-[46px] w-[46px] mb-5 flex items-center justify-center rounded-xl ${
                      isActive || isCompleted ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-[13px] font-semibold text-gray-900 mb-2">{group.assignment.program.name}</h2>
                  <p className="text-[12px] text-gray-500 leading-5 mb-6">
                    {group.assignment.program.description || 'Open academy pages'}
                  </p>

                  <div className="mb-6">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-[11px] font-semibold text-gray-900">Total Completion</span>
                      <span className="text-[12px] font-semibold text-gray-900">{percent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${fillColor}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 mt-2 block">
                      {completed} of {total} modules completed
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProgramId(group.assignment.program_id)
                      setSelectedAssignmentPageId(group.pages[0]?.id ?? null)
                    }}
                    className={`w-full py-3 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors ${buttonStyle}`}
                  >
                    {isActive || isCompleted ? 'Continue Learning' : 'Start Academy'}
                    {isActive || isCompleted ? <ArrowRight className="w-4 h-4" /> : null}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-120px)] overflow-hidden min-h-0">
          <div className={`lg:col-span-9 h-full min-h-0 ${selectedAssignmentPage ? '' : 'lg:col-span-12'}`}>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm h-full min-h-0 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                <aside className="lg:col-span-4 h-full min-h-0 border-r border-gray-100">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-semibold text-gray-900">
                        {selectedProgramGroup?.assignment.program.name ?? 'Academy'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProgramId(null)
                          setSelectedAssignmentPageId(null)
                        }}
                        className="text-[11px] text-gray-400 hover:text-gray-700"
                      >
                        Change
                      </button>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-[rgb(10_194_255)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-gray-500">{progressPercent}% completed</div>
                    <div className="mt-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Content</div>
                  </div>
                  <div className="p-3 pb-10 overflow-y-auto pr-1 h-[calc(100%-92px)]">
                    <div className="space-y-1">
                      {visiblePages.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => setSelectedAssignmentPageId(page.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-[12px] flex items-center justify-between gap-2 ${
                            selectedAssignmentPageId === page.id
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div>
                            <div className="text-gray-900">{page.page.title}</div>
                            <div className="text-[11px] text-gray-500">
                              {page.page.page_type === 'TASK' ? 'Task' : 'Theory'}
                              {page.page.category ? ` • ${page.page.category.name}` : ''}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-500 uppercase">{statusLabel(page.status)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>

                <section className="lg:col-span-8 h-full min-h-0">
                  <div className="p-8 h-full flex flex-col min-h-0">
                    {selectedAssignmentPage ? (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div>
                            <span className="text-[10px] font-bold text-[rgb(10_194_255)] uppercase tracking-widest">
                              {selectedAssignmentPage.page.page_type === 'TASK' ? 'Task' : 'Theory'}
                              {selectedAssignmentPage.page.category
                                ? ` • ${selectedAssignmentPage.page.category.name}`
                                : ''}
                            </span>
                            <div className="text-[24px] font-bold text-gray-900 mt-1">
                              {selectedAssignmentPage.page.title}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedAssignmentPage.status}
                              onChange={(event) => updateStatus(selectedAssignmentPage, event.target.value)}
                              className="px-4 py-1.5 text-[11px] font-semibold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {selectedAssignmentPage.score !== null && (
                              <div className="text-[12px] text-gray-500">
                                Score: {selectedAssignmentPage.score}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 overflow-y-auto overflow-x-hidden flex-1 pr-1 min-h-0">
                          <div className="min-h-[260px] text-[13px] text-gray-700">
                            <EditorContent editor={editor} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-[12px] text-gray-500">Select a page to view content.</div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {selectedAssignmentPage && (
            <aside className="lg:col-span-3 flex flex-col h-full min-h-0">
              <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm flex flex-col h-full">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-[13px] font-bold text-gray-800">Comments ({comments.length})</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-[12px] text-gray-500">No comments yet.</div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-gray-700">
                            {comment.author?.first_name || comment.author?.last_name
                              ? `${comment.author?.first_name ?? ''} ${comment.author?.last_name ?? ''}`.trim()
                              : comment.author?.email ?? 'User'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {format(new Date(comment.created_at), 'dd.MM.yyyy')}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-600">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t">
                  <div
                    className="w-full h-2 cursor-ns-resize"
                    onMouseDown={() => {
                      isResizingComment.current = true
                    }}
                  />
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    rows={3}
                    placeholder="Add a comment..."
                    className="w-full text-[12px] border border-gray-100 rounded-lg p-2 focus:outline-none focus:border-[rgb(10_194_255)] bg-gray-50 resize-none overflow-y-auto"
                    style={{ height: commentBoxHeight }}
                  />
                  <button
                    type="button"
                    onClick={submitComment}
                    disabled={isCommenting || !commentText.trim()}
                    className="mt-2 w-full text-[12px] bg-gray-900 text-white py-2 rounded-lg font-semibold hover:bg-black disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </>
  )
}
