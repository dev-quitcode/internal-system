'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ClipboardList, MessageSquarePlus, Send } from 'lucide-react'
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
  page_version_id: number
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
  version: {
    id: number
    version_number: number
    content: any
    created_at: string
  } | null
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
  const [submissionText, setSubmissionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<CommentRow[]>([])
  const [isCommenting, setIsCommenting] = useState(false)

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

  useEffect(() => {
    if (employee) {
      loadAssignments()
    }
  }, [employee])

  useEffect(() => {
    if (!selectedAssignmentPage) return
    editor?.commands.setContent(selectedAssignmentPage.version?.content ?? {})
    setSubmissionText('')
    loadSubmission(selectedAssignmentPage.id)
    loadComments(selectedAssignmentPage.id)
  }, [selectedAssignmentPage?.id, editor])

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
        page_version_id,
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
        page:academy_pages ( id, title, page_type, category:academy_categories ( id, name ) ),
        version:academy_page_versions ( id, version_number, content, created_at )
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

  const loadSubmission = async (assignmentPageId: number) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('academy_task_submissions')
      .select('*')
      .eq('assignment_page_id', assignmentPageId)
      .order('created_at', { ascending: false })
      .limit(1)

    const latest = data?.[0] as { content?: { text?: string } } | undefined
    setSubmissionText(latest?.content?.text ?? '')
  }

  const loadComments = async (assignmentPageId: number) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('academy_task_comments')
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

  const submitTask = async () => {
    if (!selectedAssignmentPage || !submissionText.trim()) return
    setIsSubmitting(true)
    const supabase = createClient()
    await supabase.from('academy_task_submissions').insert({
      assignment_page_id: selectedAssignmentPage.id,
      content: { text: submissionText.trim() },
    })
    setIsSubmitting(false)
  }

  const submitComment = async () => {
    if (!selectedAssignmentPage || !commentText.trim() || !employee) return
    setIsCommenting(true)
    const supabase = createClient()
    await supabase.from('academy_task_comments').insert({
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[rgb(10_194_255)]/15 flex items-center justify-center text-[rgb(10_194_255)]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[14px] font-semibold text-gray-900">Academy</h1>
            <p className="text-[12px] text-gray-500">Your assigned learning pages</p>
          </div>
        </div>

        {isLoadingAssignments ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[rgb(10_194_255)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assignmentPages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-500 text-[12px]">
            You have no assigned academy pages yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div className="space-y-4">
              {groupedPrograms.map((group) => (
                <div key={group.assignment.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="text-[12px] font-semibold text-gray-900 mb-1">
                    {group.assignment.program.name}
                  </div>
                  <div className="text-[11px] text-gray-500 mb-3">
                    {group.assignment.program.description || 'No description'}
                  </div>
                  <div className="space-y-1">
                    {group.pages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => setSelectedAssignmentPageId(page.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl border transition-colors text-[12px] flex items-center justify-between gap-2 ${
                          selectedAssignmentPageId === page.id
                            ? 'border-[rgb(10_194_255)] bg-[rgb(10_194_255)]/10'
                            : 'border-gray-200 hover:bg-gray-50'
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
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              {selectedAssignmentPage ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="text-[13px] font-semibold text-gray-900">
                        {selectedAssignmentPage.page.title}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {selectedAssignmentPage.page.page_type === 'TASK' ? 'Task' : 'Theory'}
                        {selectedAssignmentPage.page.category ? ` • ${selectedAssignmentPage.page.category.name}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedAssignmentPage.status}
                        onChange={(event) => updateStatus(selectedAssignmentPage, event.target.value)}
                        className="px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-[rgb(235_235_240)] text-gray-700"
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

                  <div className="border border-gray-200 rounded-xl p-4 min-h-[260px]">
                    <EditorContent editor={editor} />
                  </div>

                  {selectedAssignmentPage.page.page_type === 'TASK' && (
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="text-[12px] font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" /> Submission
                        </div>
                        <textarea
                          value={submissionText}
                          onChange={(event) => setSubmissionText(event.target.value)}
                          rows={6}
                          placeholder="Write your answer..."
                          className="w-full text-[12px] border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[rgb(10_194_255)]/20"
                        />
                        <button
                          type="button"
                          onClick={submitTask}
                          disabled={isSubmitting || !submissionText.trim()}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-lg bg-[rgb(10_194_255)] text-white disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit
                        </button>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="text-[12px] font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <MessageSquarePlus className="w-4 h-4" /> Comments
                        </div>
                        <div className="space-y-3 max-h-52 overflow-auto mb-3">
                          {comments.length === 0 ? (
                            <div className="text-[12px] text-gray-500">No comments yet.</div>
                          ) : (
                            comments.map((comment) => (
                              <div key={comment.id} className="text-[12px] text-gray-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-900 font-medium">
                                    {comment.author?.first_name || comment.author?.last_name
                                      ? `${comment.author?.first_name ?? ''} ${comment.author?.last_name ?? ''}`.trim()
                                      : comment.author?.email ?? 'User'}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {format(new Date(comment.created_at), 'dd.MM.yyyy')}
                                  </span>
                                </div>
                                <div className="text-gray-600">{comment.comment}</div>
                              </div>
                            ))
                          )}
                        </div>
                        <textarea
                          value={commentText}
                          onChange={(event) => setCommentText(event.target.value)}
                          rows={3}
                          placeholder="Leave a comment..."
                          className="w-full text-[12px] border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[rgb(10_194_255)]/20"
                        />
                        <button
                          type="button"
                          onClick={submitComment}
                          disabled={isCommenting || !commentText.trim()}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Add comment
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[12px] text-gray-500">Select a page to view content.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
