'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmployee } from '@/lib/hooks/useEmployee'

type TeamMember = {
  team_id: number
  teams?: { name?: string | null } | null
  employees?: {
    id: number
    first_name: string
    last_name: string
    email: string
    status: string | null
  } | null
}

type TeamGroup = {
  teamId: number
  teamName: string
  members: Array<{
    id: number
    name: string
    email: string
    status: string | null
    position: string | null
  }>
}

export default function TeamPage() {
  const { employee, isLoading: isLoadingEmployee, error: employeeError } = useEmployee()
  const [teams, setTeams] = useState<TeamGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')

  useEffect(() => {
    const loadTeams = async () => {
      if (!employee) return
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        const { data: myTeams, error: myTeamsError } = await supabase
          .from('team_employees')
          .select('team_id')
          .eq('employee_id', employee.id)

        if (myTeamsError) throw myTeamsError

        const teamIds = Array.from(new Set((myTeams || []).map((row) => row.team_id)))
        if (!teamIds.length) {
          setTeams([])
          return
        }

        const { data: members, error: membersError } = await supabase
          .from('team_employees')
          .select('team_id, teams ( name ), employees ( id, first_name, last_name, email, status )')
          .in('team_id', teamIds)
          .order('start_date', { ascending: false })

        if (membersError) throw membersError

        const employeeIds = Array.from(
          new Set(
            (members || [])
              .map((row: TeamMember) => row.employees?.id)
              .filter((id): id is number => typeof id === 'number')
          )
        )

        const { data: positionRows, error: positionsError } = employeeIds.length
          ? await supabase
              .from('employee_position_history')
              .select('employee_id, positions ( name ), start_date')
              .in('employee_id', employeeIds)
              .order('start_date', { ascending: false })
          : { data: [], error: null }

        if (positionsError) throw positionsError

        const positionMap = new Map<number, string>()
        ;(positionRows || []).forEach((row) => {
          if (row.employee_id && !positionMap.has(row.employee_id)) {
            const name = (row as { positions?: { name?: string } }).positions?.name
            if (name) positionMap.set(row.employee_id, name)
          }
        })

        const teamMap = new Map<number, TeamGroup>()

        ;(members || []).forEach((row: TeamMember) => {
          if (!row.team_id) return
          const teamName = row.teams?.name ?? `Team ${row.team_id}`
          const employeeRow = row.employees
          if (!employeeRow) return

          const entry = teamMap.get(row.team_id) ?? {
            teamId: row.team_id,
            teamName,
            members: [],
          }

          if (!entry.members.find((member) => member.id === employeeRow.id)) {
            entry.members.push({
              id: employeeRow.id,
              name: `${employeeRow.first_name} ${employeeRow.last_name}`.trim(),
              email: employeeRow.email,
              status: employeeRow.status,
              position: positionMap.get(employeeRow.id) ?? null,
            })
          }

          teamMap.set(row.team_id, entry)
        })

        setTeams(Array.from(teamMap.values()))
      } catch (err) {
        console.error('Failed to load team members:', err)
        setError(err instanceof Error ? err.message : 'Failed to load team members')
      } finally {
        setIsLoading(false)
      }
    }

    loadTeams()
  }, [employee])

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
    <div className="max-w-6xl mx-auto space-y-6">
      {isLoading || isLoadingEmployee ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading team...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <p className="text-gray-500">No team members found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => {
            const filteredMembers = team.members.filter((member) => {
              if (statusFilter === 'All') return true
              const statusValue = member.status?.toLowerCase() ?? ''
              const isActive = statusValue.includes('active') && !statusValue.includes('inactive')
              return statusFilter === 'Active' ? isActive : !isActive
            })

            if (!filteredMembers.length) return null

            return (
            <div key={team.teamId} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[14px] font-semibold">
                    {team.teamName}
                  </span>
                  <span className="text-[12px] text-gray-500 font-medium">
                    {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[12px] font-medium text-gray-500">Filters</label>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'Active' | 'Inactive' | 'All')}
                    className="text-[12px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="All">All</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[12px] border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500">
                      <th className="px-5 py-3 font-semibold uppercase tracking-wide rounded-tl-xl">Member</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wide">Position</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wide">Email</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wide rounded-tr-xl text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => {
                      const statusValue = member.status?.toLowerCase() ?? ''
                      const isActive = statusValue.includes('active') && !statusValue.includes('inactive')
                      return (
                        <tr key={member.id} className="text-gray-700">
                          <td className="px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white text-[11px] font-semibold flex items-center justify-center">
                                {getInitials(member.name) || 'NA'}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-gray-900 truncate">{member.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 border-b border-gray-100 text-gray-600">
                            {member.position ?? '—'}
                          </td>
                          <td className="px-5 py-4 border-b border-gray-100">
                            {member.status ? (
                              <div
                                className={`flex items-center gap-2 text-[12px] font-semibold ${
                                  isActive ? 'text-emerald-500' : 'text-gray-400'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isActive
                                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                      : 'bg-gray-400'
                                  }`}
                                />
                                {member.status}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-5 py-4 border-b border-gray-100 text-gray-500">
                            {member.email}
                          </td>
                          <td className="px-5 py-4 border-b border-gray-100 text-right">
                            <div className="inline-flex items-center gap-2">
                              <Link
                                href={`/academy/manage?employeeId=${member.id}`}
                                className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-lg hover:bg-cyan-100 transition-colors"
                              >
                                Academy progress
                              </Link>
                              <Link
                                href={`/profile?employeeId=${member.id}`}
                                className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                Open profile
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  )
}
