import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/chessRatings.inline"
import style from "./styles/chessRatings.scss"

const ChessRatings: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  if (fileData.slug !== "index") return null

  return (
    <section class="chess-ratings" aria-labelledby="chess-ratings-title">
      <div class="chess-ratings-heading">
        <div>
          <h2 id="chess-ratings-title">Chess</h2>
          <p>Chess.com · briyin</p>
        </div>
        <a href="https://www.chess.com/member/briyin" target="_blank" rel="noreferrer">
          View profile ↗
        </a>
      </div>
      <div class="chess-rating-grid" data-chess-ratings aria-live="polite">
        <p class="chess-ratings-loading">Loading ratings…</p>
      </div>
      <p class="chess-ratings-updated" data-chess-ratings-updated></p>
    </section>
  )
}

ChessRatings.css = style
ChessRatings.afterDOMLoaded = script

export default (() => ChessRatings) satisfies QuartzComponentConstructor
