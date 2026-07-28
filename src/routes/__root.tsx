/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { useEffect, type ReactNode } from 'react'
import indexCss from '../index.css?url'
import { supabase } from '@/integrations/supabase/client'

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`

const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { title: 'نونة — نقل ذكي عبر تيليجرام' },
      { name: 'description', content: 'منصة نقل ذكية تعمل عبر تيليجرام في المملكة العربية السعودية.' },
      { name: 'theme-color', content: '#0a0a0a' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'نونة — نقل ذكي' },
      { property: 'og:description', content: 'منصة نقل ذكية تعمل عبر تيليجرام في المملكة العربية السعودية.' },
      { property: 'og:locale', content: 'ar_SA' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'stylesheet', href: indexCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
        <script src="https://blink.new/widget.js?projectId=nona-taskboard-awj0hs1p" type="module" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={0}>
            <Toaster position="top-center" richColors />
            {children}
          </TooltipProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return
      queryClient.invalidateQueries()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return <Outlet />
}
