'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, MessageSquarePlus } from 'lucide-react'
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

export default function AcademyPage() {
  const { employee, isLoading } = useEmployee()
  const [assignmentPages, setAssignmentPages] = useState<AssignmentPage[]>([])
  const [selectedAssignmentPageId, setSelectedAssignmentPageId] = useState<number | null>(null)
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

  const progressPercent = useMemo(() => {
    if (!assignmentPages.length) return 0
    const completed = assignmentPages.filter((page) => page.status === 'done').length
    return Math.round((completed / assignmentPages.length) * 100)
  }, [assignmentPages])

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
          program:academy_programs ( id, name, description )
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
    if (!selectedAssignmentPageId && sorted.length > 0) {
      setSelectedAssignmentPageId(sorted[0].id)
    }
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
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-120px)] overflow-hidden min-h-0">
            <div className={`lg:col-span-9 h-full min-h-0 ${selectedAssignmentPage ? '' : 'lg:col-span-12'}`}>
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm h-full min-h-0 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                  <aside className="lg:col-span-4 h-full min-h-0 border-r border-gray-100">
                    <div className="p-4 border-b">
                      <div className="text-[13px] font-semibold text-gray-900">Developer Academy</div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-[rgb(10_194_255)]"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[10px] text-gray-500">{progressPercent}% completed</div>
                      <div className="mt-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Content
                      </div>
                    </div>
                    <div className="p-3 pb-10 overflow-y-auto pr-1 h-[calc(100%-92px)]">
                      {groupedPrograms.map((group) => (
                        <div key={group.assignment.id} className="space-y-1">
                          {group.pages.map((page) => (
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
                              <span className="text-[10px] text-gray-500 uppercase">
                                {statusLabel(page.status)}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
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
                          {selectedAssignmentPage.page.category ? ` • ${selectedAssignmentPage.page.category.name}` : ''}
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
                          <div className="text-[12px] text-gray-500">Score: {selectedAssignmentPage.score}</div>
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
