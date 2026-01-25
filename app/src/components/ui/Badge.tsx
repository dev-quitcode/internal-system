'use client'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  default: 'bg-[#F3F4F6] text-[#374151]',
  primary: 'bg-[#E6F7FE] text-[#12B7F5]',
  secondary: 'bg-[#F3E8FF] text-[#8B5CF6]',
  success: 'bg-[#D1FAE5] text-[#10B981]',
  warning: 'bg-[#FEF3C7] text-[#D97706]',
  danger: 'bg-[#FEE2E2] text-[#EF4444]',
  outline: 'bg-transparent border border-[#E5E7EB] text-[#6B7280]',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  )
}

// Specialized badges for common use cases
export function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' | 'critical' }) {
  const styles = {
    low: 'bg-[#E0F2FE] text-[#0369A1]',
    medium: 'bg-[#FEF3C7] text-[#D97706]',
    high: 'bg-[#FEE2E2] text-[#DC2626]',
    critical: 'bg-[#FCE7F3] text-[#BE185D]',
  }

  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current" />
      {labels[priority]}
    </span>
  )
}

export function StatusBadge({ status }: { status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'active' | 'paused' | 'completed' | 'archived' }) {
  const styles = {
    todo: 'bg-[#F3F4F6] text-[#6B7280]',
    in_progress: 'bg-[#FEF3C7] text-[#D97706]',
    done: 'bg-[#D1FAE5] text-[#10B981]',
    blocked: 'bg-[#FEE2E2] text-[#EF4444]',
    active: 'bg-[#E6F7FE] text-[#12B7F5]',
    paused: 'bg-[#FEF3C7] text-[#D97706]',
    completed: 'bg-[#D1FAE5] text-[#10B981]',
    archived: 'bg-[#F3F4F6] text-[#6B7280]',
  }

  const labels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    blocked: 'Blocked',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    archived: 'Archived',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

export function TypeBadge({ type }: { type: 'external' | 'internal' }) {
  const styles = {
    external: 'bg-[#E6F7FE] text-[#12B7F5]',
    internal: 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]',
  }

  const labels = {
    external: 'External',
    internal: 'Internal',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}
