'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Save,
  Upload,
  Link as LinkIcon,
  Video,
  BookOpen,
  Briefcase,
  CodeSquare,
  GraduationCap,
  Pencil,
  Sparkles,
  Target,
  Eye,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Code,
  ChevronDown,
  Search,
  Filter,
  FileText,
  ClipboardList,
  Trash2,
  GripVertical,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Image as TiptapImage } from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { Extension } from '@tiptap/core'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import json from 'highlight.js/lib/languages/json'

type Category = { id: number; name: string; description: string | null }
type Page = { id: number; title: string; page_type: 'THEORY' | 'TASK'; category_id: number | null; content?: any; updated_at?: string | null }
type AcademyType = { id: number; name: string; description: string | null; icon: string | null }
type Program = { id: number; name: string; description: string | null; type_id: number | null }
type ProgramPage = { id: number; page_id: number; order_index: number; is_required: boolean; page: Page & { category: Category | null } }

const lowlight = createLowlight()
lowlight.register('json', json)

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle', 'paragraph', 'heading', 'listItem'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain, state, dispatch }) => {
          const { tr, selection } = state
          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.type.name === 'listItem') {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, fontSize })
            }
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, fontSize })
            }
          })
          if (dispatch) dispatch(tr)
          return chain().setMark('textStyle', { fontSize }).run()
        },
      unsetFontSize:
        () =>
        ({ chain, state, dispatch }) => {
          const { tr, selection } = state
          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.type.name === 'listItem') {
              const { fontSize: _omit, ...rest } = node.attrs as Record<string, any>
              tr.setNodeMarkup(pos, undefined, rest)
            }
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              const { fontSize: _omit, ...rest } = node.attrs as Record<string, any>
              tr.setNodeMarkup(pos, undefined, rest)
            }
          })
          if (dispatch) dispatch(tr)
          return chain().setMark('textStyle', { fontSize: null }).run()
        },
    }
  },
})

