/**
 * Five — the convergence.
 *
 * Composition: the one inverted section in the document. Dark ground, paper
 * ink, wide measure, no table. Descending into it should feel like turning
 * from the plate onto a facing page of commentary -- a different room, not
 * another block.
 *
 * It exists because the comparison above is a list of differences, and the
 * agreements are the rarer and more interesting result. Buried as marked rows
 * among fifteen, they read as leftovers. Given their own ground, they read as
 * the finding they are.
 *
 * The two axes are separated here, and that separation is the point.
 * Agreement on a *sign* is genuinely rare: it survives a zodiac offset of most
 * of a sign, and only placements in the last few degrees manage it. Agreement
 * on a *house* is common, because Placidus and whole sign carve the same sky
 * and often land on the same answer. Listing both together produced "eight
 * placements survive the change of frame" for a chart where only three
 * survived the part that is hard -- true by the letter and wrong in what it
 * implied. So they are counted apart and labelled for what they are.
 */
import { AgreementWindow } from '../components/Figures'
import { type Comparison, FRAME_EXPLANATIONS } from '../engine/divergence'

export function Convergence({ comparison }: { comparison: Comparison | null }) {
  if (!comparison) return null

  const signAgreed = comparison.rows.filter((row) => row.sign.verdict === 'converge')
  // House-only: the house agrees but the sign does not, so it has not already
  // been reported above.
  const houseAgreed = comparison.rows.filter((row) =>
    row.house.verdict === 'converge' && row.sign.verdict !== 'converge')

  return (
    <section id="convergence" className="section section-inverted">
      <div className="shell">
        <span className="plate-number">Five — the convergence</span>
        <h2>Where they meet</h2>

        <p className="measure-wide lede-inverted">{FRAME_EXPLANATIONS.convergence}</p>

        <AgreementWindow
          gap={comparison.widestZodiacGap}
          window={comparison.signAgreementWindow}
        />

        <div className="meet-group">
          <h3 className="meet-group-head">Agreement on the sign</h3>
          <p className="measure-wide meet-count">
            {signAgreed.length === 0 ? (
              <>
                No placement in this chart keeps its sign across both zodiacs.
                With their origins {comparison.widestZodiacGap.toFixed(1)}° apart,
                only the final {comparison.signAgreementWindow.toFixed(1)}° of a
                sign survives the crossing, and nothing here fell in it. That is
                an ordinary outcome rather than a surprising one.
              </>
            ) : (
              <>
                {signAgreed.length === 1
                  ? 'One placement keeps its sign'
                  : `${signAgreed.length} of ${comparison.total} placements keep their sign`}{' '}
                across zodiacs that begin {comparison.widestZodiacGap.toFixed(1)}°
                apart. This is the hard kind of agreement: it requires the
                placement to sit in the last {comparison.signAgreementWindow.toFixed(1)}°
                of a tropical sign, which most placements do not.
              </>
            )}
          </p>

          {signAgreed.length > 0 && (
            <ul className="meet-list">
              {signAgreed.map((row) => (
                <li key={row.point} className="meet-entry">
                  <h4>{row.label}</h4>
                  <p className="meet-what">
                    <span className="meet-axis">
                      <span className="meet-axis-label">Sign</span>
                      {row.sign.convergedSign}
                    </span>
                    {row.house.convergedHouse !== null && (
                      <span className="meet-axis">
                        <span className="meet-axis-label">House</span>
                        {row.house.convergedHouse}
                      </span>
                    )}
                  </p>
                  <p className="meet-why">{row.sign.explanation}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {houseAgreed.length > 0 && (
          <div className="meet-group">
            <h3 className="meet-group-head">Agreement on the house alone</h3>
            <p className="measure-wide meet-count">
              {houseAgreed.length === 1
                ? 'One further placement lands'
                : `${houseAgreed.length} further placements land`}{' '}
              in the same house in both traditions while falling in different
              signs. This is the commoner agreement, and the weaker claim:
              Placidus and whole sign divide the same sky by different rules,
              but the rules coincide often enough that landing in the same
              twelfth of it is not much of a coincidence.
            </p>

            <ul className="meet-list meet-list-quiet">
              {houseAgreed.map((row) => (
                <li key={row.point} className="meet-entry">
                  <h4>{row.label}</h4>
                  <p className="meet-what">
                    <span className="meet-axis">
                      <span className="meet-axis-label">House</span>
                      {row.house.convergedHouse}
                    </span>
                  </p>
                  <p className="meet-why">{row.house.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
