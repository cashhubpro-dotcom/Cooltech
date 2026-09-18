// JobStatusModal.jsx
// Place at: src/admin/components/ui/JobStatusModal.jsx

import { useState } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { JOB_STATUS } from '../../constants/statusMaps';
const STATUS_META = {
  assigned: {
    icon: '📋',
    desc: 'Job has been assigned to a technician.',
    confirmLabel: 'Mark Assigned'
  },
  in_progress: {
    icon: '🔧',
    desc: 'Technician is actively working on this job.',
    confirmLabel: 'Mark In Progress'
  },
  completed: {
    icon: '✅',
    desc: 'Job work is finished. Ready for invoicing.',
    confirmLabel: 'Mark Completed'
  },
  invoiced: {
    icon: '📄',
    desc: 'An invoice will be auto-created for this job.',
    confirmLabel: 'Mark & Create Invoice',
    warning: true
  },
  cancelled: {
    icon: '✕',
    desc: 'This job will be cancelled.',
    confirmLabel: 'Cancel Job',
    danger: true
  }
};
export default function JobStatusModal({
  job,
  targetStatus,
  onConfirm,
  onClose,
  loading,
  defaultRates,   // { labour, service } — the type-based default for this job's type
  partsTotal,     // sum of this job's parts, precomputed by the caller
  gstRate = 0.18
}) {
  const [note, setNote] = useState('');

  // Editable Labour/Service — only meaningful (and only shown) for
  // 'completed', where the admin can override this job's rate away from
  // the type-based default (e.g. it ran longer than a typical job of this
  // type, or extra work was involved). Pre-filled from an existing override
  // if this job was already completed once before (re-opening the modal),
  // otherwise from the type default.
  const [labour, setLabour] = useState(() => job?.labourCharge ?? defaultRates?.labour ?? 0);
  const [service, setService] = useState(() => job?.serviceCharge ?? defaultRates?.service ?? 0);

  if (!job || !targetStatus) return null;
  const m = JOB_STATUS[targetStatus] || {};
  const meta = STATUS_META[targetStatus] || {};
  const isDanger = meta.danger;
  const isWarning = meta.warning;
  const accentColor = isDanger ? '#DC2626' : isWarning ? '#0369A1' : m.color || COLORS.brand;
  const accentBg = isDanger ? '#FEF2F2' : isWarning ? '#EFF6FF' : m.bg || COLORS.brandL;
  return <div onClick={onClose} className="ap-job-status-modal-1">
      <div onClick={e => e.stopPropagation()} className="ap-job-status-modal-2">

        {/* ── Header ── */}
        <div className="ap-job-status-modal-3">
          <div style={{
          background: accentBg
        }} className="ap-job-status-modal-4">
            {meta.icon}
          </div>
          <div className="ap-job-status-modal-5">
            <div className="ap-job-status-modal-6">
              Update Status
            </div>
            <div className="ap-job-status-modal-7">
              {job.id} · {job.customer}
            </div>
          </div>
          <button onClick={onClose} className="ap-job-status-modal-8">✕</button>
        </div>

        {/* ── Body ── */}
        <div className="ap-job-status-modal-9">

          {/* Current → New status pill row */}
          <div className="ap-job-status-modal-10">
            <span style={{
            background: JOB_STATUS[job.status]?.bg || '#f3f4f6',
            color: JOB_STATUS[job.status]?.color || '#555'
          }} className="ap-job-status-modal-11">
              {JOB_STATUS[job.status]?.label || job.status}
            </span>
            <span className="ap-job-status-modal-12">→</span>
            <span style={{
            background: accentBg,
            color: accentColor,
            border: `1px solid ${accentColor}33`
          }} className="ap-job-status-modal-13">
              {m.label || targetStatus}
            </span>
          </div>

          {/* Description */}
          <div style={{
          background: accentBg,
          border: `1px solid ${accentColor}22`,
          color: accentColor
        }} className="ap-job-status-modal-14">
            {meta.icon} {meta.desc}

            {/* ── Mark Complete: editable labour/service for THIS job ──
                Defaults to the type-based rate but can be overridden here.
                No GST yet — that's only added at invoicing. */}
            {targetStatus === 'completed' && <div className="ap-job-status-modal-15">
                <div className="ap-job-status-modal-16">Cost for this job:</div>
                <div className="ap-job-status-modal-32">
                  <label className="ap-job-status-modal-33">Labour (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={labour}
                    onChange={e => setLabour(e.target.value === '' ? '' : Number(e.target.value))}
                    className="ap-job-status-modal-34"
                  />
                </div>
                <div className="ap-job-status-modal-32">
                  <label className="ap-job-status-modal-33">Service Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={service}
                    onChange={e => setService(e.target.value === '' ? '' : Number(e.target.value))}
                    className="ap-job-status-modal-34"
                  />
                </div>
                {partsTotal > 0 && <div className="ap-job-status-modal-17"><span>Parts</span><span className="ap-job-status-modal-18">₹{partsTotal.toLocaleString()}</span></div>}
                <div className="ap-job-status-modal-23">
                  <span>Subtotal</span>
                  <span className="ap-job-status-modal-24">₹{((Number(labour) || 0) + (Number(service) || 0) + partsTotal).toLocaleString()}</span>
                </div>
              </div>}

            {/* ── Invoice preview — real numbers from this job, using
                whatever labour/service was set at Mark Complete (or the
                type default if none was ever set), not hardcoded values. ── */}
            {targetStatus === 'invoiced' && <div className="ap-job-status-modal-15">
                <div className="ap-job-status-modal-16">Invoice will include:</div>
                <div className="ap-job-status-modal-17"><span>Labour</span><span className="ap-job-status-modal-18">₹{Number(labour || 0).toLocaleString()}</span></div>
                <div className="ap-job-status-modal-19"><span>Service Charge</span><span className="ap-job-status-modal-20">₹{Number(service || 0).toLocaleString()}</span></div>
                {partsTotal > 0 && <div className="ap-job-status-modal-21"><span>Parts</span><span className="ap-job-status-modal-22">₹{partsTotal.toLocaleString()}</span></div>}
                {(() => {
              const subtotal = (Number(labour) || 0) + (Number(service) || 0) + partsTotal;
              const gst = Math.round(subtotal * gstRate);
              const total = subtotal + gst;
              return <div className="ap-job-status-modal-23">
                      <span>Total (incl. {Math.round(gstRate * 100)}% GST)</span><span className="ap-job-status-modal-24">₹{total.toLocaleString()}</span>
                    </div>;
            })()}
              </div>}
          </div>

          {/* Optional note */}
          <div className="ap-job-status-modal-25">
            <label className="ap-job-status-modal-26">
              Note <span className="ap-job-status-modal-27">(optional)</span>
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={targetStatus === 'cancelled' ? 'Reason for cancellation…' : targetStatus === 'completed' ? 'Work summary or observations…' : 'Add a note about this status change…'} rows={3} className="ap-job-status-modal-28" />
          </div>

          {/* Action buttons */}
          <div className="ap-job-status-modal-29">
            <button onClick={onClose} className="ap-job-status-modal-30">
              Cancel
            </button>
            <button disabled={loading} onClick={() => onConfirm(
              targetStatus,
              note,
              null,
              targetStatus === 'completed' ? { labour: Number(labour) || 0, service: Number(service) || 0 } : {}
            )} style={{
            background: isDanger ? '#DC2626' : isWarning ? '#0369A1' : COLORS.brand,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? "0.7" : "1"
          }} className="ap-job-status-modal-31">
              {loading ? '⏳ Updating…' : meta.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>;
}