export default function AcademySettingsPage() {
  useEmployee()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [academyTypes, setAcademyTypes] = useState<AcademyType[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageType, setNewPageType] = useState<'THEORY' | 'TASK'>('THEORY')
  const [isSaving, setIsSaving] = useState(false)

  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const [programPages, setProgramPages] = useState<ProgramPage[]>([])
  const [programPagesError, setProgramPagesError] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPageId, setEditingPageId] = useState<number | null>(null)
  const [isAlignMenuOpen, setIsAlignMenuOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null)
  const [deleteToken, setDeleteToken] = useState('')
  const [deleteInput, setDeleteInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreatingAcademy, setIsCreatingAcademy] = useState(false)
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false)
  const [academyFormMode, setAcademyFormMode] = useState<'create' | 'edit'>('create')
  const [academyFormId, setAcademyFormId] = useState<number | null>(null)
  const [newAcademyName, setNewAcademyName] = useState('')
  const [newAcademyDescription, setNewAcademyDescription] = useState('')
  const [newAcademyIcon, setNewAcademyIcon] = useState('graduation-cap')
  const [reorderingPageId, setReorderingPageId] = useState<number | null>(null)
  const [draggingPageId, setDraggingPageId] = useState<number | null>(null)
  const [dragSnapshot, setDragSnapshot] = useState<ProgramPage[] | null>(null)
  const [toolbarState, setToolbarState] = useState({
    fontSize: '14px',
    bold: false,
    italic: false,
    underline: false,
    bulletList: false,
    orderedList: false,
    codeBlock: false,
  })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Link.configure({ openOnClick: true }),
      TiptapImage,
      Youtube.configure({ width: 640, height: 360 }),
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: {},
  })

  const previewEditor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      Link.configure({ openOnClick: true }),
      TiptapImage,
      Youtube.configure({ width: 640, height: 360 }),
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: {},
  })

  const alignment = editor?.getAttributes('paragraph')?.textAlign || 'left'

  const AlignmentIcon =
    alignment === 'center'
      ? AlignCenter
      : alignment === 'right'
        ? AlignRight
        : alignment === 'justify'
          ? AlignJustify
          : AlignLeft

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId]
  )
  const selectedType = useMemo(
    () => academyTypes.find((type) => type.id === selectedTypeId) ?? null,
    [academyTypes, selectedTypeId]
  )

  const emptyDragImage = useMemo(() => {
    if (typeof window === 'undefined') return null
    const img = new window.Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
    return img
  }, [])

  const filteredProgramPages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return programPages
    return programPages.filter((row) => row.page.title.toLowerCase().includes(query))
  }, [programPages, searchQuery])

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!editor) return
    const updateToolbar = () => {
      const fontSize =
        editor.getAttributes('textStyle').fontSize ||
        editor.getAttributes('listItem').fontSize ||
        editor.getAttributes('paragraph').fontSize ||
        '14px'
      setToolbarState({
        fontSize,
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        codeBlock: editor.isActive('codeBlock'),
      })
    }
    updateToolbar()
    editor.on('selectionUpdate', updateToolbar)
    editor.on('transaction', updateToolbar)
    return () => {
      editor.off('selectionUpdate', updateToolbar)
      editor.off('transaction', updateToolbar)
    }
  }, [editor])

  const programsForSelectedType = useMemo(
    () => programs.filter((program) => program.type_id === selectedTypeId),
    [programs, selectedTypeId]
  )

  useEffect(() => {
    loadInitial()
  }, [])

  useEffect(() => {
    if (selectedProgramId) {
      loadProgramPages(selectedProgramId)
    } else {
      setProgramPages([])
    }
  }, [selectedProgramId])

  useEffect(() => {
    if (!selectedTypeId) {
      setSelectedProgramId(null)
      return
    }
    const firstProgram = programs.find((program) => program.type_id === selectedTypeId) ?? null
    setSelectedProgramId(firstProgram?.id ?? null)
  }, [selectedTypeId, programs])

  const loadInitial = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token || key
    const headers = {
      apikey: key,
      Authorization: `Bearer ${token}`,
    }

    const [catRes, typeRes, programRes] = await Promise.all([
      fetch(`${url}/rest/v1/academy_categories?select=*&order=sort_order.asc`, { headers }),
      fetch(`${url}/rest/v1/academy_types?select=*&order=id.asc`, { headers }),
      fetch(`${url}/rest/v1/academy_programs?select=*&order=id.asc`, { headers }),
    ])

    const [catData, typeData, programData] = await Promise.all([
      catRes.ok ? catRes.json() : [],
      typeRes.ok ? typeRes.json() : [],
      programRes.ok ? programRes.json() : [],
    ])

    setCategories((catData || []) as Category[])
    setAcademyTypes((typeData || []) as AcademyType[])
    setPrograms((programData || []) as Program[])
  }

  const academyIcons = [
    { value: 'graduation-cap', label: 'Graduation', icon: GraduationCap },
    { value: 'book-open', label: 'Book', icon: BookOpen },
    { value: 'code-square', label: 'Code', icon: CodeSquare },
    { value: 'users', label: 'Team', icon: Users },
    { value: 'target', label: 'Target', icon: Target },
    { value: 'briefcase', label: 'Career', icon: Briefcase },
    { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  ] as const

  const loadProgramPages = async (programId: number) => {
    const { data, error } = await supabase
      .from('academy_program_pages')
      .select('id, page_id, order_index, is_required, page:academy_pages(id, title, page_type, category_id, content, updated_at, category:academy_categories(id, name))')
      .eq('program_id', programId)
      .order('order_index', { ascending: true })
    if (error) {
      console.error('Failed to load academy program pages:', error)
      setProgramPages([])
      setProgramPagesError(error.message)
      return
    }
    setProgramPages((data || []) as ProgramPage[])
    setProgramPagesError(null)
  }

  const createCategory = async () => {
    if (!newCategoryName.trim()) return
    const { data } = await supabase
      .from('academy_categories')
      .insert({ name: newCategoryName, sort_order: categories.length + 1 })
      .select()
      .single()
    if (data) {
      setCategories((prev) => [...prev, data as Category])
      setNewCategoryName('')
    }
  }

  const createAcademyType = async () => {
    if (!newAcademyName.trim()) return
    setIsCreatingAcademy(true)
    try {
      const { data, error } = await supabase
        .from('academy_types')
        .insert({
          name: newAcademyName.trim(),
          description: newAcademyDescription.trim() || null,
          icon: newAcademyIcon,
        })
        .select()
        .single()
      if (error) {
        console.error('Failed to create academy type:', error)
        return
      }
      if (data) setAcademyTypes((prev) => [...prev, data as AcademyType])
      resetAcademyForm()
    } finally {
      setIsCreatingAcademy(false)
    }
  }

  const updateAcademyType = async () => {
    if (!academyFormId || !newAcademyName.trim()) return
    setIsCreatingAcademy(true)
    try {
      const { data, error } = await supabase
        .from('academy_types')
        .update({
          name: newAcademyName.trim(),
          description: newAcademyDescription.trim() || null,
          icon: newAcademyIcon,
        })
        .eq('id', academyFormId)
        .select()
        .single()
      if (error) {
        console.error('Failed to update academy type:', error)
        return
      }
      if (data) {
        setAcademyTypes((prev) => prev.map((item) => (item.id === academyFormId ? (data as AcademyType) : item)))
      }
      resetAcademyForm()
    } finally {
      setIsCreatingAcademy(false)
    }
  }

  const resetAcademyForm = () => {
    setNewAcademyName('')
    setNewAcademyDescription('')
    setNewAcademyIcon('graduation-cap')
    setAcademyFormId(null)
    setAcademyFormMode('create')
    setIsAcademyModalOpen(false)
  }

  const openCreateAcademy = () => {
    setAcademyFormMode('create')
    setAcademyFormId(null)
    setNewAcademyName('')
    setNewAcademyDescription('')
    setNewAcademyIcon('graduation-cap')
    setIsAcademyModalOpen(true)
  }

  const openEditAcademy = () => {
    if (!selectedType) return
    setAcademyFormMode('edit')
    setAcademyFormId(selectedType.id)
    setNewAcademyName(selectedType.name)
    setNewAcademyDescription(selectedType.description ?? '')
    setNewAcademyIcon(selectedType.icon ?? 'graduation-cap')
    setIsAcademyModalOpen(true)
  }

  const createPage = async () => {
    if (!newPageTitle.trim() || !selectedProgramId) return
    setIsSaving(true)
    try {
      if (editingPageId) {
        await supabase
          .from('academy_pages')
          .update({
            title: newPageTitle,
            page_type: newPageType,
            category_id: selectedCategoryId,
            content: editor?.getJSON() ?? {},
          })
          .eq('id', editingPageId)
      } else {
        const { data } = await supabase
          .from('academy_pages')
          .insert({
            title: newPageTitle,
            page_type: newPageType,
            category_id: selectedCategoryId,
            content: editor?.getJSON() ?? {},
          })
          .select()
          .single()
        if (!data) return

        const nextOrderIndex = programPages.length
          ? Math.max(...programPages.map((page) => page.order_index)) + 1
          : 0

        await supabase.from('academy_program_pages').insert({
          program_id: selectedProgramId,
          page_id: (data as Page).id,
          order_index: nextOrderIndex,
          is_required: true,
        })
      }

      loadProgramPages(selectedProgramId)
      setNewPageTitle('')
      setShowEditor(false)
      setEditingPageId(null)
    } catch (error) {
      console.error('Failed to save academy page:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const reorderProgramPagesLocal = (draggedId: number, targetId: number) => {
    if (draggedId === targetId) return
    const currentIndex = programPages.findIndex((page) => page.id === draggedId)
    const targetIndex = programPages.findIndex((page) => page.id === targetId)
    if (currentIndex === -1 || targetIndex === -1) return
    const next = [...programPages]
    const [moved] = next.splice(currentIndex, 1)
    next.splice(targetIndex, 0, moved)
    setProgramPages(next.map((page, index) => ({ ...page, order_index: index })))
  }

  const persistProgramPagesOrder = async (pages: ProgramPage[]) => {
    if (!selectedProgramId) return
    setReorderingPageId(draggingPageId)
    try {
      await Promise.all(
        pages.map((page, index) =>
          supabase.from('academy_program_pages').update({ order_index: index }).eq('id', page.id)
        )
      )
      await loadProgramPages(selectedProgramId)
    } catch (error) {
      console.error('Failed to reorder academy pages:', error)
      if (dragSnapshot) setProgramPages(dragSnapshot)
    } finally {
      setReorderingPageId(null)
    }
  }

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const { error } = await supabase.storage.from('academy-media').upload(fileName, file)
    if (error) return
    const { data } = supabase.storage.from('academy-media').getPublicUrl(fileName)
    if (data?.publicUrl) {
      editor?.chain().focus().setImage({ src: data.publicUrl }).run()
    }
  }

  const insertYoutube = () => {
    const url = window.prompt('Paste YouTube URL')
    if (!url) return
    editor?.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  const generateDeleteToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i += 1) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
  }

  const openDeleteModal = (page: Page) => {
    setDeleteTarget(page)
    setDeleteInput('')
    setDeleteToken(generateDeleteToken())
    setIsDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteOpen(false)
    setDeleteTarget(null)
    setDeleteInput('')
    setDeleteToken('')
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await supabase.from('academy_program_pages').delete().eq('page_id', deleteTarget.id)
      await supabase.from('academy_pages').delete().eq('id', deleteTarget.id)
      if (selectedProgramId) loadProgramPages(selectedProgramId)
      closeDeleteModal()
    } catch (error) {
      console.error('Failed to delete academy page:', error)
      setIsDeleting(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${showEditor ? 'mb-4' : 'mb-6'}`}>
                <div>
                  <h1 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Academy Settings
                  </h1>
                  <p className="text-[12px] text-gray-500 mt-1">
                    Manage academy programs, theory pages and tasks.
                  </p>
                </div>
          <div className="flex items-center gap-3">
            {!selectedTypeId && (
              <button
                type="button"
                onClick={openCreateAcademy}
                disabled={isCreatingAcademy}
                className="mt-4 sm:mt-0 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-[12px] disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add academy
              </button>
            )}
            {selectedTypeId && !showEditor && (
              <button
                type="button"
                onClick={openEditAcademy}
                className="mt-4 sm:mt-0 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-[12px]"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit academy
              </button>
            )}
            {!showEditor && selectedTypeId && (
              <button
                type="button"
                onClick={() => {
                  setEditingPageId(null)
                  setNewPageTitle('')
                  setNewPageType('THEORY')
                  setSelectedCategoryId(null)
                  editor?.commands.setContent({})
                  setShowEditor(true)
                }}
                className="mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-[12px]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add new content
              </button>
            )}
            {showEditor && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false)
                    setEditingPageId(null)
                  }}
                  className="px-4 py-2 text-[12px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={createPage}
                  disabled={isSaving || !newPageTitle.trim() || !selectedProgramId}
                  className="px-4 py-2 text-[12px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingPageId ? 'Save changes' : 'Save page'}
                </button>
              </>
            )}
          </div>
        </div>

        {!selectedTypeId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedTypeId(type.id)}
                className="text-left rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    {(() => {
                      const match = academyIcons.find((icon) => icon.value === type.icon)
                      const Icon = match?.icon ?? GraduationCap
                      return <Icon className="w-4 h-4" />
                    })()}
                  </div>
                  <div className="text-[13px] font-semibold text-gray-900">{type.name}</div>
                </div>
                <div className="text-[12px] text-gray-500 mt-1">
                  {type.description || 'Open academy pages'}
                </div>
              </button>
            ))}
            {academyTypes.length === 0 && (
              <div className="text-[12px] text-gray-500">No academy types yet.</div>
            )}
          </div>
        ) : (
          <div className="space-y-2">

            {showEditor ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="px-6 pt-3 pb-2">
                        <input
                          type="text"
                          value={newPageTitle}
                          onChange={(e) => setNewPageTitle(e.target.value)}
                          className="w-full text-[14px] leading-[20px] font-semibold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 focus:outline-none"
                          placeholder="Enter topic title..."
                        />
                      </div>

                      <div className="border-t border-gray-200 px-6 py-3 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1 text-gray-500 text-[12px] font-medium">
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                            className={`w-7 h-7 inline-flex items-center justify-center rounded-md hover:text-gray-900 hover:bg-gray-100 ${
                              toolbarState.bold ? 'bg-gray-100 text-gray-900' : ''
                            }`}
                            title="Bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                            className={`w-7 h-7 inline-flex items-center justify-center rounded-md hover:text-gray-900 hover:bg-gray-100 italic ${
                              toolbarState.italic ? 'bg-gray-100 text-gray-900' : ''
                            }`}
                            title="Italic"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleUnderline().run()}
                            className={`w-7 h-7 inline-flex items-center justify-center rounded-md hover:text-gray-900 hover:bg-gray-100 underline ${
                              toolbarState.underline ? 'bg-gray-100 text-gray-900' : ''
                            }`}
                            title="Underline"
                          >
                            U
                          </button>
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                            className={`w-7 h-7 inline-flex items-center justify-center rounded-md hover:text-gray-900 hover:bg-gray-100 ${
                              toolbarState.bulletList ? 'bg-gray-100 text-gray-900' : ''
                            }`}
                            title="Bullet list"
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                            className={`w-7 h-7 inline-flex items-center justify-center rounded-md hover:text-gray-900 hover:bg-gray-100 ${
                              toolbarState.orderedList ? 'bg-gray-100 text-gray-900' : ''
                            }`}
                            title="Numbered list"
                          >
                            <ListOrdered className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                            className={`w-7 h-7 inline-flex items-center justify-center rounded-md hover:text-gray-900 hover:bg-gray-100 ${
                              toolbarState.codeBlock ? 'bg-gray-100 text-gray-900' : ''
                            }`}
                            title="Code block"
                          >
                            <Code className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsAlignMenuOpen((prev) => !prev)}
                            className="w-9 h-7 inline-flex items-center justify-center gap-1 text-gray-500 text-[12px] font-medium rounded-md hover:text-gray-900 hover:bg-gray-100"
                            title="Alignment"
                          >
                            <AlignmentIcon className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {isAlignMenuOpen && (
                            <div className="absolute z-20 mt-2 w-32 rounded-lg border border-gray-200 bg-white shadow-lg p-1">
                              {[
                                { key: 'left', label: 'Left', icon: AlignLeft },
                                { key: 'center', label: 'Center', icon: AlignCenter },
                                { key: 'right', label: 'Right', icon: AlignRight },
                                { key: 'justify', label: 'Justify', icon: AlignJustify },
                              ].map((item) => {
                                const Icon = item.icon
                                return (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => {
                                      editor?.chain().focus().setTextAlign(item.key as any).run()
                                      setIsAlignMenuOpen(false)
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-gray-600 hover:bg-gray-50 rounded-md"
                                  >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="flex items-center gap-3 text-gray-500 text-[12px] font-medium">
                          <select
                            value={toolbarState.fontSize}
                            onChange={(event) => {
                              const size = event.target.value
                              if (!size) {
                                editor?.chain().focus().unsetFontSize().run()
                              } else {
                                editor?.chain().focus().setFontSize(size).run()
                              }
                            }}
                            className="border border-gray-200 rounded-md px-2 py-1 text-[12px] text-gray-700 bg-white"
                          >
                            <option value="12px">12</option>
                            <option value="14px">14</option>
                            <option value="16px">16</option>
                            <option value="18px">18</option>
                            <option value="20px">20</option>
                            <option value="24px">24</option>
                          </select>
                        </div>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="flex items-center gap-4 text-gray-500 text-[12px] font-medium">
                          <button
                            type="button"
                            onClick={() => {
                              const url = window.prompt('Enter URL')
                              if (url) editor?.chain().focus().setLink({ href: url }).run()
                            }}
                            className="inline-flex items-center gap-2 hover:text-gray-900"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Link
                          </button>
                          <label className="inline-flex items-center gap-2 hover:text-gray-900 cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file)
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={insertYoutube}
                            className="inline-flex items-center gap-2 hover:text-gray-900"
                          >
                            <Video className="w-4 h-4" />
                            Video
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 px-6 py-6 tiptap-editor">
                        <EditorContent editor={editor} className="min-h-[420px]" />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                      <h3 className="text-[12px] font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                        Organization
                      </h3>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-[12px] font-medium text-gray-700 mb-1">Section</label>
                          <div className="relative">
                            <select
                              value={selectedCategoryId ?? ''}
                              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                              className="w-full pl-3 pr-10 py-2 text-[12px] border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg border bg-white shadow-sm appearance-none"
                            >
                              <option value="">No section</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                              <span>▾</span>
                            </div>
                          </div>

                          <div className="mt-2 flex shadow-sm rounded-md">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 text-[12px] focus:ring-blue-500 focus:border-blue-500"
                              placeholder="New section name..."
                            />
                            <button
                              type="button"
                              onClick={createCategory}
                              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[12px] font-medium text-gray-700 mb-1">Page Type</label>
                          <div className="relative">
                            <select
                              value={newPageType}
                              onChange={(e) => setNewPageType(e.target.value as 'THEORY' | 'TASK')}
                              className="w-full pl-3 pr-10 py-2 text-[12px] border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg border bg-white shadow-sm appearance-none"
                            >
                              <option value="THEORY">Theory</option>
                              <option value="TASK">Task</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                              <span>▾</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </>
            ) : (
              <>
                {!showEditor && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between">
                      <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-[12px]"
                          placeholder="Search topics..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-[12px] leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Filter type
                        </button>
                      </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Section
                          </th>
                          <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Topic
                          </th>
                          <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(filteredProgramPages.length ? filteredProgramPages : []).map((row) => {
                          const isTask = row.page.page_type === 'TASK'
                          const statusLabel = row.page.content ? 'Published' : 'Draft'
                          const statusColor = row.page.content ? 'bg-green-500' : 'bg-gray-300'
                          const lastUpdated = row.page.updated_at
                            ? new Date(row.page.updated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                              })
                            : '—'
                          return (
                            <tr
                              key={row.id}
                              className={`transition-colors group ${
                                draggingPageId
                                  ? draggingPageId === row.id
                                    ? 'bg-gray-50'
                                    : ''
                                  : 'hover:bg-gray-50'
                              }`}
                              onDragOver={(event) => {
                                if (!draggingPageId || draggingPageId === row.id) return
                                event.preventDefault()
                                reorderProgramPagesLocal(draggingPageId, row.id)
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-[12px] text-gray-700">
                                <div className="flex items-center gap-3">
                                  <span
                                    className="text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing"
                                    title="Drag to reorder"
                                    aria-hidden="true"
                                    draggable
                                    onDragStart={(event) => {
                                      event.dataTransfer.effectAllowed = 'move'
                                      event.dataTransfer.setData('text/plain', String(row.id))
                                      if (emptyDragImage) {
                                        event.dataTransfer.setDragImage(emptyDragImage, 0, 0)
                                      }
                                      setDragSnapshot(programPages)
                                      setDraggingPageId(row.id)
                                    }}
                                    onDragEnd={() => {
                                      if (dragSnapshot) {
                                        persistProgramPagesOrder(programPages)
                                      }
                                      setDraggingPageId(null)
                                      setDragSnapshot(null)
                                    }}
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </span>
                                  <div
                                    className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
                                      isTask ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                    }`}
                                  >
                                    {isTask ? <ClipboardList className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                  </div>
                                  <span>{row.page.category?.name ?? '—'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                <div className="text-[12px] text-gray-700">{row.page.title}</div>
                              </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2.5 py-0.5 inline-flex text-[11px] leading-5 font-semibold rounded-full ${
                                    isTask ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {isTask ? 'Task' : 'Theory'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                                  <span className="text-[12px] text-gray-700">{statusLabel}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-[12px] text-gray-500">
                                {lastUpdated}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-[12px] font-medium">
                                <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setPreviewTitle(row.page.title)
                                      setIsPreviewOpen(true)
                                      previewEditor?.commands.setContent(row.page.content || {})
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setEditingPageId(row.page.id)
                                      setNewPageTitle(row.page.title)
                                      setNewPageType(row.page.page_type)
                                      setSelectedCategoryId(row.page.category_id)
                                      setShowEditor(true)
                                      editor?.commands.setContent(row.page.content || {})
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(row.page)}
                                    className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {filteredProgramPages.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-[12px] text-gray-500">
                              {programPagesError ? `Failed to load pages: ${programPagesError}` : 'No pages yet.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isMounted && isPreviewOpen
        ? createPortal(
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setIsPreviewOpen(false)}
              />
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl w-[90vw] max-w-4xl max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                  <div className="text-[14px] font-semibold text-gray-900">{previewTitle || 'Preview'}</div>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="text-gray-500 hover:text-gray-900 text-[12px]"
                  >
                    Close
                  </button>
                </div>
                <div className="p-6 overflow-auto max-h-[75vh] tiptap-editor">
                  <EditorContent editor={previewEditor} />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
      {isMounted && isAcademyModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                  if (isCreatingAcademy) return
                  resetAcademyForm()
                }}
              />
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl w-[90vw] max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="text-[14px] font-semibold text-gray-900">
                    {academyFormMode === 'edit' ? 'Edit academy' : 'Add academy'}
                  </div>
                  <div className="text-[12px] text-gray-500 mt-1">Set name, description and icon.</div>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newAcademyName}
                      onChange={(e) => setNewAcademyName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                      placeholder="Academy name"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newAcademyDescription}
                      onChange={(e) => setNewAcademyDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">Icon</label>
                    <div className="grid grid-cols-3 gap-2">
                      {academyIcons.map((option) => {
                        const Icon = option.icon
                        const isSelected = option.value === newAcademyIcon
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setNewAcademyIcon(option.value)}
                            className={`flex items-center gap-2 border rounded-lg px-2 py-2 text-[12px] transition-colors ${
                              isSelected
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white">
                              <Icon className="w-4 h-4" />
                            </span>
                            <span className="text-[11px]">{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetAcademyForm}
                    disabled={isCreatingAcademy}
                    className="px-4 py-2 text-[12px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={academyFormMode === 'edit' ? updateAcademyType : createAcademyType}
                    disabled={isCreatingAcademy || !newAcademyName.trim()}
                    className="px-4 py-2 text-[12px] font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isCreatingAcademy ? 'Saving...' : academyFormMode === 'edit' ? 'Save changes' : 'Create academy'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
      {isMounted && isDeleteOpen
        ? createPortal(
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={closeDeleteModal} />
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl w-[90vw] max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="text-[14px] font-semibold text-gray-900">Delete page</div>
                  <div className="text-[12px] text-gray-500 mt-1">
                    This action is permanent. Type the code below to confirm.
                  </div>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="text-[12px] text-gray-600">
                    Page: <span className="font-semibold text-gray-900">{deleteTarget?.title}</span>
                  </div>
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-3 text-center text-[18px] font-mono tracking-widest text-gray-900">
                    {deleteToken}
                  </div>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
                    onPaste={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    placeholder="Enter the code"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                    autoComplete="off"
                  />
                  <div className="text-[11px] text-gray-500">
                    Paste is disabled to make sure the code is typed manually.
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="px-4 py-2 text-[12px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isDeleting || deleteInput.trim() !== deleteToken}
                    className="px-4 py-2 text-[12px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete page'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
