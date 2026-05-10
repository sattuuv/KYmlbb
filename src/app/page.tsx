'use client'

import { useState } from 'react'
import HeroGrid from '@/components/HeroGrid'
import CounterDashboard from '@/components/CounterDashboard'
import DraftSimulator from '@/components/DraftSimulator'
import { Hero } from '@/types/hero'

export default function Home() {
  const [selectedHeroes, setSelectedHeroes] = useState<Hero[]>([])
  const [activeTab, setActiveTab] = useState<'counter' | 'draft'>('counter')
  const [allHeroes, setAllHeroes] = useState<Hero[]>([])

  const handleHeroSelect = (hero: Hero) => {
    setSelectedHeroes(prev => {
      const exists = prev.find(h => h.heroId === hero.heroId)
      if (exists) {
        return prev.filter(h => h.heroId !== hero.heroId)
      }
      if (prev.length >= 5) {
        return prev.slice(1).concat(hero)
      }
      return [...prev, hero]
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-bg to-gaming-surface">
      <header className="border-b border-gaming-border bg-gaming-surface/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gaming-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">ML</span>
              </div>
              <h1 className="text-2xl font-bold text-white">MLBB Counter Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Tab Navigation */}
              <div className="flex bg-gaming-bg rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('counter')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'counter'
                      ? 'bg-gaming-accent text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Counter
                </button>
                <button
                  onClick={() => setActiveTab('draft')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'draft'
                      ? 'bg-gaming-accent text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Draft Simulator
                </button>
              </div>
              <span className="text-gray-300 text-sm">
                {selectedHeroes.length}/5 Heroes Selected
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'counter' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Select Enemy Heroes</h2>
                <HeroGrid 
                  selectedHeroes={selectedHeroes}
                  onHeroSelect={handleHeroSelect}
                  onHeroesLoad={setAllHeroes}
                />
              </section>
            </div>

            <div className="lg:col-span-1">
              <section className="sticky top-24">
                <h2 className="text-xl font-bold text-white mb-4">Counter Dashboard</h2>
                <CounterDashboard 
                  selectedHeroes={selectedHeroes}
                />
              </section>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Draft Simulator</h2>
              <DraftSimulator allHeroes={allHeroes} />
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-gaming-border bg-gaming-surface/90 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>MLBB Counter Pro - Professional Strategy Tool</p>
            <p className="mt-1">
              {activeTab === 'counter' 
                ? 'Select up to 5 enemy heroes to get counter recommendations' 
                : 'Simulate draft with bans and picks'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
