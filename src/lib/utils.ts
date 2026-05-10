export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    'Tank': 'bg-red-500',
    'Fighter': 'bg-orange-500',
    'Assassin': 'bg-purple-500',
    'Mage': 'bg-blue-500',
    'Marksman': 'bg-green-500',
    'Support': 'bg-yellow-500'
  }
  return roleColors[role] || 'bg-gray-500'
}

export function getRoleColorHex(role: string): string {
  const roleColors: Record<string, string> = {
    'Tank': '#ef4444',
    'Fighter': '#f97316',
    'Assassin': '#a855f7',
    'Mage': '#3b82f6',
    'Marksman': '#22c55e',
    'Support': '#eab308'
  }
  return roleColors[role] || '#6b7280'
}

export function getDamageTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'physical': 'text-orange-400',
    'magic': 'text-blue-400',
    'mixed': 'text-purple-400'
  }
  return colors[type] || 'text-gray-400'
}

export function getPlayStyleBadge(style: string): string {
  const badges: Record<string, string> = {
    'burst': 'bg-red-500/20 text-red-400',
    'sustain': 'bg-green-500/20 text-green-400',
    'poke': 'bg-yellow-500/20 text-yellow-400'
  }
  return badges[style] || 'bg-gray-500/20 text-gray-400'
}

export function getSurvivabilityColor(level: string): string {
  const colors: Record<string, string> = {
    'low': 'text-red-400',
    'medium': 'text-yellow-400',
    'high': 'text-green-400'
  }
  return colors[level] || 'text-gray-400'
}

export function getMobilityIcon(mobility: string): string {
  const icons: Record<string, string> = {
    'low': '🐢',
    'medium': '🏃',
    'high': '⚡'
  }
  return icons[mobility] || '❓'
}

export function getCCLabel(cc: string): string {
  const labels: Record<string, string> = {
    'none': 'No CC',
    'soft': 'Soft CC',
    'hard': 'Hard CC'
  }
  return labels[cc] || 'Unknown'
}

export function getRangeLabel(range: string): string {
  return range === 'melee' ? '⚔️ Melee' : '🎯 Ranged'
}

export function getPowerSpikeLabel(spike: string): string {
  const labels: Record<string, string> = {
    'early': '🌅 Early',
    'mid': '☀️ Mid',
    'late': '🌙 Late'
  }
  return labels[spike] || 'Unknown'
}