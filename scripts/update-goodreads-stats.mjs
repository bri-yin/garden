import { readFile, writeFile } from "node:fs/promises"

const userId = "175521183"
const profileUrl = `https://www.goodreads.com/user/show/${userId}-brian-yin`
const outputPath = new URL("../quartz/static/goodreads-stats.json", import.meta.url)
const year = new Date().getUTCFullYear()

function field(item, name) {
  const match = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i"))
  if (!match) return ""
  return match[1]
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim()
}

function parseBooks(xml) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .map(([, item]) => {
      const id = field(item, "book_id")
      const readAt = field(item, "user_read_at")
      const parsedReadAt = readAt ? new Date(readAt) : null
      return {
        id,
        title: field(item, "title") || "Untitled",
        author: field(item, "author_name"),
        link: `https://www.goodreads.com/book/show/${id}`,
        readAt:
          parsedReadAt && !Number.isNaN(parsedReadAt.getTime())
            ? parsedReadAt.toISOString().slice(0, 10)
            : null,
        rating: Number(field(item, "user_rating")) || 0,
      }
    })
    .filter((book) => book.id)
}

async function fetchShelf(shelf) {
  const url = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${encodeURIComponent(shelf)}&per_page=100`
  const response = await fetch(url, {
    headers: { "User-Agent": "briany.in garden public shelf reader" },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`Goodreads ${shelf} shelf returned ${response.status}`)
  const xml = await response.text()
  if (!xml.includes("<rss")) throw new Error(`Goodreads ${shelf} shelf did not return RSS XML`)
  return parseBooks(xml)
}

let existing = null
try {
  existing = JSON.parse(await readFile(outputPath, "utf8"))
} catch (error) {
  if (error.code !== "ENOENT") throw error
}

try {
  const [readBooks, currentlyReading] = await Promise.all([
    fetchShelf("read"),
    fetchShelf("currently-reading"),
  ])
  const result = {
    userId,
    profileUrl,
    fetchedAt: new Date().toISOString(),
    year,
    readBooks,
    currentlyReading,
  }
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`)
  console.log(
    `Updated Goodreads stats: ${readBooks.length} read-shelf entries, ${currentlyReading.length} currently reading`,
  )
} catch (error) {
  if (!existing) throw error
  console.warn(`Goodreads feed refresh failed; keeping last snapshot: ${error.message}`)
}
