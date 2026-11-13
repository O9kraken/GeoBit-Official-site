import { av } from '@/lib/asset'
import type { Metadata, Viewport } from 'next'
import React from 'react'

import Footer from '@/components/Footer'
import Dock from '@/components/sections/Dock'
import Header from '@/components/Header'
import { LeadModal } from '@/components/LeadForm'
import PreviewRefresh from '@/components/PreviewRefresh'
import LegacyScripts from '@/components/LegacyScripts'
import { JsonLd, LogoInner } from '@/components/Common'
import { getGlobal, getServices } from '@/lib/payload'
import { organizationSchema } from '@/lib/seo'
import { SITE_URL } from '@/lib/util'

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#080808' }

// Страницы собираются по запросу из базы: правки в админке видны сразу, а сборка в CI не требует доступа к БД
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getGlobal<any>('settings')
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: 'GeoBit', template: '%s' },
    icons: { icon: '/favicon.svg' },
    verification: {
      yandex: s?.yandexVerification || undefined,
      google: s?.googleVerification || undefined,
    },
    openGraph: { locale: 'ru_RU', siteName: 'GeoBit', type: 'website' },
    twitter: { card: 'summary_large_image' },
  }
}

const THEME_INIT = `(function(){document.documentElement.setAttribute('data-theme','dark');try{localStorage.removeItem('adelf-theme')}catch(e){}})();`

const COMMON_SCRIPTS = [
  '/legacy/js/main.js',
  '/legacy/js/inline-footer-0.js',
  '/legacy/js/inline-footer-1.js',
  '/legacy/js/metrika.js',
]

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [s, services] = await Promise.all([getGlobal<any>('settings'), getServices()])
  const cfg = {
    metrikaId: s?.metrikaId || '',
    chatSrc: s?.chatWidgetSrc || '',
  }
  const boot = `try{if(window.self!==window.top)document.documentElement.classList.add('gb-in-preview')}catch(e){}${THEME_INIT}window.GEOBIT_CFG=${JSON.stringify(cfg)};window.adelfAjax={ajaxUrl:'/ajax/',nonce:'geobit'};window.adelfSubNonce='geobit';window.adelfCube={three:'/legacy/vendor/three.min.js'};`

  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        <link rel="stylesheet" href={av("/legacy/css/fonts.css")} />
        <link rel="stylesheet" href={av("/legacy/vendor/fa/css/all.min.css")} />
        <link rel="stylesheet" href={av("/legacy/css/style.css")} />
        <link rel="stylesheet" href={av("/legacy/css/geobit.css")} />
      </head>
      <body suppressHydrationWarning>
        <PreviewRefresh />
        <div id="preloader">
          <div className="preloader-inner">
            <div className="preloader-logo logo--svg">
              <LogoInner />
            </div>
            <div className="preloader-bar">
              <div className="preloader-fill"></div>
            </div>
          </div>
        </div>
        <Header />
        <Dock variant="top" />
        <LegacyScripts src={COMMON_SCRIPTS} />
        {children}
        <Footer />
        <LeadModal services={services.map((sv: any) => sv.title)} />
        <JsonLd data={organizationSchema(s)} />
      </body>
    </html>
  )
}
