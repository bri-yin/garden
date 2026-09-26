type Rating = {
  rating: number
  date: number
  best: number
}

type Snapshot = {
  date: string
  ratings: Record<string, Rating | null>
}

type RatingsData = {
  username: string
  fetchedAt: string
  history: Snapshot[]
}

const timeControls = [
  { key: "rapid", label: "Rapid" },
  { key: "blitz", label: "Blitz" },
  { key: "bullet", label: "Bullet" },
]

function sparkline(values: number[]): string {
  if (values.length < 2) return ""
  const width = 180
  const height = 34
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 1)
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - 3 - ((value - min) / span) * (height - 6)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Rating history"><polyline class="chess-rating-line" points="${points}" /></svg>`
}

function renderRatings(root: HTMLElement, updated: HTMLElement, data: RatingsData) {
  const latest = data.history[data.history.length - 1]
  if (!latest) throw new Error("No rating snapshots have been recorded yet.")

  root.innerHTML = timeControls
    .map(({ key, label }) => {
      const rating = latest.ratings[key]
      if (!rating) {
        return `<article class="chess-rating-card"><p class="chess-rating-name">${label}</p><p class="chess-rating-value">—</p><p class="chess-rating-best">No rating yet</p></article>`
      }
      const values = data.history
        .map((snapshot) => snapshot.ratings[key]?.rating)
        .filter((value): value is number => typeof value === "number")
      return `<article class="chess-rating-card"><p class="chess-rating-name">${label}</p><p class="chess-rating-value">${rating.rating.toLocaleString()}</p><p class="chess-rating-best">Peak ${rating.best.toLocaleString()}</p>${sparkline(values)}</article>`
    })
    .join("")

  const trackedSince = new Date(`${data.history[0].date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const updatedAt = new Date(data.fetchedAt)
  updated.textContent = `Daily snapshots since ${trackedSince}. Last checked ${updatedAt.toLocaleString()}. Chess.com may cache profile stats for up to 24 hours.`
}

document.addEventListener("nav", () => {
  const root = document.querySelector<HTMLElement>("[data-chess-ratings]")
  const updated = document.querySelector<HTMLElement>("[data-chess-ratings-updated]")
  if (!root || !updated) return

  const controller = new AbortController()
  fetch("/static/chess-ratings.json", { cache: "no-store", signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error("Ratings are not available yet.")
      return response.json() as Promise<RatingsData>
    })
    .then((data) => renderRatings(root, updated, data))
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return
      root.replaceChildren()
      const message = document.createElement("p")
      message.className = "chess-ratings-error"
      message.textContent =
        error instanceof Error ? error.message : "Could not load Chess.com ratings."
      root.append(message)
    })

  window.addCleanup(() => controller.abort())
})
