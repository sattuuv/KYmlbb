'use client'

import { useEffect, useState } from 'react'
import { Hero, DraftState, DraftResponse, DraftRecommendation } from '@/types/hero'
import { getRoleColor, getRoleColorHex } from '@/lib/utils'
import { 
  Sword, Shield, Users, Brain, RefreshCw, Play, 
  ChevronRight, Trophy, XCircle, CheckCircle, Sparkles,
  AlertTriangle, Info
} from 'lucide-react'

interface DraftSimulatorProps {
  allHeroes: Hero[]
}

export default function DraftSimulator({ allHeroes }: DraftSimulatorProps) {
  const [draftState, setDraftState] = useState<DraftState | null>(null)
  const [availableHeroes, setAvailableHeroes] = useState<Array<{ id: number; name: string; role: string }>>([])
  const [blueTeam, setBlueTeam] = useState<Array<{ id: number; name: string; role: string }>>([])
  const [redTeam, setRedTeam] = useState<Array<{ id: number; name: string; role: string }>>([])
  const [bannedHeroes, setBannedHeroes] = useState<Array<{ id: number; name: string }>>([])
  const [currentStep, setCurrentStep] = useState('')
  const [format, setFormat] = useState('classic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<{
    banRecommendations: DraftRecommendation[]
    pickRecommendations: DraftRecommendation[]
  } | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)

  // Initialize draft
  const createDraft = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', format }),
      })

      if (!response.ok) throw new Error('Failed to create draft')

      const result = await response.json()
      setDraftState(result.data.state)
      setAvailableHeroes(result.data.availableHeroes || [])
      setBlueTeam([])
      setRedTeam([])
      setBannedHeroes([])
      setCurrentStep(result.data.currentStep)
      setRecommendations(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle pick/ban action
  const handleAction = async (heroId: number) => {
    if (!draftState) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: draftState.phase,
          state: draftState,
          heroId,
        }),
      })

      if (!response.ok) throw new Error('Action failed')

      const result = await response.json()
      setDraftState(result.data.state)
      setAvailableHeroes(result.data.availableHeroes || [])
      setCurrentStep(result.data.currentStep)

      // Update teams and bans
      if (result.data.lastAction?.type === 'ban') {
        setBannedHeroes(prev => [...prev, { id: heroId, name: result.data.lastAction.heroName }])
      } else {
        if (result.data.lastAction?.team === 'blue') {
          setBlueTeam(prev => [...prev, { id: heroId, name: result.data.lastAction.heroName, role: allHeroes.find(h => h.heroId === heroId)?.role || '' }])
        } else {
          setRedTeam(prev => [...prev, { id: heroId, name: result.data.lastAction.heroName, role: allHeroes.find(h => h.heroId === heroId)?.role || '' }])
        }
      }

      // Get recommendations for next turn
      if (!result.data.state.isComplete) {
        getRecommendations(result.data.state)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get draft recommendations
  const getRecommendations = async (state: DraftState) => {
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recommend',
          state: state,
        }),
      })

      if (!response.ok) return

      const result = await response.json()
      if (result.data.basicRecommendations) {
        setRecommendations(result.data.basicRecommendations)
      }
    } catch (err) {
      console.error('Failed to get recommendations:', err)
    }
  }

  // Simulate complete draft
  const simulateDraft = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate', format }),
      })

      if (!response.ok) throw new Error('Simulation failed')

      const result = await response.json()
      setDraftState(result.data.state)
      setBlueTeam(result.data.blueTeam || [])
      setRedTeam(result.data.redTeam || [])
      setBannedHeroes(result.data.bannedHeroes || [])
      setAvailableHeroes([])
      setCurrentStep(result.data.currentStep)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get role-based recommendations for current turn
  const getRoleRecommendations = () => {
    if (!draftState || draftState.isComplete) return []

    const neededRoles = ['Tank', 'Support', 'Mage', 'Marksman', 'Assassin'].filter(role => {
      const currentTeam = draftState.currentTurn === 'blue' ? blueTeam : redTeam
      return !currentTeam.some(h => h.role === role)
    })

    return availableHeroes
      .filter(h => neededRoles.includes(h.role))
      .slice(0, 3)
  }

  if (!draftState) {
    return (
      <div className="gaming-card">
        <div className="text-center py-8">
          <Sword className="w-12 h-12 text-gaming-accent mx-auto mb-3" />
          <h3 className="font-bold text-white text-lg mb-2">Draft Simulator</h3>
          <p className="text-gray-400 text-sm mb-4">
            Simulate MLBB draft with bans and picks
          </p>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-gray-500">Format:</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="bg-gaming-bg border border-gaming-border rounded px-3 py-1 text-sm text-white"
            >
              <option value="classic">Classic (2 bans)</option>
              <option value="tournament">Tournament (3 bans)</option>
              <option value="pro">Pro League (5 bans)</option>
              <option value="quick">Quick (1 ban)</option>
            </select>
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={createDraft}
              disabled={loading}
              className="px-4 py-2 bg-gaming-accent text-black font-semibold rounded-lg hover:bg-gaming-accent/80 disabled:opacity-50"
            >
              New Draft
            </button>
            <button
              onClick={simulateDraft}
              disabled={loading}
              className="px-4 py-2 bg-gaming-secondary text-white font-semibold rounded-lg hover:bg-gaming-secondary/80 disabled:opacity-50"
            >
              Auto Simulate
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (draftState.isComplete) {
    return (
      <div className="gaming-card">
        <div className="text-center py-6">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h3 className="font-bold text-white text-lg mb-4">Draft Complete!</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Blue Team */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">Blue Team</h4>
              <div className="space-y-1">
                {blueTeam.map(h => (
                  <div key={h.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xs">{h.role}</span>
                    <span className="text-white">{h.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Red Team */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-red-400 font-semibold mb-2">Red Team</h4>
              <div className="space-y-1">
                {redTeam.map(h => (
                  <div key={h.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xs">{h.role}</span>
                    <span className="text-white">{h.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Banned Heroes */}
          {bannedHeroes.length > 0 && (
            <div className="mb-6">
              <h4 className="text-gray-400 text-sm mb-2">Banned Heroes ({bannedHeroes.length})</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {bannedHeroes.map(h => (
                  <span key={h.id} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded">
                    {h.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={createDraft}
            className="px-4 py-2 bg-gaming-accent text-black font-semibold rounded-lg hover:bg-gaming-accent/80"
          >
            New Draft
          </button>
        </div>
      </div>
    )
  }

  const isBanPhase = draftState.phase === 'ban'
  const isBlueTurn = draftState.currentTurn === 'blue'

  return (
    <div className="gaming-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sword className="w-5 h-5 text-gaming-accent" />
          <h3 className="font-bold text-white">Draft Simulator</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{format}</span>
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className={`p-1 rounded ${showRecommendations ? 'bg-gaming-accent/20 text-gaming-accent' : 'text-gray-500 hover:text-white'}`}
            title="Toggle AI Recommendations"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            onClick={createDraft}
            className="p-1 text-gray-500 hover:text-white"
            title="Reset Draft"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current Step Indicator */}
      <div className={`mb-4 p-3 rounded-lg ${isBlueTurn ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isBlueTurn ? (
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
            ) : (
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
            )}
            <span className={`font-semibold ${isBlueTurn ? 'text-blue-400' : 'text-red-400'}`}>
              {isBlueTurn ? 'Blue' : 'Red'} Team's Turn
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {isBanPhase ? '🚫 Ban Phase' : '⚔️ Pick Phase'}
          </span>
        </div>
      </div>

      {/* Teams Display */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Blue Team */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-blue-400 font-semibold">Blue Team</span>
            <span className="text-xs text-gray-500">{blueTeam.length}/5</span>
          </div>
          <div className="space-y-1">
            {blueTeam.map(h => (
              <div key={h.id} className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                     style={{ background: getRoleColorHex(h.role) }}>
                  {h.role.charAt(0)}
                </div>
                <span className="text-gray-300 truncate">{h.name}</span>
              </div>
            ))}
            {Array.from({ length: 5 - blueTeam.length }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-4 h-4 rounded-full border border-gray-700" />
                <span>Empty</span>
              </div>
            ))}
          </div>
        </div>

        {/* Red Team */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-red-400 font-semibold">Red Team</span>
            <span className="text-xs text-gray-500">{redTeam.length}/5</span>
          </div>
          <div className="space-y-1">
            {redTeam.map(h => (
              <div key={h.id} className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                     style={{ background: getRoleColorHex(h.role) }}>
                  {h.role.charAt(0)}
                </div>
                <span className="text-gray-300 truncate">{h.name}</span>
              </div>
            ))}
            {Array.from({ length: 5 - redTeam.length }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-4 h-4 rounded-full border border-gray-700" />
                <span>Empty</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banned Heroes */}
      {bannedHeroes.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <XCircle className="w-3 h-3 text-red-400" />
            <span className="text-xs text-gray-500">Banned ({bannedHeroes.length})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {bannedHeroes.map(h => (
              <span key={h.id} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                {h.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Panel */}
      {showRecommendations && recommendations && (
        <div className="mb-4 p-3 bg-gaming-accent/5 border border-gaming-accent/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-gaming-accent" />
            <span className="text-xs font-semibold text-gaming-accent">AI Recommendations</span>
          </div>
          <div className="space-y-1">
            {(isBanPhase ? recommendations.banRecommendations : recommendations.pickRecommendations)
              .slice(0, 3)
              .map((rec, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-gaming-accent">{i + 1}.</span>
                  <span className="text-gray-300">{rec.heroName}</span>
                  {rec.role && (
                    <span className="text-[9px] px-1 py-0.5 rounded text-white"
                          style={{ background: getRoleColorHex(rec.role) }}>
                      {rec.role}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Available Heroes */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            {isBanPhase ? 'Ban a hero' : `Pick for ${isBlueTurn ? 'Blue' : 'Red'} team`}
          </span>
          <span className="text-xs text-gray-500">{availableHeroes.length} available</span>
        </div>

        {/* Role-based filtering */}
        <div className="flex flex-wrap gap-1 mb-2">
          {['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'].map(role => {
            const count = availableHeroes.filter(h => h.role === role).length
            return (
              <span key={role} className="text-[10px] bg-gaming-bg px-2 py-0.5 rounded text-gray-400">
                {role}: {count}
              </span>
            )
          })}
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
          {availableHeroes.map(hero => (
            <button
              key={hero.id}
              onClick={() => handleAction(hero.id)}
              disabled={loading}
              className={`p-2 rounded-lg border transition-all text-left ${
                isBlueTurn 
                  ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60' 
                  : 'bg-red-500/10 border-red-500/30 hover:border-red-500/60'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mb-1"
                   style={{ background: getRoleColorHex(hero.role) }}>
                {hero.name.charAt(0)}
              </div>
              <div className="text-[10px] text-white truncate">{hero.name}</div>
              <div className="text-[8px] text-gray-500">{hero.role}</div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}