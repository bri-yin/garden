import { readFile, writeFile } from "node:fs/promises"

const username = "briyin"
const outputPath = new URL("../quartz/static/chess-ratings.json", import.meta.url)
const endpoint = `https://api.chess.com/pub/player/${username}/stats`

const response = await fetch(endpoint, {
  headers: { "User-Agent": "briany.in garden rating tracker (public website)" },
  signal: AbortSignal.timeout(20_000),
})
if (!response.ok) {
  throw new Error(`Chess.com API returned ${response.status} ${response.statusText}`)
}

const stats = await response.json()
const fetchedAt = new Date().toISOString()
const snapshotDate = fetchedAt.slice(0, 10)
const ratings = Object.fromEntries(
  ["rapid", "blitz", "bullet"].map((mode) => {
    const last = stats[`chess_${mode}`]?.last
    const best = stats[`chess_${mode}`]?.best
    if (!last || typeof last.rating !== "number") return [mode, null]
    return [
      mode,
      {
        rating: last.rating,
        date: typeof last.date === "number" ? last.date : 0,
        best: typeof best?.rating === "number" ? best.rating : last.rating,
      },
    ]
  }),
)

let existing = { username, fetchedAt, history: [] }
try {
  existing = JSON.parse(await readFile(outputPath, "utf8"))
} catch (error) {
  if (error.code !== "ENOENT") throw error
}

const history = Array.isArray(existing.history) ? existing.history : []
const current = { date: snapshotDate, ratings }
const sameDay = history.findIndex((entry) => entry.date === snapshotDate)
let snapshotChanged = false
if (sameDay >= 0) {
  if (JSON.stringify(history[sameDay].ratings) !== JSON.stringify(ratings)) {
    history[sameDay] = current
    snapshotChanged = true
  }
} else {
  history.push(current)
  snapshotChanged = true
}

const result = {
  username,
  profileUrl: `https://www.chess.com/member/${username}`,
  fetchedAt: snapshotChanged || !existing.fetchedAt ? fetchedAt : existing.fetchedAt,
  history: history.slice(-730),
}

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(`Updated ${username} Chess.com ratings (${snapshotDate})`)
