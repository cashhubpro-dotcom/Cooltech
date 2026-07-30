import { useState, useEffect, useCallback } from 'react';
import { creditNotesApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { KCard, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { createPortal } from 'react-dom';
import logoImg from '../../assets/logo.png';
import signatureImg from '../../assets/signature.png';

const normaliseCreditNote = cn => ({
  ...cn,
  id: cn.creditNoteId ?? 'CN-' + String(cn._id).slice(-6).toUpperCase(),
  total: cn.total ?? 0,
  date: cn.createdAt ? new Date(cn.createdAt).toLocaleDateString('en-GB') : '',
});

/* ─── CreditNoteTemplate ─────────────────────────────────── */
const CreditNoteTemplate = ({ creditNote }) => {
  const toWords = n => {
    if (!n) return '';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const conv = num => {
      if (num === 0) return '';
      if (num < 20) return ones[num] + ' ';
      if (num < 100) return tens[Math.floor(num / 10)] + ' ' + ones[num % 10] + ' ';
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + conv(num % 100);
      if (num < 100000) return conv(Math.floor(num / 1000)) + 'Thousand ' + conv(num % 1000);
      return conv(Math.floor(num / 100000)) + 'Lakh ' + conv(num % 100000);
    };
    return conv(Math.round(n)).trim() + ' Rupees Only';
  };

  return (
    <div style={{ fontFamily: FONTS.sans, padding: 32, background: '#fff', width: 750 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E3A5F' }}>Alisha Engineering</div>
              <div style={{ fontSize: 11, color: '#64748B', maxWidth: 380, marginTop: 4 }}>
                L.I.G-II -164 G.I.D.C HOUSING BOARD NEAR CHHOTALAL CHAR RASTA BESIDE SWAMINARAYAN MANDIR ODAHAV AHMEDABAD-382415
              </div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
              <img src={logoImg} alt="Alisha Engineering" style={{ height: 48 }}
                onError={e => { e.target.outerHTML = `<div style="font-size:20px;font-weight:900;color:#1E3A5F;text-align:right">ALISHA<br/>ENGINEERING</div>`; }} />
            </td>
          </tr>
        </tbody>
      </table>
      <hr style={{ border: 'none', borderTop: '2px solid #1E3A5F', marginBottom: 16 }} />

      <div style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED', marginBottom: 12, letterSpacing: '.03em' }}>
        CREDIT NOTE
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
        <tbody>
          <tr>
            <td style={{ padding: '4px 0' }}><strong>Credit Note #:</strong> {creditNote.id}</td>
            <td style={{ padding: '4px 0', textAlign: 'right' }}><strong>Date:</strong> {creditNote.date}</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 0' }}><strong>Against Invoice #:</strong> {creditNote.invoiceNo}</td>
            <td style={{ padding: '4px 0', textAlign: 'right' }}><strong>Status:</strong> {creditNote.status}</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '4px 0' }}><strong>Customer:</strong> {creditNote.customer}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, border: '1px solid #000' }}>
        <thead>
          <tr style={{ background: '#1E3A5F', color: '#fff' }}>
            <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700 }}>DESCRIPTION</td>
            <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>AMOUNT</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px 10px', border: '1px solid #bbb', fontSize: 12 }}>
              Credit against invoice {creditNote.invoiceNo}
              {creditNote.reason ? ` — ${creditNote.reason}` : ''}
            </td>
            <td style={{ padding: '8px 10px', border: '1px solid #bbb', textAlign: 'right', fontFamily: 'monospace' }}>
              ₹{(creditNote.subtotal ?? 0).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', border: '1px solid #bbb', textAlign: 'right', fontWeight: 600 }}>GST</td>
            <td style={{ padding: '8px 10px', border: '1px solid #bbb', textAlign: 'right', fontFamily: 'monospace' }}>
              ₹{(creditNote.gstAmount ?? 0).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', border: '1px solid #bbb', textAlign: 'right', fontWeight: 800 }}>TOTAL CREDITED</td>
            <td style={{ padding: '8px 10px', border: '1px solid #bbb', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#7C3AED' }}>
              ₹{(creditNote.total ?? 0).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: 12, marginBottom: 24 }}>
        <strong>Amount in words:</strong> {toWords(creditNote.total)}
      </div>

      <div style={{ marginTop: 40, fontSize: 12 }}>
        <div>Thanking You,</div>
        <div style={{ fontWeight: 700, marginTop: 24 }}>Mr. VAKIL YADAV</div>
        <div>9724763909</div>
        <div>From: Alisha Engineering</div>
        <img src={signatureImg} alt="Signature" style={{ height: 40, marginTop: 4 }} onError={e => { e.target.style.display = 'none'; }} />
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>[Authorized Signatory]</div>
      </div>
    </div>
  );
};

/* ─── CreditNotePDFModal ──────────────────────────────────── */
const CreditNotePDFModal = ({ open, onClose, creditNote }) => {
  useEffect(() => {
    if (!open) return;
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || !creditNote) return null;

  const handlePrint = () => {
    const content = document.getElementById('credit-note-pdf-content')?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>credit-note-${creditNote.id}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:white;padding:32px}@media print{body{padding:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
</head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 12, zIndex: 1001, maxWidth: 820, width: '92%',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>📄 Credit Note Preview</span>
          <span style={{ fontFamily: 'monospace', color: '#7C3AED', fontWeight: 700 }}>{creditNote.id}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} style={{
              padding: '8px 14px', borderRadius: 8, background: '#7C3AED', color: '#fff',
              border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>⬇ Download PDF</button>
            <button onClick={onClose} style={{
              padding: '8px 12px', borderRadius: 8, background: '#F1F5F9', border: 'none',
              fontSize: 12, cursor: 'pointer',
            }}>✕</button>
          </div>
        </div>
        <div style={{ overflow: 'auto', padding: 16, background: '#F8FAFC' }}>
          <div id="credit-note-pdf-content">
            <CreditNoteTemplate creditNote={creditNote} />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

const CreditNotesPage = () => {
  const [creditNotes, setCreditNotes] = useState([]);
   const [pdfTarget, setPdfTarget] = useState(null);

  const fetchCreditNotes = useCallback(() => {
    creditNotesApi.list({ limit: 200 })
      .then(r => setCreditNotes((r.data ?? []).map(normaliseCreditNote)))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchCreditNotes(); }, [fetchCreditNotes]);

  const totalCredited = creditNotes.reduce((s, c) => s + (c.total ?? 0), 0);

  const { q, setQ, filtered } = useTableSearch(creditNotes, ['id', 'invoiceNo', 'customer']);
  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } =
    usePagination(filtered, 10);

  return (
    <div className="fi" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Credit Notes</div>
          <div style={{ fontSize: 13, color: COLORS.muted }}>
            {total} of {creditNotes.length} credit notes
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 18 }}>
        <KCard label="Total Credit Notes" value={creditNotes.length} icon="🔄" iconBg="#F5F3FF" color="#7C3AED" />
        <KCard label="Total Credited" value={`₹${(totalCredited / 1000).toFixed(1)}K`} icon="💸" iconBg="#FEF2F2" color="#DC2626" />
      </div>

      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: 16, overflow: 'scroll' }}>
        <TableSearchBar value={q} onChange={setQ} placeholder="Search by credit note #, invoice #, customer…" />

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <Thead cols={['Credit Note #', 'Against Invoice', 'Customer', 'Total', 'Date', 'Status', '']} />
          <tbody>
            {paginated.map((cn, i) => (
              <tr key={cn._id} style={{ background: i % 2 === 0 ? COLORS.white : '#FAFAFA' }}>
                <td style={{ padding: '10px 12px', fontFamily: FONTS.mono, fontWeight: 700, color: '#7C3AED' }}>{cn.id}</td>
                <td style={{ padding: '10px 12px', fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted }}>{cn.invoiceNo}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{cn.customer}</td>
                <td style={{ padding: '10px 12px', fontFamily: FONTS.mono, fontWeight: 700 }}>₹{cn.total.toLocaleString()}</td>
                <td style={{ padding: '10px 12px', fontSize: 12 }}>{cn.date}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    background: cn.status === 'cancelled' ? '#FEF2F2' : '#F0FDF4',
                    color: cn.status === 'cancelled' ? '#DC2626' : '#16A34A',
                  }}>{cn.status}</span>
                </td>
                <td onClick={e => e.stopPropagation()} style={{ padding: '10px 12px' }}>
  <button onClick={() => setPdfTarget(cn)} style={{
    padding: '5px 10px', borderRadius: 6, background: '#F5F3FF', color: '#7C3AED',
    border: '1px solid #DDD6FE', fontSize: 11, fontWeight: 700, cursor: 'pointer',
  }}>⬇ PDF</button>
</td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: COLORS.muted }}>No credit notes yet.</td></tr>
            )}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>
      <CreditNotePDFModal open={!!pdfTarget} onClose={() => setPdfTarget(null)} creditNote={pdfTarget} />
    </div>
  );
};

export default CreditNotesPage;