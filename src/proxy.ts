import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const timestamp = new Date().toISOString()
  const method = request.method
  const pathname = request.nextUrl.pathname

  // Print the log of every incoming request (process) on the terminal
  console.log(`[PROCESS LOG] ${timestamp} | METHOD: ${method} | PATH: ${pathname}`)

  try {
    return NextResponse.next()
  } catch (error) {
    // Print the error specially on the terminal itself
    console.error(`[ERROR LOG] ${timestamp} | METHOD: ${method} | PATH: ${pathname}`)
    console.error('Error Details:', error)
    throw error
  }
}

export const config = {
  // This matcher ensures the middleware runs on all routes except static assets
  matcher: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
}
