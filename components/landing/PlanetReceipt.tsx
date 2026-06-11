'use client'

import { RECEIPT_ITEMS, RECEIPT_TOTAL_KG, RECEIPT_SOURCE } from '@/lib/landing/climate-data'
import { formatNumber } from '@/lib/utils'

/**
 * IDEA 3 — THE RECEIPT
 *
 * The planet sent you a bill. Styled like a torn thermal POS receipt —
 * jagged top and bottom edges, a gentle wobble on hover, line items for
 * the average global footprint, a total, and a "PAID BY" stamp that
 * nobody asked to sign. The global average per-person footprint is ~4.7
 * tonnes CO2/year (Our World in Data, 2023) — this receipt itemises
 * exactly where that comes from.
 */
export function PlanetReceipt() {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return (
    <div className="mx-auto max-w-sm" data-burst>
      <div className="receipt-paper-raw mono -rotate-[0.6deg] px-6 pt-12 pb-14 text-[13px]">
        <div className="text-center mb-4">
          <p className="text-base font-black tracking-[0.2em]">PLANET EARTH</p>
          <p className="text-[10px] text-[#6b6458] mt-0.5">ATMOSPHERE &middot; TROPOSPHERE BRANCH</p>
          <p className="text-[10px] text-[#6b6458]">REG NO. 4.54-BILLION-YR</p>
        </div>

        <div className="border-t border-dashed border-[#b8b0a0] my-3" />

        <div className="flex justify-between text-[11px] text-[#6b6458] mb-1">
          <span>DATE: {dateStr}</span>
          <span>CUST: YOU</span>
        </div>
        <div className="flex justify-between text-[11px] text-[#6b6458] mb-3">
          <span>BILLING PERIOD: 1 YEAR</span>
          <span>QTY: x1 PERSON</span>
        </div>

        <div className="border-t border-dashed border-[#b8b0a0] my-3" />

        <p className="text-[11px] font-bold tracking-widest mb-2">ITEMISED CHARGES — CO&#8322; EMITTED</p>

        <div className="space-y-2.5 mb-3">
          {RECEIPT_ITEMS.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between font-bold">
                <span>{item.label}</span>
                <span className="tabular-nums">{formatNumber(item.kg)} kg</span>
              </div>
              <p className="text-[10px] text-[#9a9182]">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-[#b8b0a0] my-3" />

        <div className="flex justify-between text-base font-black mb-1">
          <span>TOTAL</span>
          <span className="tabular-nums">{formatNumber(RECEIPT_TOTAL_KG)} kg CO&#8322;</span>
        </div>
        <div className="flex justify-between text-[11px] text-[#6b6458] mb-4">
          <span>≈</span>
          <span className="tabular-nums">{(RECEIPT_TOTAL_KG / 1000).toFixed(1)} tonnes CO&#8322;</span>
        </div>

        <div className="border-t border-dashed border-[#b8b0a0] my-3" />

        {/* "PAID BY" stamp — dashed border, rotated, matching the artifact */}
        <div className="flex justify-center my-5">
          <div className="rotate-[-1.5deg] border-2 border-dashed border-[#b03a2e] px-4 py-2.5 text-center">
            <p className="text-[#b03a2e] text-[10px] font-black tracking-[0.15em] leading-tight uppercase">Paid by</p>
            <p className="text-[#b03a2e] text-base font-black tracking-[0.2em] leading-tight uppercase mt-1">
              Future Generations
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#9a9182] leading-relaxed mb-4">
          No refunds. No returns. Balance carried forward — with interest, in the form of more
          frequent extreme weather, rising seas, and lost ecosystems.
        </p>

        {/* Barcode */}
        <div className="flex justify-center gap-[2px] mb-2" aria-hidden="true">
          {[2,1,3,1,1,2,4,1,2,1,1,3,2,1,4,1,2,2,1,3,1,2,1,4,2,1,1,3].map((w, i) => (
            <div key={i} className="bg-[#1c1a16]" style={{ width: `${w}px`, height: '28px' }} />
          ))}
        </div>
        <p className="text-center text-[9px] tracking-[0.3em] text-[#9a9182]">THIS IS NOT A DRILL</p>
      </div>

      <p className="mono mt-4 text-center text-[11px] text-[var(--tm-ash)] leading-relaxed">{RECEIPT_SOURCE}</p>
    </div>
  )
}
