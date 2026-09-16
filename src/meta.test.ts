/**
 * Static metadata.
 *
 * LinkedIn and most other crawlers do not run JavaScript, so every one of
 * these tags has to be present in the served HTML with an absolute URL. A
 * relative og:image silently produces no preview at all, and the failure is
 * invisible until someone shares the link.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync('index.html', 'utf8')
const SITE = 'https://astrodivergence.pages.dev'

function content(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern)
  return match ? match[1] : null
}

describe('Open Graph and canonical', () => {
  it('sets a canonical URL', () => {
    expect(content(html, /<link rel="canonical" href="([^"]+)"/)).toBe(`${SITE}/`)
  })

  it.each([
    ['og:url', /property="og:url" content="([^"]+)"/],
    ['og:image', /property="og:image" content="([^"]+)"/],
  ])('%s is absolute and on the canonical host', (_name, pattern) => {
    const value = content(html, pattern)
    expect(value).not.toBeNull()
    expect(value!.startsWith(`${SITE}/`), `${value} is not absolute on ${SITE}`).toBe(true)
  })

  it('declares the image dimensions, which some crawlers require', () => {
    expect(html).toMatch(/property="og:image:width" content="1200"/)
    expect(html).toMatch(/property="og:image:height" content="630"/)
  })

  it('has a title and description in the static markup', () => {
    expect(content(html, /<title>([^<]+)<\/title>/)).toBeTruthy()
    expect(content(html, /<meta\s+name="description"\s+content="([^"]+)"/s)).toBeTruthy()
    expect(content(html, /property="og:title" content="([^"]+)"/)).toBeTruthy()
  })

  it('carries no leftover placeholder hostname', () => {
    const robots = readFileSync('public/robots.txt', 'utf8')
    const sitemap = readFileSync('public/sitemap.xml', 'utf8')
    for (const [name, source] of [
      ['index.html', html], ['robots.txt', robots], ['sitemap.xml', sitemap],
    ] as const) {
      expect(source, `${name} still points at a non-canonical host`)
        .not.toMatch(/https:\/\/(?!astrodivergence\.pages\.dev)[\w-]+\.pages\.dev/)
    }
  })
})
