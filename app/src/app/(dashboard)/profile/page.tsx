'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calendar, Mail, User, Briefcase, Users, Clock, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'
import type { Tables } from '@/types/database'
import {
  addDays,
  addMonths,
  eachMonthOfInterval,
  endOfWeek,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'

interface TimeEntryRow {
  date: string
  hours: number
  tasks: {
    task_type: string | null
  } | null
}

interface ChartSeries {
  label: string
  color: string
  data: number[]
  dashed?: boolean
  fillGradientId?: string
}

type Employee = Tables<'employees'>

function normalizeKey(value: string | null) {
  if (!value) return ''
  return value
    .toString()
    .trim()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

function buildCalendarDays(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfMonth(month)
  const days: Date[] = []
  let current = start
  while (current <= end || days.length % 7 !== 0) {
    days.push(current)
    current = addDays(current, 1)
  }
  return days
}

function LineChart({
  labels,
  series,
}: {
  labels: string[]
  series: ChartSeries[]
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const height = 320
  const width = 900
  const padding = 26

  const maxValueRaw = Math.max(20, ...series.flatMap((s) => s.data))
  const yMax = Math.ceil(maxValueRaw / 20) * 20

  const pointsFor = (values: number[]) => {
    const stepX = (width - padding * 2) / Math.max(1, values.length - 1)
    return values.map((v, i) => {
      const x = padding + i * stepX
      const y = height - padding - (v / yMax) * (height - padding * 2)
      return { x, y }
    })
  }

  const buildPath = (pts: { x: number; y: number }[]) => {
    if (!pts.length) return ''
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2] || p2
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return d
  }

  const stepX = (width - padding * 2) / Math.max(1, labels.length - 1)

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      onMouseLeave={() => {
        setHoverIndex(null)
        setTooltipPos(null)
      }}
      onMouseMove={(event) => {
        if (!containerRef.current || labels.length === 0) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = event.clientX - rect.left
        const index = Math.max(0, Math.min(labels.length - 1, Math.round((x - padding) / stepX)))
        const tooltipX = padding + index * stepX
        setHoverIndex(index)
        setTooltipPos({ x: tooltipX, y: padding })
      }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-80">
        <defs>
          {series.map((s) =>
            s.fillGradientId ? (
              <linearGradient
                key={s.fillGradientId}
                id={s.fillGradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ) : null
          )}
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="white" />
        {Array.from({ length: yMax / 20 + 1 }, (_, i) => i * 20).map((value) => {
          const p = value / yMax
          const y = height - padding - p * (height - padding * 2)
          return (
            <line
              key={value}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          )
        })}

        {series.map((s) => {
          const pts = pointsFor(s.data)
          const path = buildPath(pts)
          const areaPath = `${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`
          return (
            <g key={s.label}>
              {s.fillGradientId ? (
                <path d={areaPath} fill={`url(#${s.fillGradientId})`} />
              ) : null}
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth="3"
                strokeDasharray={s.dashed ? '6 6' : undefined}
              />
              {pts.map((p, i) => (
                <circle
                  key={`${s.label}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#ffffff"
                  stroke={s.color}
                  strokeWidth="2"
                />
              ))}
            </g>
          )
        })}

        {labels.map((label, i) => {
          const stepX = (width - padding * 2) / Math.max(1, labels.length - 1)
          const x = padding + i * stepX
          return (
            <text
              key={label}
              x={x}
              y={height - 6}
              textAnchor="middle"
              fontSize="10"
              fill="#6B7280"
            >
              {label}
            </text>
          )
        })}

        {Array.from({ length: yMax / 20 + 1 }, (_, i) => i * 20).map((value) => {
          const p = value / yMax
          const y = height - padding - p * (height - padding * 2)
          return (
            <text key={value} x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6B7280">
              {value}
            </text>
          )
        })}

        <line x1={padding} y1={padding - 4} x2={padding} y2={height - padding} stroke="#E2E8F0" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E2E8F0" strokeWidth="1" />

        {hoverIndex !== null && labels.length > 0 ? (
          <line
            x1={padding + hoverIndex * stepX}
            y1={padding - 4}
            x2={padding + hoverIndex * stepX}
            y2={height - padding}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
          />
        ) : null}
      </svg>
      {hoverIndex !== null && tooltipPos ? (
        <div
          className="absolute bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-[12px] text-gray-700"
          style={{
            left: Math.min(Math.max(tooltipPos.x + 12, 12), 520),
            top: 24,
          }}
        >
          <div className="text-[13px] font-semibold text-gray-900 mb-2">{labels[hoverIndex]}</div>
          <div className="space-y-1">
            {series.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm border"
                  style={{ borderColor: s.color }}
                />
                <span>
                  {s.label}: {s.data[hoverIndex]?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StackedBarChart({
  labels,
  external,
  internal,
  showExternal,
  showInternal,
  interval,
}: {
  labels: string[]
  external: number[]
  internal: number[]
  showExternal: boolean
  showInternal: boolean
  interval: 'months' | 'weeks' | 'days'
}) {
  const yStep = interval === 'months' ? 20 : interval === 'weeks' ? 10 : 2
  const totals = labels.map((_, index) => (showExternal ? external[index] || 0 : 0) + (showInternal ? internal[index] || 0 : 0))
  const maxTotalRaw = Math.max(yStep, ...totals)
  const yMax = Math.ceil(maxTotalRaw / yStep) * yStep + yStep
  const yTicks = Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, i) => i * yStep)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Мінімальна ширина стовпця
  const barMinWidth = 48
  const gap = 8
  const chartContentWidth = labels.length * (barMinWidth + gap) + 16

  // Чи потрібний скрол: контент ширший за контейнер
  const [containerWidth, setContainerWidth] = useState(0)
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const yAxisWidth = 36
  const availableWidth = containerWidth - yAxisWidth
  const needsScroll = chartContentWidth > availableWidth
  // Якщо скрол не потрібен — стовпці розтягуються на всю ширину
  const innerWidth = needsScroll ? chartContentWidth : availableWidth

  return (
    <div ref={containerRef} className="w-full pt-2">
      <div className="relative flex">
        {/* Y-axis — sticky при горизонтальному скролі */}
        <div
          className="relative flex-shrink-0 h-72 bg-white z-10"
          style={{ width: `${yAxisWidth}px` }}
        >
          <div className="absolute inset-x-0 top-0 bottom-6 overflow-visible">
            {yTicks.map((tick) => {
              const top = (1 - tick / yMax) * 100
              return (
                <div key={tick} className="absolute right-0 w-full" style={{ top: `${top}%`, transform: 'translateY(-50%)' }}>
                  <div className="text-[10px] text-gray-400 text-right pr-1">{tick}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scrollable chart area */}
        <div
          ref={scrollRef}
          className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden h-72"
        >
          <div
            className="h-full relative"
            style={{ width: `${innerWidth}px`, minWidth: `${innerWidth}px` }}
          >
            {/* Grid lines */}
            <div className="absolute inset-x-0 top-0 bottom-6">
              {yTicks.map((tick) => {
                const top = (1 - tick / yMax) * 100
                return (
                  <div
                    key={tick}
                    className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                    style={{ top: `${top}%` }}
                  />
                )
              })}

              {/* Bars — flex-1 щоб розтягувались коли місця багато */}
              <div className="absolute inset-0 flex items-end px-1" style={{ gap: `${gap}px` }}>
                {labels.map((label, index) => {
                  const ext = showExternal ? external[index] || 0 : 0
                  const intl = showInternal ? internal[index] || 0 : 0
                  const total = ext + intl
                  const totalHeight = (total / yMax) * 100
                  const extHeight = total ? (ext / total) * 100 : 0
                  const intlHeight = total ? (intl / total) * 100 : 0

                  return (
                    <div
                      key={label}
                      className="flex flex-col items-center h-full flex-1"
                      style={{ minWidth: `${barMinWidth}px` }}
                    >
                      <div className="w-full flex-1 flex items-end justify-center">
                        <div className="w-full h-full flex items-end justify-center">
                          <div
                            className="relative w-9"
                            style={{ height: `${Math.max(totalHeight, total > 0 ? 2 : 0)}%` }}
                          >
                            {total > 0 ? (
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-400 whitespace-nowrap">
                                {total.toFixed(1)}
                              </div>
                            ) : null}
                            <div className="w-full h-full rounded-[8px] bg-gray-100 overflow-hidden flex flex-col justify-end min-h-[2px]">
                              {showInternal && intl > 0 ? (
                                <div
                                  style={{ height: `${intlHeight}%`, minHeight: '2px' }}
                                  className="bg-[#10B981]"
                                  onMouseEnter={(event) => {
                                    setHoverIndex(index)
                                    setHoverPos({ x: event.clientX, y: event.clientY })
                                  }}
                                  onMouseMove={(event) => {
                                    setHoverIndex(index)
                                    setHoverPos({ x: event.clientX, y: event.clientY })
                                  }}
                                  onMouseLeave={() => {
                                    setHoverIndex(null)
                                    setHoverPos(null)
                                  }}
                                />
                              ) : null}
                              {showExternal && ext > 0 ? (
                                <div
                                  style={{ height: `${extHeight}%`, minHeight: '2px' }}
                                  className="bg-[#3B82F6]"
                                  onMouseEnter={(event) => {
                                    setHoverIndex(index)
                                    setHoverPos({ x: event.clientX, y: event.clientY })
                                  }}
                                  onMouseMove={(event) => {
                                    setHoverIndex(index)
                                    setHoverPos({ x: event.clientX, y: event.clientY })
                                  }}
                                  onMouseLeave={() => {
                                    setHoverIndex(null)
                                    setHoverPos(null)
                                  }}
                                />
                              ) : null}
                            </div>
                            {hoverIndex === index && hoverPos ? (
                              <div
                                className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-md px-4 py-2 text-[11px] text-gray-700 min-w-[150px]"
                                style={{ left: hoverPos.x + 12, top: hoverPos.y + 12 }}
                              >
                                <div className="font-semibold text-gray-900 mb-1">{label}</div>
                                {showExternal ? (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                                    External: {(external[index] || 0).toFixed(1)}
                                  </div>
                                ) : null}
                                {showInternal ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
                                    Internal: {(internal[index] || 0).toFixed(1)}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="absolute inset-x-0 bottom-0 h-6 flex items-end px-1" style={{ gap: `${gap}px` }}>
              {labels.map((label) => (
                <div
                  key={label}
                  className="flex items-end justify-center flex-1"
                  style={{ minWidth: `${barMinWidth}px` }}
                >
                  <div className="text-[9px] text-gray-500 uppercase tracking-wide whitespace-nowrap">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const searchParams = useSearchParams()
  const requestedEmployeeId = searchParams.get('employeeId')
  const { user, employee: viewerEmployee, isLoading, error } = useEmployee()
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const employee = profileEmployee
  const [positionName, setPositionName] = useState<string | null>(null)
  const [teamName, setTeamName] = useState<string | null>(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [chartSeries, setChartSeries] = useState<ChartSeries[]>([])
  const [chartLabels, setChartLabels] = useState<string[]>([])
  const [visibleSeries, setVisibleSeries] = useState({
    total: true,
    external: true,
    internal: true,
  })
  const [interval, setInterval] = useState<'months' | 'weeks' | 'days'>('months')
  const [rangeStart, setRangeStart] = useState(() => format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'))
  const [rangeEnd, setRangeEnd] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [rangeCalendarMonth, setRangeCalendarMonth] = useState<Date>(new Date())
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false)
  const rangeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadProfileEmployee = async () => {
      if (!viewerEmployee) return
      if (!requestedEmployeeId) {
        setProfileEmployee(viewerEmployee)
        setProfileError(null)
        return
      }

      const id = Number(requestedEmployeeId)
      if (!Number.isFinite(id)) {
        setProfileEmployee(null)
        setProfileError('Invalid employee id.')
        return
      }

      setIsProfileLoading(true)
      setProfileError(null)
      const supabase = createClient()
      const { data, error: profileLoadError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()

      if (profileLoadError) {
        setProfileEmployee(null)
        setProfileError(profileLoadError.message)
      } else {
        setProfileEmployee(data)
      }
      setIsProfileLoading(false)
    }

    loadProfileEmployee()
  }, [viewerEmployee, requestedEmployeeId])

  useEffect(() => {
    if (!showRangePicker) return
    const handleClickOutside = (event: MouseEvent) => {
      if (rangeRef.current && !rangeRef.current.contains(event.target as Node)) {
        setShowRangePicker(false)
        setIsStartCalendarOpen(false)
        setIsEndCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showRangePicker])

  useEffect(() => {
    const loadMeta = async () => {
      if (!employee) return
      const supabase = createClient()
      const { data: positionRows } = await supabase
        .from('employee_position_history')
        .select('position_id, positions ( name )')
        .eq('employee_id', employee.id)
        .order('start_date', { ascending: false })

      const names = (positionRows || [])
        .map((row) => (row as { positions?: { name?: string } }).positions?.name)
        .filter(Boolean) as string[]
      setPositionName(names.length ? Array.from(new Set(names)).join(', ') : null)

      const { data: teamRows } = await supabase
        .from('team_employees')
        .select('team_id, teams ( name )')
        .eq('employee_id', employee.id)
        .order('start_date', { ascending: false })

      const teamNames = (teamRows || [])
        .map((row) => (row as { teams?: { name?: string } }).teams?.name)
        .filter(Boolean) as string[]
      setTeamName(teamNames.length ? Array.from(new Set(teamNames)).join(', ') : null)
    }

    loadMeta()
  }, [employee])

  useEffect(() => {
    const loadChart = async () => {
      if (!employee) return
      setChartLoading(true)

      const supabase = createClient()
      const start = parseISO(rangeStart)
      const end = parseISO(rangeEnd)

      const { data, error: queryError } = await supabase
        .from('time_tracking')
        .select('date, hours, tasks ( task_type )')
        .eq('employee_id', employee.id)
        .gte('date', rangeStart)
        .lte('date', rangeEnd)

      if (queryError) {
        console.error('Failed to load chart data:', queryError)
        setChartLoading(false)
        return
      }

      let labels: string[] = []
      const totals = new Map<string, { total: number; external: number; internal: number }>()

      if (interval === 'months') {
        const buckets = eachMonthOfInterval({ start: startOfMonth(start), end: endOfMonth(end) })
        labels = buckets.map((m) => format(m, 'MMM'))
        buckets.forEach((m) => totals.set(format(m, 'yyyy-MM'), { total: 0, external: 0, internal: 0 }))
      } else if (interval === 'weeks') {
        const weeks: Date[] = []
        let cursor = startOfWeek(start, { weekStartsOn: 1 })
        const endCursor = endOfWeek(end, { weekStartsOn: 1 })
        while (cursor <= endCursor) {
          weeks.push(cursor)
          cursor = addDays(cursor, 7)
        }
        labels = weeks.map((w) => format(w, 'dd MMM'))
        weeks.forEach((w) => totals.set(format(w, 'yyyy-ww'), { total: 0, external: 0, internal: 0 }))
      } else {
        const days: Date[] = []
        let cursor = start
        while (cursor <= end) {
          days.push(cursor)
          cursor = addDays(cursor, 1)
        }
        labels = days.map((d) => format(d, 'dd MMM'))
        days.forEach((d) => totals.set(format(d, 'yyyy-MM-dd'), { total: 0, external: 0, internal: 0 }))
      }

      ;(data as TimeEntryRow[] | null)?.forEach((entry) => {
        const d = new Date(entry.date)
        let key = format(d, 'yyyy-MM-dd')
        if (interval === 'months') key = format(d, 'yyyy-MM')
        if (interval === 'weeks') key = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-ww')
        const bucket = totals.get(key)
        if (!bucket) return
        const hours = Number(entry.hours || 0)
        const typeKey = normalizeKey(entry.tasks?.task_type ?? null)
        bucket.total += hours
        if (typeKey === 'EXTERNAL') {
          bucket.external += hours
        } else {
          bucket.internal += hours
        }
      })

      const keys = Array.from(totals.keys())
      const totalData = keys.map((k) => totals.get(k)!.total)
      const externalData = keys.map((k) => totals.get(k)!.external)
      const internalData = keys.map((k) => totals.get(k)!.internal)

      setChartLabels(labels)
      setChartSeries([
        { label: 'Total Hours', color: '#8B5CF6', data: totalData, fillGradientId: 'gradient-total' },
        { label: 'External Hours', color: '#3B82F6', data: externalData, fillGradientId: 'gradient-external' },
        { label: 'Internal Hours', color: '#10B981', data: internalData, dashed: true },
      ])
      setChartLoading(false)
    }

    loadChart()
  }, [employee, rangeStart, rangeEnd, interval])

  const fullName = useMemo(() => {
    if (!employee) return '—'
    return `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() || '—'
  }, [employee])
  const initials = useMemo(() => {
    if (!employee) return '—'
    const first = employee.first_name?.trim()?.[0] ?? ''
    const last = employee.last_name?.trim()?.[0] ?? ''
    const combined = `${first}${last}`.toUpperCase()
    return combined || '—'
  }, [employee])
  const avatarUrl = useMemo(() => {
    if (!user || !employee) return null
    if ((user.email ?? '').toLowerCase() !== (employee.email ?? '').toLowerCase()) return null
    const meta = user.user_metadata as Record<string, unknown> | null
    const url =
      (meta?.avatar_url as string | undefined) ??
      (meta?.picture as string | undefined) ??
      (meta?.avatarUrl as string | undefined)
    return typeof url === 'string' && url.trim() ? url : null
  }, [user, employee])

  if (isLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[rgb(10_194_255)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error || profileError) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600">{profileError ?? error}</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-3xl font-bold shadow-[0_12px_24px_rgba(37,99,235,0.25)] overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            {requestedEmployeeId ? (
              <p className="text-[12px] text-slate-500 font-medium">Employee details</p>
            ) : null}
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">{fullName}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-700">
              <Briefcase className="h-4 w-4" />
              {positionName ?? employee.position ?? '—'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Email address</p>
            <p className="mt-2 text-[14px] font-semibold text-slate-900">{employee.email}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Team</p>
            <p className="mt-2 text-[14px] font-semibold text-slate-900">{teamName ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Employment Date</p>
            <p className="mt-2 text-[14px] font-semibold text-slate-900">
              {employee.employment_date ? format(new Date(employee.employment_date), 'MMM dd, yyyy') : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-2 inline-flex items-center gap-2 text-[14px] font-semibold text-emerald-600">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {employee.status ?? '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900">Productivity</h2>
            <p className="text-[12px] text-gray-500">Track your efficiency over time</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 p-1">
              {(['months', 'weeks', 'days'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setInterval(item)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-lg ${
                    interval === item ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item === 'months' ? 'Months' : item === 'weeks' ? 'Weeks' : 'Days'}
                </button>
              ))}
            </div>
            <div className="relative" ref={rangeRef}>
              <button
                type="button"
                onClick={() => setShowRangePicker((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <span className="opacity-60">📅</span>
                {format(parseISO(rangeStart), 'MMM dd, yyyy')} – {format(parseISO(rangeEnd), 'MMM dd, yyyy')}
              </button>
              {showRangePicker && (
                <div className="absolute right-0 mt-2 w-[360px] rounded-2xl border border-gray-200 bg-white shadow-xl p-4 z-20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-900">Date Range</div>
                    <button
                      type="button"
                      onClick={() => {
                        setRangeStart(format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'))
                        setRangeEnd(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
                        setShowRangePicker(false)
                      }}
                      className="text-[12px] text-gray-500 hover:text-gray-700"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="text-[12px] text-gray-500">Start</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsStartCalendarOpen((prev) => !prev)
                          setIsEndCalendarOpen(false)
                        }}
                        className="w-full text-left mt-1 px-3 py-2 text-[12px] border border-gray-200 rounded-lg"
                      >
                        {format(parseISO(rangeStart), 'dd.MM.yyyy')}
                      </button>
                      {isStartCalendarOpen && (
                        <div className="absolute z-30 mt-2 w-full min-w-[260px] rounded-2xl border border-gray-200 bg-white shadow-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              type="button"
                              onClick={() => setRangeCalendarMonth((prev) => subMonths(prev, 1))}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="text-sm font-semibold text-gray-900">
                              {format(rangeCalendarMonth, 'MMMM yyyy')}
                            </div>
                            <button
                              type="button"
                              onClick={() => setRangeCalendarMonth((prev) => addMonths(prev, 1))}
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
                            {buildCalendarDays(rangeCalendarMonth).map((day) => {
                              const isCurrentMonth = isSameMonth(day, rangeCalendarMonth)
                              const isSelected = isSameDay(day, parseISO(rangeStart))
                              return (
                                <button
                                  key={day.toISOString()}
                                  type="button"
                                  onClick={() => {
                                    setRangeStart(format(day, 'yyyy-MM-dd'))
                                    if (parseISO(rangeEnd) < day) {
                                      setRangeEnd(format(day, 'yyyy-MM-dd'))
                                    }
                                    setIsStartCalendarOpen(false)
                                  }}
                                  className={`h-8 rounded-lg text-[12px] font-medium transition-colors ${
                                    isSelected
                                      ? 'bg-[rgb(10_194_255)] text-white'
                                      : isToday(day)
                                        ? 'bg-[rgb(10_194_255)]/10 text-gray-900'
                                        : isCurrentMonth
                                          ? 'text-gray-900 hover:bg-gray-100'
                                          : 'text-gray-400 hover:bg-gray-100'
                                  }`}
                                >
                                  {day.getDate()}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label className="text-[12px] text-gray-500">End</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEndCalendarOpen((prev) => !prev)
                          setIsStartCalendarOpen(false)
                        }}
                        className="w-full text-left mt-1 px-3 py-2 text-[12px] border border-gray-200 rounded-lg"
                      >
                        {format(parseISO(rangeEnd), 'dd.MM.yyyy')}
                      </button>
                      {isEndCalendarOpen && (
                        <div className="absolute z-30 mt-2 w-full min-w-[260px] rounded-2xl border border-gray-200 bg-white shadow-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              type="button"
                              onClick={() => setRangeCalendarMonth((prev) => subMonths(prev, 1))}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="text-sm font-semibold text-gray-900">
                              {format(rangeCalendarMonth, 'MMMM yyyy')}
                            </div>
                            <button
                              type="button"
                              onClick={() => setRangeCalendarMonth((prev) => addMonths(prev, 1))}
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
                            {buildCalendarDays(rangeCalendarMonth).map((day) => {
                              const isCurrentMonth = isSameMonth(day, rangeCalendarMonth)
                              const isSelected = isSameDay(day, parseISO(rangeEnd))
                              return (
                                <button
                                  key={day.toISOString()}
                                  type="button"
                                  onClick={() => {
                                    setRangeEnd(format(day, 'yyyy-MM-dd'))
                                    if (parseISO(rangeStart) > day) {
                                      setRangeStart(format(day, 'yyyy-MM-dd'))
                                    }
                                    setIsEndCalendarOpen(false)
                                  }}
                                  className={`h-8 rounded-lg text-[12px] font-medium transition-colors ${
                                    isSelected
                                      ? 'bg-[rgb(10_194_255)] text-white'
                                      : isToday(day)
                                        ? 'bg-[rgb(10_194_255)]/10 text-gray-900'
                                        : isCurrentMonth
                                          ? 'text-gray-900 hover:bg-gray-100'
                                          : 'text-gray-400 hover:bg-gray-100'
                                  }`}
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
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          {chartSeries
            .filter((s) => s.label !== 'Total Hours')
            .map((s) => {
              const key = s.label === 'External Hours' ? 'external' : 'internal'
              const enabled = visibleSeries[key as keyof typeof visibleSeries]
              const activeClass =
                key === 'external'
                  ? 'border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10'
                  : 'border-[#10B981] text-[#10B981] bg-[#10B981]/10'
              return (
                <button
                  key={s.label}
                  onClick={() =>
                    setVisibleSeries((prev) => ({
                      ...prev,
                      [key]: !enabled,
                    }))
                  }
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-medium ${
                    enabled ? activeClass : 'border-gray-200 text-gray-400 bg-white'
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </button>
              )
            })}
        </div>

        {chartLoading ? (
          <div className="flex items-center justify-center h-52">
            <div className="w-6 h-6 border-2 border-[rgb(10_194_255)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-stretch">
            <div className="min-w-0 overflow-hidden">
              <StackedBarChart
                labels={chartLabels}
                external={chartSeries[1]?.data ?? []}
                internal={chartSeries[2]?.data ?? []}
                showExternal={visibleSeries.external}
                showInternal={visibleSeries.internal}
                interval={interval}
              />
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-[12px] text-gray-700 flex flex-col">
              {(() => {
                const total = chartSeries[0]?.data.reduce((sum, v) => sum + v, 0) || 0
                const external = chartSeries[1]?.data.reduce((sum, v) => sum + v, 0) || 0
                const internal = chartSeries[2]?.data.reduce((sum, v) => sum + v, 0) || 0
                const externalPct = total ? (external / total) * 100 : 0
                const internalPct = total ? (internal / total) * 100 : 0
                return (
                  <>
                    <div className="space-y-4">
                      <div>
                        <div className="text-gray-500 uppercase tracking-wide text-[11px]">Total Hours</div>
                        <div className="text-[14px] font-semibold text-gray-900">
                          {total.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide" style={{ color: '#3B82F6' }}>
                          External Hours
                        </div>
                        <div className="text-[14px] font-semibold text-gray-900">
                          {external.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide" style={{ color: '#10B981' }}>
                          Internal Hours
                        </div>
                        <div className="text-[14px] font-semibold text-gray-900">
                          {internal.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="text-[12px] font-semibold text-gray-500 mb-3">EFFICIENCY RATIO</div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-4 flex">
                        <div className="h-full" style={{ width: `${externalPct}%`, backgroundColor: '#3B82F6' }} />
                        <div className="h-full" style={{ width: `${internalPct}%`, backgroundColor: '#10B981' }} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                            EXTERNAL
                          </div>
                          <div className="text-[14px] font-semibold text-gray-900 mt-1">
                            {externalPct.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
                            INTERNAL
                          </div>
                          <div className="text-[14px] font-semibold text-gray-900 mt-1">
                            {internalPct.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
