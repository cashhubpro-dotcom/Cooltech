import { useState, useEffect } from 'react';
import { COLORS } from '../constants/tokens';
import { clientContractsApi, clientInvoicesApi, clientReportsApi, clientQuotationsApi } from '../services/clientPortalApi';
import { Toast } from '../components/ui/Components';
const DOC_TYPE_COLORS = {
  Contract: {
    bg: "var(--purple-bg)",
    color: "var(--purple-text)"
  },
  Invoice: {
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  Report: {
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  Quotation: {
    bg: COLORS.brandL,
    color: COLORS.brand
  },
  Warranty: {
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  }
};
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}) : '—';
const DocumentsPage = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Documents = a unified view over four already-real resources — there's no
  // separate "document" storage, each type is fetched from its own API and
  // flattened into the same card shape this page renders.
  useEffect(() => {
    Promise.all([
      clientContractsApi.list({ limit: 100 }).then(r => (r.data ?? []).map(c => ({
        id: c._id,
        name: c.title || `Contract ${c.contractId}`,
        type: 'Contract',
        date: fmtDate(c.startDate),
        icon: '📝',
        downloadId: c._id
      }))).catch(() => []),
      clientInvoicesApi.list({ limit: 100 }).then(r => (r.data ?? []).map(i => ({
        id: i._id,
        name: i.subject || `Invoice ${i.invoiceNo}`,
        type: 'Invoice',
        date: fmtDate(i.date),
        icon: '💰',
        downloadId: i._id
      }))).catch(() => []),
      clientReportsApi.list({ limit: 100 }).then(r => (r.data ?? []).map(j => ({
        id: j._id,
        name: `Service Report – ${j.type} (${j.jobId})`,
        type: 'Report',
        date: fmtDate(j.completedAt),
        icon: '📊',
        downloadId: j._id
      }))).catch(() => []),
      clientQuotationsApi.list({ limit: 100 }).then(r => (r.data ?? []).map(q => ({
        id: q._id,
        name: `Quotation ${q.quotId} – ${q.type}`,
        type: 'Quotation',
        date: fmtDate(q.createdAt || q.validUntil),
        icon: '📄',
        downloadId: q._id
      }))).catch(() => [])
    ]).then(([contracts, invoices, reports, quotations]) => {
      setDocuments([...contracts, ...invoices, ...reports, ...quotations]);
    });
  }, []);
  const DOWNLOAD_FN = {
    Report: clientReportsApi.download,
    Contract: clientContractsApi.download,
    Invoice: clientInvoicesApi.download,
    Quotation: clientQuotationsApi.download
  };
  const handleDownload = doc => {
    const fn = DOWNLOAD_FN[doc.type];
    if (!fn) {
      setToast(`No download available for ${doc.name}.`);
      return;
    }
    fn(doc.downloadId).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setToast(`${doc.name} downloaded!`);
    }).catch(() => setToast(`Could not download ${doc.name}.`));
  };
  const types = ['all', ...new Set(documents.map(d => d.type))];
  const filtered = documents.filter(d => (filter === 'all' || d.type === filter) && (search === '' || d.name.toLowerCase().includes(search.toLowerCase())));
  return <div>
      <div className="section-hdr">
        <div>
          <div className="section-title">Documents</div>
          <div className="section-sub">Contracts, invoices, reports and quotations – all in one place</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="cp-documents-page-1">
        {[{
        type: 'Contract',
        count: documents.filter(d => d.type === 'Contract').length
      }, {
        type: 'Invoice',
        count: documents.filter(d => d.type === 'Invoice').length
      }, {
        type: 'Report',
        count: documents.filter(d => d.type === 'Report').length
      }, {
        type: 'Quotation',
        count: documents.filter(d => d.type === 'Quotation').length
      }].map(s => {
        const style = DOC_TYPE_COLORS[s.type] || {};
        return <div key={s.type} className="stat-card animate-fade-up cp-documents-page-2" onClick={() => setFilter(s.type)}>
              <div className="stat-card-header">
                <div className="stat-card-label">{s.type}s</div>
                <div className="stat-card-icon cp-documents-page-3" style={{
              background: style.bg
            }}>
                  {s.type === 'Contract' ? '📝' : s.type === 'Invoice' ? '💰' : s.type === 'Report' ? '📊' : '📄'}
                </div>
              </div>
              <div className="stat-card-value" style={{
            color: style.color
          }}>{s.count}</div>
            </div>;
      })}
      </div>

      {/* Filters + search */}
      <div className="cp-documents-page-4">
        <div className="cp-documents-page-5">
          <input className="form-input cp-documents-page-6" placeholder="🔍 Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="cp-documents-page-7">
          {types.map(t => <button key={t} onClick={() => setFilter(t)} style={{
          background: filter === t ? "var(--brand)" : "var(--white)",
          color: filter === t ? "var(--white)" : "var(--text-muted)",
          border: `1px solid ${filter === t ? COLORS.brand : COLORS.border}`
        }} className="cp-documents-page-8">
              {t === 'all' ? 'All Files' : `${t}s`}
            </button>)}
        </div>
      </div>

      {/* Document grid */}
      <div className="cp-documents-page-9">
        {filtered.map((doc, idx) => {
        const style = DOC_TYPE_COLORS[doc.type] || {
          bg: COLORS.bg,
          color: COLORS.muted
        };
        return <div key={doc.id} className={`${`card animate-fade-up${idx % 3}`} cp-documents-page-10`}>
              <div className="card-body">
                <div className="cp-documents-page-11">
                  <div style={{
                background: style.bg
              }} className="cp-documents-page-12">
                    {doc.icon}
                  </div>
                  <div className="cp-documents-page-13">
                    <div className="cp-documents-page-14">
                      {doc.name}
                    </div>
                    <div className="cp-documents-page-15">
                      <span style={{
                    background: style.bg,
                    color: style.color
                  }} className="cp-documents-page-16">
                        {doc.type}
                      </span>
                    </div>
                    <div className="cp-documents-page-18">
                      📅 {doc.date}
                    </div>
                  </div>
                </div>
                <div className="cp-documents-page-19">
                  <button onClick={() => handleDownload(doc)} className="cp-documents-page-20">
                    ⬇ Download
                  </button>
                </div>
              </div>
            </div>;
      })}
        {filtered.length === 0 && <div className="cp-documents-page-22">
            <div className="cp-documents-page-23">📁</div>
            No documents found matching your search
          </div>}
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
export default DocumentsPage;