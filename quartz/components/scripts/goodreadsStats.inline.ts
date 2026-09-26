type GoodreadsBook = {
  id: string
  title: string
  author: string
  link: string
  readAt: string | null
  rating: number
}

type GoodreadsData = {
  userId: string
  profileUrl: string
  fetchedAt: string
  year: number
  readBooks: GoodreadsBook[]
  currentlyReading: GoodreadsBook[]
}

function dateLabel(date: string | null): string {
  if (!date) return "Date not set"
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function bookLink(book: GoodreadsBook): HTMLAnchorElement {
  const link = document.createElement("a")
  link.href = book.link
  link.textContent = book.title
  link.target = "_blank"
  link.rel = "noreferrer"
  return link
}

function renderGoodreads(
  root: HTMLElement,
  list: HTMLElement,
  updated: HTMLElement,
  data: GoodreadsData,
) {
  const finishedThisYear = data.readBooks.filter((book) => {
    if (!book.readAt) return false
    return new Date(`${book.readAt}T00:00:00Z`).getUTCFullYear() === data.year
  })
  const latest = [...data.readBooks]
    .filter((book) => book.readAt)
    .sort((a, b) => new Date(b.readAt!).getTime() - new Date(a.readAt!).getTime())[0]

  const finishedCard = document.createElement("article")
  finishedCard.className = "goodreads-stat-card"
  const finishedLabel = document.createElement("p")
  finishedLabel.className = "goodreads-stat-label"
  finishedLabel.textContent = `Read in ${data.year}`
  const finishedValue = document.createElement("p")
  finishedValue.className = "goodreads-stat-value"
  finishedValue.textContent = String(finishedThisYear.length)
  const finishedDetail = document.createElement("p")
  finishedDetail.className = "goodreads-stat-detail"
  finishedDetail.textContent = "Finished books"
  finishedCard.append(finishedLabel, finishedValue, finishedDetail)

  const currentCard = document.createElement("article")
  currentCard.className = "goodreads-stat-card"
  const currentLabel = document.createElement("p")
  currentLabel.className = "goodreads-stat-label"
  currentLabel.textContent = "Currently reading"
  const currentValue = document.createElement("p")
  currentValue.className = "goodreads-stat-value"
  currentValue.textContent = String(data.currentlyReading.length)
  const currentDetail = document.createElement("p")
  currentDetail.className = "goodreads-stat-detail"
  currentDetail.textContent = "On your shelf"
  currentCard.append(currentLabel, currentValue, currentDetail)

  const latestCard = document.createElement("article")
  latestCard.className = "goodreads-stat-card goodreads-latest-card"
  const latestLabel = document.createElement("p")
  latestLabel.className = "goodreads-stat-label"
  latestLabel.textContent = "Latest finished"
  const latestValue = document.createElement("p")
  latestValue.className = "goodreads-stat-value"
  const latestDetail = document.createElement("p")
  latestDetail.className = "goodreads-stat-detail"
  if (latest) {
    latestValue.append(bookLink(latest))
    latestDetail.textContent = dateLabel(latest.readAt)
  } else {
    latestValue.textContent = "—"
    latestDetail.textContent = "No read dates in the feed"
  }
  latestCard.append(latestLabel, latestValue, latestDetail)
  root.replaceChildren(finishedCard, currentCard, latestCard)

  list.replaceChildren()
  if (data.currentlyReading.length > 0) {
    const heading = document.createElement("h3")
    heading.textContent = "On your currently reading shelf"
    const books = document.createElement("ul")
    for (const book of data.currentlyReading) {
      const item = document.createElement("li")
      item.append(bookLink(book))
      if (book.author) {
        const author = document.createElement("span")
        author.className = "goodreads-book-author"
        author.textContent = ` — ${book.author}`
        item.append(author)
      }
      books.append(item)
    }
    list.append(heading, books)
  }

  const updatedAt = new Date(data.fetchedAt)
  updated.textContent = `From public Goodreads shelves · Last checked ${updatedAt.toLocaleString()}.`
}

document.addEventListener("nav", () => {
  const root = document.querySelector<HTMLElement>("[data-goodreads-stats]")
  const list = document.querySelector<HTMLElement>("[data-goodreads-current-list]")
  const updated = document.querySelector<HTMLElement>("[data-goodreads-stats-updated]")
  if (!root || !list || !updated) return

  const controller = new AbortController()
  fetch("/static/goodreads-stats.json", { cache: "no-store", signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error("Goodreads stats are not available yet.")
      return response.json() as Promise<GoodreadsData>
    })
    .then((data) => renderGoodreads(root, list, updated, data))
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return
      root.replaceChildren()
      const message = document.createElement("p")
      message.className = "goodreads-stats-error"
      message.textContent =
        error instanceof Error ? error.message : "Could not load Goodreads stats."
      root.append(message)
    })

  window.addCleanup(() => controller.abort())
})
