import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/goodreadsStats.inline"
import style from "./styles/goodreadsStats.scss"

const GoodreadsStats: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  if (fileData.slug !== "index") return null

  return (
    <section class="goodreads-stats" aria-labelledby="goodreads-stats-title">
      <div class="goodreads-stats-heading">
        <div>
          <h2 id="goodreads-stats-title">Reading</h2>
          <p>Goodreads · Brian Yin</p>
        </div>
        <a
          href="https://www.goodreads.com/user/show/175521183-brian-yin"
          target="_blank"
          rel="noreferrer"
        >
          View profile ↗
        </a>
      </div>
      <div class="goodreads-stats-grid" data-goodreads-stats aria-live="polite">
        <p class="goodreads-stats-loading">Loading reading stats…</p>
      </div>
      <div class="goodreads-current-list" data-goodreads-current-list></div>
      <p class="goodreads-stats-updated" data-goodreads-stats-updated></p>
    </section>
  )
}

GoodreadsStats.css = style
GoodreadsStats.afterDOMLoaded = script

export default (() => GoodreadsStats) satisfies QuartzComponentConstructor
