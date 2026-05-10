'use client'

import { useEffect, useState } from 'react'
import { Hero, FrontendCounterResult, CounterScore, ItemRecommendation, CounterResult } from '@/types/hero'
import { getRoleColor, getRoleColorHex, getDamageTypeColor, getPlayStyleBadge } from '@/lib/utils'
import { Shield, Sword, TrendingUp, AlertTriangle, Users, Heart, Brain, Crosshair, Star, ChevronRight, Zap } from 'lucide-react'

interface CounterDashboardProps {
  selectedHeroes: Hero[]
}

export default function CounterDashboard({ selectedHeroes }: CounterDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [brainResult, setBrainResult] = useState<CounterResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Call Brain API when selected heroes change
  const [meta, setMeta] = useState<{ isAiEnhanced?: boolean; analysisType?: string; computationTimeMs?: number } | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)

  useEffect(() => {
    if (selectedHeroes.length === 0) {
      setBrainResult(null)
      setMeta(null)
      setAiAnalysis(null)
      setError(null)
      return
    }

    const fetchCounters = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/counter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enemyHeroes: selectedHeroes.map(h => h.name)
          }),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || 'Brain API error')
        }

        const result: FrontendCounterResult = await response.json()
        setBrainResult(result.data)
        setMeta(result.meta)
        setAiAnalysis(result.aiAnalysis)
      } catch (err: any) {
        setError(err.message || 'Failed to compute counter recommendations')
        setBrainResult(null)
        setMeta(null)
        setAiAnalysis(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCounters()
  }, [selectedHeroes])

  if (selectedHeroes.length === 0) {
    return (
      <div className="gaming-card text-center py-8">
        <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">No heroes selected</p>
        <p className="text-gray-500 text-sm mt-1">
          Select enemy heroes to get Brain-powered counter recommendations
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">
          <Brain className="w-4 h-4" />
          <span>Powered by MLBB Counter Pro Brain v2</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="gaming-card text-center py-8">
        <Brain className="w-12 h-12 text-gaming-accent mx-auto mb-3 animate-pulse" />
        <p className="text-gray-400">Brain computing...</p>
        <div className="flex justify-center mt-4 space-x-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-gaming-accent rounded-full animate-bounce" 
                 style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gaming-card text-center py-8 border-red-500/30">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-medium">Brain Error</p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (!brainResult) return null

  const { heroCounters, sameRoleCounters, itemRecommendations, analysis } = brainResult

  return (
    <div className="space-y-4">
      {/* 🧠 Brain Analysis Summary */}
      <div className="gaming-card bg-gradient-to-r from-gaming-accent/5 to-transparent border-gaming-accent/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-gaming-accent" />
            <h3 className="font-bold text-white">Brain Analysis</h3>
          </div>
          {meta && (
            <span className={`text-[10px] px-2 py-1 rounded font-medium ${
              meta.isAiEnhanced 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
               : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {meta.isAiEnhanced ? '🤖 AI Enhanced' : '⚙️ Algorithm'}
            </span>
          )}
        </div>
        {meta && (
          <p className="text-xs text-gray-500 mb-2">
            Analysis Type: {meta.analysisType || 'Algorithm Only'}
            {meta.computationTimeMs && ` • Computed in ${meta.computationTimeMs}ms`}
          </p>
        )}
        
        {/* Team Damage Profile */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Enemy Damage Profile</p>
          <div className="w-full bg-gaming-border rounded-full h-2.5 flex">
            <div className="bg-orange-500 h-2.5 rounded-l-full text-[8px] text-white text-center leading-none pt-0.5"
                 style={{ width: `${analysis.teamDamageProfile.physical}%` }}>
              {analysis.teamDamageProfile.physical > 15 ? `${analysis.teamDamageProfile.physical}% Phys` : ''}
            </div>
            <div className="bg-blue-500 h-2.5 rounded-r-full text-[8px] text-white text-center leading-none pt-0.5"
                 style={{ width: `${analysis.teamDamageProfile.magic}%` }}>
              {analysis.teamDamageProfile.magic > 15 ? `${analysis.teamDamageProfile.magic}% Magic` : ''}
            </div>
          </div>
        </div>

        {/* Team Insights */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-gaming-bg rounded p-1.5">
            <p className="text-gray-500">CC Level</p>
            <p className={`font-semibold ${
              analysis.teamCCLevel === 'high' ? 'text-red-400' :
              analysis.teamCCLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {analysis.teamCCLevel === 'high' ? '🔴 Hard' :
               analysis.teamCCLevel === 'medium' ? '🟡 Medium' : '🟢 Low'}
            </p>
          </div>
          <div className="bg-gaming-bg rounded p-1.5">
            <p className="text-gray-500">Power Spike</p>
            <p className="font-semibold text-gaming-accent capitalize">{analysis.teamPowerSpike}</p>
          </div>
          <div className="bg-gaming-bg rounded p-1.5">
            <p className="text-gray-500">Roles</p>
            <p className="font-semibold text-white">
              {Object.entries(analysis.teamRoleComposition).map(([role, count]) => `${role}${(count as number) > 1 ? `×${count}` : ''}`).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* 🏆 Top 3 Counter Heroes (Overall) */}
      <div className="gaming-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gaming-accent" />
            Top Counter Heroes
          </h3>
          <span className="text-xs text-gray-500">Overall Best</span>
        </div>

        {heroCounters.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <AlertTriangle className="w-4 h-4" />
            <span>No counter heroes found</span>
          </div>
        ) : (
          <div className="space-y-3">
            {heroCounters.map((counter: CounterScore, index: number) => (
              <div key={counter.heroId} className="bg-gaming-bg rounded-lg p-3 border border-gaming-border">
                <div className="flex items-center gap-3 mb-2">
                  {/* Rank */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-gray-400/20 text-gray-300' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    #{index + 1}
                  </div>
                  
                  {/* Hero Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                       style={{ background: `${getRoleColorHex(counter.role)}44` }}>
                    {counter.heroName.charAt(0)}
                  </div>

                  {/* Hero Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{counter.heroName}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded text-white" 
                            style={{ background: getRoleColorHex(counter.role) }}>
                        {counter.role}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Score: {counter.totalScore.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Score Gauge */}
                  <div className="text-right">
                    <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                         style={{
                           borderColor: counter.totalScore > 0.3 ? '#00ff88' : 
                                        counter.totalScore > 0 ? '#ffaa00' : '#ff4444',
                         }}>
                      <span className="text-xs font-bold text-white">
                        {(counter.totalScore * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breakdown Bars */}
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {Object.entries(counter.breakdown).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <div className="w-full bg-gaming-border rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${
                          (val as number) > 0 ? 'bg-gaming-success' : (val as number) === 0 ? 'bg-gray-500' : 'bg-red-400'
                        }`} style={{ width: `${Math.abs((val as number) * 100)}%` }} />
                      </div>
                      <span className="text-[8px] text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Reasons */}
                <div className="space-y-1">
                  {counter.reasons.slice(0, 2).map((reason: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 text-gaming-accent mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-400">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🎯 Same Role Counters (Lane Matchups) */}
      {sameRoleCounters && sameRoleCounters.length > 0 && (
        <div className="gaming-card border-gaming-accent/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-gaming-accent" />
              Lane Matchup Counters
            </h3>
            <span className="text-xs text-gaming-accent">Same Role Heroes</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Heroes from the same role as enemy picks - strong lane phase advantage
          </p>

          <div className="space-y-2">
            {sameRoleCounters.slice(0, 5).map((counter: CounterScore, index: number) => (
              <div key={counter.heroId} className="bg-gaming-bg rounded-lg p-2.5 border border-gaming-border">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gaming-accent/20 text-gaming-accent">
                    #{index + 1}
                  </div>
                  
                  {/* Hero Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                       style={{ background: `${getRoleColorHex(counter.role)}44` }}>
                    {counter.heroName.charAt(0)}
                  </div>

                  {/* Hero Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{counter.heroName}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded text-white" 
                            style={{ background: getRoleColorHex(counter.role) }}>
                        {counter.role}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Score: {counter.totalScore.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className={`text-sm font-bold ${
                      counter.totalScore > 0.3 ? 'text-gaming-success' : 
                      counter.totalScore > 0 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      +{(counter.totalScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🛡️ Top 3 Counter Items */}
      <div className="gaming-card">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-gaming-accent" />
          <h3 className="font-bold text-white">Counter Items</h3>
        </div>

        {itemRecommendations.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <AlertTriangle className="w-4 h-4" />
            <span>No specific item recommendations</span>
          </div>
        ) : (
          <div className="space-y-2">
            {itemRecommendations.map((item: ItemRecommendation) => (
              <div key={item.itemName} className="flex items-start gap-3 p-2.5 bg-gaming-bg rounded-lg border border-gaming-border">
                <div className="w-8 h-8 bg-gaming-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-gaming-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{item.itemName}</p>
                    <span className="text-xs font-bold text-gaming-accent">{item.score}/100</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{item.reason}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.map((tag: string) => (
                      <span key={tag} className="text-[9px] bg-gaming-border text-gray-400 px-1.5 py-0.5 rounded-full">
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🏷️ Enemy Team */}
      <div className="gaming-card">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-gaming-accent" />
          <h3 className="font-bold text-white text-sm">Analyzed Enemies</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {brainResult.enemyTeam.map((enemy: { heroId: number; name: string; role: string }) => (
            <div key={enemy.heroId} className="flex items-center gap-1.5 bg-gaming-bg rounded px-2 py-1 border border-gaming-border">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                   style={{ background: `${getRoleColorHex(enemy.role)}66` }}>
                {enemy.name.charAt(0)}
              </div>
              <span className="text-xs text-gray-300">{enemy.name}</span>
              <span className="text-[9px] text-gray-500">{enemy.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}