'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Save,
  Upload,
  Link as LinkIcon,
  Video,
  BookOpen,
  Pencil,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { Extension } from '@tiptap/core'

type Category = { id: number; name: string; description: string | null }
type Page = { id: number; title: string; page_type: 'THEORY' | 'TASK'; category_id: number | null; current_version_id: number | null }
type PageVersion = { id: number; version_number: number; content: any; created_at: string }
type AcademyType = { id: number; name: string; description: string | null }
type Program = { id: number; name: string; description: string | null; type_id: number | null }
type ProgramPage = { id: number; page_id: number; order_index: number; is_required: boolean; page: Page & { category: Category | null } }

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
  const { employee } = useEmployee()
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
  const [showEditor, setShowEditor] = useState(false)
  const [editingPageId, setEditingPageId] = useState<number | null>(null)
  const [editingVersionNumber, setEditingVersionNumber] = useState<number>(0)
  const [isAlignMenuOpen, setIsAlignMenuOpen] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: true }),
      Image,
      Youtube.configure({ width: 640, height: 360 }),
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
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

  const loadProgramPages = async (programId: number) => {
    const { data } = await supabase
      .from('academy_program_pages')
      .select('id, page_id, order_index, is_required, page:academy_pages(id, title, page_type, category_id, current_version_id, category:academy_categories(id, name))')
      .eq('program_id', programId)
      .order('order_index', { ascending: true })
    setProgramPages((data || []) as ProgramPage[])
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

  const createPage = async () => {
    if (!newPageTitle.trim() || !selectedProgramId) return
    setIsSaving(true)
    try {
      if (editingPageId) {
        const nextVersion = editingVersionNumber + 1
        const { data: versionData } = await supabase
          .from('academy_page_versions')
          .insert({
            page_id: editingPageId,
            version_number: nextVersion,
            content: editor?.getJSON() ?? {},
            created_by: employee?.id ?? null,
          })
          .select()
          .single()

        if (versionData) {
          await supabase
            .from('academy_pages')
            .update({
              title: newPageTitle,
              page_type: newPageType,
              category_id: selectedCategoryId,
              current_version_id: (versionData as PageVersion).id,
            })
            .eq('id', editingPageId)
        }
      } else {
        const { data } = await supabase
          .from('academy_pages')
          .insert({
            title: newPageTitle,
            page_type: newPageType,
            category_id: selectedCategoryId,
          })
          .select()
          .single()
        if (!data) return

        const { data: versionData } = await supabase
          .from('academy_page_versions')
          .insert({
            page_id: (data as Page).id,
            version_number: 1,
            content: editor?.getJSON() ?? {},
            created_by: employee?.id ?? null,
          })
          .select()
          .single()

        if (versionData) {
          await supabase
            .from('academy_pages')
            .update({ current_version_id: (versionData as PageVersion).id })
            .eq('id', (data as Page).id)
        }

        await supabase.from('academy_program_pages').insert({
          program_id: selectedProgramId,
          page_id: (data as Page).id,
          order_index: programPages.length,
          is_required: true,
        })
      }

      loadProgramPages(selectedProgramId)
      setNewPageTitle('')
      setShowEditor(false)
      setEditingPageId(null)
      setEditingVersionNumber(0)
    } catch (error) {
      console.error('Failed to save academy page:', error)
    } finally {
      setIsSaving(false)
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className={`flex items-center justify-between gap-3 ${showEditor ? 'mb-4' : 'mb-6'}`}>
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-gray-700" />
            <div>
              <h1 className="text-[14px] font-semibold text-gray-900">Academy Settings</h1>
              <p className="text-[12px] text-gray-500">Manage academy programs and pages</p>
            </div>
          </div>
          {showEditor && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditor(false)
                  setEditingPageId(null)
                  setEditingVersionNumber(0)
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
            </div>
          )}
        </div>

        {!selectedTypeId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedTypeId(type.id)}
                className="text-left rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="text-[13px] font-semibold text-gray-900">{type.name}</div>
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
                        <div className="flex items-center gap-3 text-gray-500 text-[12px] font-medium">
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                            className="hover:text-gray-900"
                            title="Bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                            className="hover:text-gray-900 italic"
                            title="Italic"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleUnderline().run()}
                            className="hover:text-gray-900 underline"
                            title="Underline"
                          >
                            U
                          </button>
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                            className="hover:text-gray-900 inline-flex items-center"
                            title="Bullet list"
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                            className="hover:text-gray-900 inline-flex items-center"
                            title="Numbered list"
                          >
                            <ListOrdered className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsAlignMenuOpen((prev) => !prev)}
                            className="inline-flex items-center gap-2 text-gray-500 text-[12px] font-medium hover:text-gray-900"
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
                            value={editor?.getAttributes('heading').level ?? 0}
                            onChange={(event) => {
                              const level = Number(event.target.value)
                              if (!level) {
                                editor?.chain().focus().setParagraph().run()
                              } else {
                                editor?.chain().focus().toggleHeading({ level }).run()
                              }
                            }}
                            className="border border-gray-200 rounded-md px-2 py-1 text-[12px] text-gray-700 bg-white"
                          >
                            <option value={0}>Normal</option>
                            <option value={1}>H1</option>
                            <option value={2}>H2</option>
                            <option value={3}>H3</option>
                          </select>
                          <select
                            value={
                              editor?.getAttributes('listItem').fontSize ||
                              editor?.getAttributes('paragraph').fontSize ||
                              editor?.getAttributes('textStyle').fontSize ||
                              '14px'
                            }
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
                          <label className="block text-[12px] font-medium text-gray-700 mb-1">Category</label>
                          <div className="relative">
                            <select
                              value={selectedCategoryId ?? ''}
                              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                              className="w-full pl-3 pr-10 py-2 text-[12px] border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg border bg-white shadow-sm appearance-none"
                            >
                              <option value="">No category</option>
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
                              placeholder="New category name..."
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
                          <label className="block text-[12px] font-medium text-gray-700 mb-1">Tags</label>
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
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-[minmax(110px,140px)_minmax(120px,160px)_minmax(320px,1fr)_72px] bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                      <div className="px-3 py-3">Category</div>
                      <div className="px-3 py-3">Tag</div>
                      <div className="px-3 py-3">Topic</div>
                      <div className="px-3 py-3 text-center">Edit</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {(programPages.length ? programPages : []).map((row) => (
                        <div key={row.id} className="grid grid-cols-[minmax(110px,140px)_minmax(120px,160px)_minmax(320px,1fr)_72px] text-[12px] text-gray-700">
                          <div className="px-3 py-3">{row.page.category?.name || '—'}</div>
                          <div className="px-3 py-3">{row.page.page_type === 'TASK' ? 'Task' : 'Theory'}</div>
                          <div className="px-3 py-3 text-gray-900">{row.page.title}</div>
                          <div className="px-3 py-3 flex justify-center">
                            <button
                              type="button"
                              onClick={async () => {
                                setEditingPageId(row.page.id)
                                setNewPageTitle(row.page.title)
                                setNewPageType(row.page.page_type)
                                setSelectedCategoryId(row.page.category_id)
                                setShowEditor(true)
                                const currentVersionId = row.page.current_version_id
                                if (currentVersionId) {
                                  const { data } = await supabase
                                    .from('academy_page_versions')
                                    .select('content, version_number')
                                    .eq('id', currentVersionId)
                                    .maybeSingle()
                                  if (data?.content) {
                                    editor?.commands.setContent(data.content)
                                  } else {
                                    editor?.commands.setContent({})
                                  }
                                  setEditingVersionNumber(data?.version_number ?? 0)
                                } else {
                                  editor?.commands.setContent({})
                                  setEditingVersionNumber(0)
                                }
                              }}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                              aria-label="Edit page"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {programPages.length === 0 && (
                        <div className="px-4 py-6 text-[12px] text-gray-500">No pages yet.</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
