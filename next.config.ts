import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // версия статики для сброса кэша /legacy/* после каждого деплоя (см. src/lib/asset.ts)
  env: { NEXT_PUBLIC_ASSET_V: Date.now().toString(36) },
  // Адреса как на старом сайте WordPress: /services/landing-page/
  trailingSlash: true,
  output: 'standalone',
  poweredByHeader: false,
  // Красивые адреса картинок: /media/файл.webp → файловый эндпоинт Payload
  // Служебные адреса WordPress, которые могли попасть в поиск или закладки
  async redirects() {
    return [
      { source: '/feed/', destination: '/blog/', statusCode: 301 },
      { source: '/comments/feed/', destination: '/blog/', statusCode: 301 },
      { source: '/:slug/feed/', destination: '/:slug/', statusCode: 301 },
      { source: '/author/:name/', destination: '/blog/', statusCode: 301 },
      { source: '/blog/page/:n/', destination: '/blog/?paged=:n', statusCode: 301 },
      { source: '/home/', destination: '/', statusCode: 301 },
      { source: '/sitemap_index.xml', destination: '/sitemap.xml', statusCode: 301 },
      { source: '/page-sitemap.xml', destination: '/sitemap.xml', statusCode: 301 },
      { source: '/post-sitemap.xml', destination: '/sitemap.xml', statusCode: 301 },
      { source: '/service-sitemap.xml', destination: '/sitemap.xml', statusCode: 301 },
      { source: '/portfolio-sitemap.xml', destination: '/sitemap.xml', statusCode: 301 },
    ]
  },
  // Защитные заголовки
  async headers() {
    const base = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
    ]
    // загруженные файлы (в том числе SVG) никогда не исполняют скрипты, даже если открыть их напрямую
    const files = [
      { key: 'Content-Security-Policy', value: "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox" },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ]
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
    return [
      { source: '/:path*', headers: base },
      { source: '/api/media/file/:path*', headers: files },
      { source: '/media/:path*', headers: files },
      { source: '/admin/:path*', headers: noindex },
      { source: '/api/:path*', headers: noindex },
    ]
  },
  async rewrites() {
    return [{ source: '/media/:file', destination: '/api/media/file/:file' }]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
