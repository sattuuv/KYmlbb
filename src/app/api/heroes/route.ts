import { NextRequest, NextResponse } from 'next/server'
import heroesData from '@/data/heroes.json'
import { Hero } from '@/types/hero'

export async function GET(_request: NextRequest) {
  try {
    // Map JSON data to typed Hero objects
    const heroes: Hero[] = heroesData.map((h: any) => ({
      heroId: h.heroId,
      name: h.name,
      title: h.title || '',
      role: h.role,
      damageType: h.damageType || 'physical',
      playStyle: h.playStyle || 'sustain',
      mobility: h.mobility || 'medium',
      crowdControl: h.crowdControl || 'none',
      range: h.range || 'melee',
      survivability: h.survivability || 'medium',
      powerSpike: h.powerSpike || 'mid',
      tags: h.tags || [],
      imageUrl: h.imageUrl || `/heroes/${h.name.toLowerCase()}.png`,
      stats: h.stats || { hp: 2500, physicalAttack: 0, magicPower: 0, physicalDef: 0, magicDef: 0 },
      skills: h.skills || [],
      difficulty: h.difficulty || 'Medium',
      avatar: h.avatar || `/heroes/${h.name.toLowerCase()}.png`,
      description: h.description || '',
    }))

    return NextResponse.json({
      data: heroes,
      lastUpdated: new Date().toISOString(),
      version: '2.0.0'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch heroes data' },
      { status: 500 }
    )
  }
}