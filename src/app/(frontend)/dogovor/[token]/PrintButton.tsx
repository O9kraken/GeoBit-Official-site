'use client'
export function PrintButton() {
  return (
    <button type="button" className="dg-btn" onClick={() => window.print()}>
      Печать / PDF
    </button>
  )
}
