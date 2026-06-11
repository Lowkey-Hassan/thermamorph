'use client'

import { RECEIPT_ITEMS, RECEIPT_TOTAL_KG, RECEIPT_SOURCE } from '@/lib/landing/climate-data'
import { formatNumber } from '@/lib/utils'

/**
 * IDEA 3 — THE RECEIPT
 *
 * The planet sent you a bill. Styled like a crumpled thermal POS receipt —
 * line items for the average global footprint, a total, and a "PAID BY"
 * stamp that nobody asked to sign. The global average per-person footprint
 * is ~4.7 tonnes CO2/year (Our World in Data, 2023) — this receipt itemises
 * exactly where that comes from.
 */
export function PlanetReceipt() {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return (
    <div className="mx-auto max-w-sm">
      <div className="animate-receipt-drop receipt-paper receipt-jagged-bottom rounded-sm px-6 pt-7 pb-10 font-mono text-[13px] text-slate-800 -rotate-[0.6deg]">
        <div className="text-center mb-4">
          <p className="text-base font-black tracking-[0.2em]">PLANET EARTH</p>
          <p className="text-[10px] text-slate-500 mt-0.5">ATMOSPHERE &middot; TROPOSPHERE BRANCH</p>
          <p className="text-[10px] text-slate-500">REG NO. 4.54-BILLION-YR</p>
        </div>

        <div className="border-t border-dashed border-slate-300 my-3" />

        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
          <span>DATE: {dateStr}</span>
          <span>CUST: YOU</span>
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mb-3">
          <span>BILLING PERIOD: 1 YEAR</span>
          <span>QTY: x1 PERSON</span>
        </div>

        <div className="border-t border-dashed border-slate-300 my-3" />

        <p className="text-[11px] font-bold tracking-widest mb-2">ITEMISED CHARGES — CO&#8322; EMITTED</p>

        <div className="space-y-2.5 mb-3">
          {RECEIPT_ITEMS.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between font-bold">
                <span>{item.label}</span>
                <span className="tabular-nums">{formatNumber(item.kg)} kg</span>
              </div>
              <p className="text-[10px] text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-slate-300 my-3" />

        <div className="flex justify-between text-base font-black mb-1">
          <span>TOTAL</span>
          <span className="tabular-nums">{formatNumber(RECEIPT_TOTAL_KG)} kg CO&#8322;</span>
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mb-4">
          <span>≈</span>
          <span className="tabular-nums">{(RECEIPT_TOTAL_KG / 1000).toFixed(1)} tonnes CO&#8322;</span>
        </div>

        <div className="border-t border-dashed border-slate-300 my-3" />

        {/* "PAID BY" stamp */}
        <div className="flex justify-center my-5">
          <div className="rotate-[-6deg] border-[3px] border-red-500/70 rounded-md px-4 py-2 text-center">
            <p className="text-red-500/80 text-[10px] font-black tracking-widest leading-tight">PAID IN FULL BY</p>
            <p className="text-red-500/80 text-sm font-black tracking-wider leading-tight">FUTURE</p>
            <p className="text-red-500/80 text-sm font-black tracking-wider leading-tight">GENERATIONS</p>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 leading-relaxed mb-4">
          No refunds. No returns. Balance carried forward — with interest, in the form of more
          frequent extreme weather, rising seas, and lost ecosystems.
        </p>

        {/* Barcode */}
        <div className="flex justify-center gap-[2px] mb-2" aria-hidden="true">
          {[2,1,3,1,1,2,4,1,2,1,1,3,2,1,4,1,2,2,1,3,1,2,1,4,2,1,1,3].map((w, i) => (
            <div key={i} className="bg-slate-800" style={{ width: `${w}px`, height: '28px' }} />
          ))}
        </div>
        <p className="text-center text-[9px] tracking-[0.3em] text-slate-400">THIS IS NOT A DRILL</p>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-400 leading-relaxed">{RECEIPT_SOURCE}</p>
    </div>
  )
}
