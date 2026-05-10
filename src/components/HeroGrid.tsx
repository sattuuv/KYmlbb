'use client'

import { useEffect, useState } from 'react'
import { Hero, FrontendHeroesResult } from '@/types/hero'
import { getRoleColor, getDamageTypeColor, getPlayStyleBadge, getSurvivabilityColor, getRangeLabel, getPowerSpikeLabel } from '@/lib/utils'
import { Shield, Sword, Heart, Brain, Crosshair, Zap } from 'lucide-react'

interface HeroGridProps {
  selectedHeroes: Hero[]
  onHeroSelect: (hero: Hero) => void
  onHeroesLoad?: (heroes: Hero[]) => void
}

export default function HeroGrid({ selectedHeroes, onHeroSelect, onHeroesLoad }: HeroGridProps) {
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const response = await fetch('/api/heroes')
        const result: FrontendHeroesResult = await response.json()
        setHeroes(result.data)
        if (onHeroesLoad) {
          onHeroesLoad(result.data)
        }
      } catch {
        // Fallback: extract from static JSON
        const staticData = await import('@/data/heroes.json')
        const heroesData = staticData.default as Hero[]
        setHeroes(heroesData)
        if (onHeroesLoad) {
          onHeroesLoad(heroesData)
        }
      } finally {
        setLoading(false)
      }
    }
    loadHeroes()
  }, [])

  const filteredHeroes = heroes.filter(hero => 
    filter === 'all' || hero.role === filter
  )

  const isSelected = (hero: Hero) => 
    selectedHeroes.some(selected => selected.heroId === hero.heroId)

  const getPlayStyleLabel = (style: string) => {
    switch (style) {
      case 'burst': return '💥 Burst'
      case 'sustain': return '🔄 Sustain'
      case 'poke': return '🎯 Poke'
      default: return style
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="gaming-card animate-pulse">
            <div className="w-full h-32 bg-gray-700 rounded mb-3"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'].map(role => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === role
                ? 'bg-gaming-accent text-white'
                : 'bg-gaming-surface border border-gaming-border text-gray-300 hover:border-gaming-accent'
            }`}
          >
            {role === 'all' ? 'All Heroes' : role}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredHeroes.map((hero) => (
          <div
            key={hero.heroId}
            onClick={() => onHeroSelect(hero)}
            className={`hero-card ${isSelected(hero) ? 'selected' : ''}`}
          >
            {/* Avatar Area */}
            <div className="relative">
              <div className="w-full h-32 bg-gradient-to-br from-gaming-border to-gaming-surface rounded-lg mb-3 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" 
                     style={{ background: `${getRoleColor(hero.role)}33` }}>
                  <span className="text-2xl font-bold text-white">
                    {hero.name.charAt(0)}
                  </span>
                </div>
              </div>
              
              {/* Role Badge */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(hero.role)}`}>
                  {hero.role}
                </span>
              </div>

              {/* Damage Type Badge */}
              <div className="absolute top-2 left-2">
                <span className={`text-xs font-semibold ${getDamageTypeColor(hero.damageType)}`}>
                  {hero.damageType === 'physical' ? '🗡️' : hero.damageType === 'magic' ? '🔮' : '⚡'} {hero.damageType}
                </span>
              </div>
            </div>

            {/* Name & Title */}
            <h3 className="font-bold text-white mb-0.5">{hero.name}</h3>
            <p className="text-gray-500 text-xs mb-2 italic">{hero.title}</p>

            {/* Brain-based Attributes Row */}
            <div className="flex flex-wrap gap-1 mb-2">
              <span className={getPlayStyleBadge(hero.playStyle)}>
                {getPlayStyleLabel(hero.playStyle)}
              </span>
              <span className="text-xs text-gray-400 bg-gaming-bg px-1.5 py-0.5 rounded">
                {getRangeLabel(hero.range)}
              </span>
              <span className={`text-xs font-medium ${getSurvivabilityColor(hero.survivability)}`}>
                ❤️ {hero.survivability}
              </span>
              <span className="text-xs text-gray-400 bg-gaming-bg px-1.5 py-0.5 rounded">
                {getPowerSpikeLabel(hero.powerSpike)}
              </span>
            </div>

            {/* Brain Stats: HP, Phys Def, Magic Def */}
            <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-gaming-border">
              <div className="text-center">
                <Heart className="w-3 h-3 text-red-400 mx-auto" />
                <div className="w-full bg-gaming-border rounded-full h-1 mt-1">
                  <div className="bg-red-400 h-1 rounded-full" 
                       style={{ width: `${Math.min(100, (hero.stats.hp / 3500) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-gray-400">{hero.stats.hp}</span>
              </div>
              <div className="text-center">
                <Shield className="w-3 h-3 text-orange-400 mx-auto" />
                <div className="w-full bg-gaming-border rounded-full h-1 mt-1">
                  <div className="bg-orange-400 h-1 rounded-full" 
                       style={{ width: `${Math.min(100, (hero.stats.physicalDef / 35) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-gray-400">{hero.stats.physicalDef}</span>
              </div>
              <div className="text-center">
                <Crosshair className="w-3 h-3 text-blue-400 mx-auto" />
                <div className="w-full bg-gaming-border rounded-full h-1 mt-1">
                  <div className="bg-blue-400 h-1 rounded-full" 
                       style={{ width: `${Math.min(100, (hero.stats.magicDef / 25) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-gray-400">{hero.stats.magicDef}</span>
              </div>
            </div>

            {/* Tags */}
            {hero.tags && hero.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hero.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[10px] bg-gaming-accent/10 text-gaming-accent px-1.5 py-0.5 rounded-full">
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
                {hero.tags.length > 2 && (
                  <span className="text-[10px] text-gray-500">+{hero.tags.length - 2}</span>
                )}
              </div>
            )}

            {/* Selection indicator */}
            {isSelected(hero) && (
              <div className="mt-2 text-center">
                <Zap className="w-4 h-4 text-gaming-accent mx-auto animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}