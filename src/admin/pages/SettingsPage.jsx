import { useState, useEffect, useRef } from 'react';
import { leadsApi, settingsApi } from '../services/api';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../components/ui/Form';
import RolesPermissions from './RolesPermissions';
import { useCompany } from '../context/CompanyContext';
const BACKEND = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

// ── Company Tab ──────────────────────────────────────────────────────────────────
export const CompanyTab = () => {
  const {
    setLogoUrl,
    setCompanyName,
    reload
  } = useCompany();
  const [form, setForm] = useState({
    name: '',
    owner: '',
    phone: '',
    email: '',
    address: '',
    gstNo: ''
  });
  const [previewLogo, setPreviewLogo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({
    msg: '',
    ok: true
  });
  const fileRef = useRef(null);
  const showToast = (msg, ok = true) => {
    setToast({
      msg,
      ok
    });
    setTimeout(() => setToast({
      msg: '',
      ok: true
    }), 2800);
  };

  // ── Load saved settings ───────────────────────────────────────────────────
  useEffect(() => {
    settingsApi.getTab('company').then(res => {
      const data = res?.data ?? res; // ← unwrap { success, data: {...} }
      if (!data) return;
      setForm({
        name: data.name || '',
        owner: data.owner || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        gstNo: data.gstNo || ''
      });
      if (data.logoUrl && data.logoUrl.trim() !== '') {
        const full = data.logoUrl.startsWith('http') ? data.logoUrl : `${BACKEND}${data.logoUrl}`;
        setPreviewLogo(full);
      }
    }).catch(() => {});
  }, []);

  // ── Save company info ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.saveCompany(form);
      setCompanyName(form.name); // ← update sidebar instantly
      reload(); // ← re-sync context from backend
      showToast('✅ Company settings saved!');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Save failed'), false);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload logo ───────────────────────────────────────────────────────────
  const handleLogoChange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately (no waiting for backend)
    const localPreview = URL.createObjectURL(file);
    setPreviewLogo(localPreview);
    setUploading(true);
    try {
      const result = await settingsApi.uploadLogo(file);
      const fullUrl = result.logoUrl.startsWith('http') ? result.logoUrl : `${BACKEND}${result.logoUrl}`;
      setPreviewLogo(fullUrl);
      setLogoUrl(fullUrl); // ← pushes to context → sidebar + everywhere updates
      showToast('✅ Logo updated everywhere!');
    } catch (err) {
      setPreviewLogo(null); // revert preview on failure
      showToast('❌ ' + (err.message || 'Upload failed'), false);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  const FIELDS = [['name', 'Company Name'], ['owner', 'Owner / Admin'], ['phone', 'Phone'], ['email', 'Email'], ['address', 'Address'], ['gstNo', 'GST Number']];
  return <div>
      {/* Toast */}
      {toast.msg && <div style={{
      background: toast.ok ? "var(--x1a1a1a)" : "var(--xa32d2d)"
    }} className="ap-settings-page-1">
          {toast.msg}
        </div>}
 
      <div className="ap-settings-page-2">
        Company Information
      </div>
 
      {/* Fields grid */}
      <div className="ap-settings-page-3">
        {FIELDS.map(([key, label]) => <div key={key}>
            <div className="ap-settings-page-4">
              {label}
            </div>
            <input value={form[key]} onChange={e => setForm(p => ({
          ...p,
          [key]: e.target.value
        }))} onFocus={e => {
          e.target.style.borderColor = COLORS.brand;
        }} onBlur={e => {
          e.target.style.borderColor = COLORS.border;
        }} className="ap-settings-page-5" />
          </div>)}
      </div>
 
      {/* Logo upload */}
      <div className="ap-settings-page-6">
        <div className="ap-settings-page-7">
          Company Logo
          <span className="ap-settings-page-8">
            PNG, JPG, SVG - max 2 MB
          </span>
        </div>
 
        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoChange} className="ap-settings-page-9" />
 
        {/* Drop zone */}
        <div onClick={() => !uploading && fileRef.current?.click()} style={{
        border: `2px dashed ${previewLogo ? COLORS.brand : COLORS.border}`,
        cursor: uploading ? "wait" : "pointer"
      }} onMouseEnter={e => {
        e.currentTarget.style.borderColor = COLORS.brand;
        e.currentTarget.style.background = `${COLORS.brand}08`;
      }} onMouseLeave={e => {
        e.currentTarget.style.borderColor = previewLogo ? COLORS.brand : COLORS.border;
        e.currentTarget.style.background = '#FAFAFA';
      }} className="ap-settings-page-10">
          {uploading ? <>
              <div className="ap-settings-page-11">⏳</div>
              <div className="ap-settings-page-12">Uploading logo…</div>
            </> : previewLogo ? <>
              <img src={previewLogo} alt="Company logo" onError={() => setPreviewLogo(null)} className="ap-settings-page-13" />
              <div className="ap-settings-page-14">
                Click to change logo
              </div>
              {/* Remove button */}
              <button onClick={e => {
            e.stopPropagation();
            setPreviewLogo(null);
            setLogoUrl(null);
          }} className="ap-settings-page-15">
                ✕ Remove
              </button>
            </> : <>
              <div className="ap-settings-page-16">🏢</div>
              <div className="ap-settings-page-17">
                Click to upload logo
              </div>
              <div className="ap-settings-page-18">
                PNG, JPG, SVG up to 2MB
              </div>
            </>}
        </div>
      </div>
 
      {/* Save button */}
      <button onClick={handleSave} disabled={saving || uploading} style={{
      background: saving || uploading ? "var(--xcbd5e1)" : "linear-gradient(135deg, var(--brand), var(--brand-dark))",
      cursor: saving || uploading ? "not-allowed" : "pointer",
      boxShadow: saving || uploading ? "none" : "0 4px 12px var(--xea580c40)"
    }} className="ap-settings-page-19">
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>;
};

// ── Invoice Info Tab ──────────────────────────────────────────────────────────
export const InvoiceInfoTab = () => {
  const [form, setForm] = useState({
    name: '',
    tag1: '',
    tag2: '',
    address: '',
    contact: '',
    phone: '',
    email: '',
    bank: '',
    account: '',
    ifsc: '',
    branch: '',
    signatory: ''
  });
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewQr, setPreviewQr] = useState(null);
  const [previewSignature, setPreviewSig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(''); // '', 'logo', 'qr', 'signature'
  const [toast, setToast] = useState({
    msg: '',
    ok: true
  });
  const logoRef = useRef(null);
  const qrRef = useRef(null);
  const sigRef = useRef(null);
  const showToast = (msg, ok = true) => {
    setToast({
      msg,
      ok
    });
    setTimeout(() => setToast({
      msg: '',
      ok: true
    }), 2800);
  };

  // ── Load saved invoice info ────────────────────────────────────────────────
  useEffect(() => {
    settingsApi.getTab('invoiceInfo').then(res => {
      const data = res?.data ?? res;
      if (!data) return;
      setForm({
        name: data.name || '',
        tag1: data.tag1 || '',
        tag2: data.tag2 || '',
        address: data.address || '',
        contact: data.contact || '',
        phone: data.phone || '',
        email: data.email || '',
        bank: data.bank || '',
        account: data.account || '',
        ifsc: data.ifsc || '',
        branch: data.branch || '',
        signatory: data.signatory || ''
      });
      const toFull = url => url ? url.startsWith('http') ? url : `${BACKEND}${url}` : null;
      if (data.logoUrl) setPreviewLogo(toFull(data.logoUrl));
      if (data.qrUrl) setPreviewQr(toFull(data.qrUrl));
      if (data.signatureUrl) setPreviewSig(toFull(data.signatureUrl));
    }).catch(() => {});
  }, []);
  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.saveInvoiceInfo(form);
      showToast('✅ Invoice info saved!');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Save failed'), false);
    } finally {
      setSaving(false);
    }
  };

  // ── Generic image upload helper (logo / qr / signature) ───────────────────
  const handleImageChange = (kind, setPreview, urlKey) => async e => {
    const file = e.target.files[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(kind);
    try {
      const result = await settingsApi.uploadInvoiceAsset(kind, file); // { url }
      const fullUrl = result.url.startsWith('http') ? result.url : `${BACKEND}${result.url}`;
      setPreview(fullUrl);
      // persist the URL into form so Save Changes also writes it if needed
      setForm(p => ({
        ...p,
        [urlKey]: result.url
      }));
      showToast('✅ Image updated!');
    } catch (err) {
      setPreview(null);
      showToast('❌ ' + (err.message || 'Upload failed'), false);
    } finally {
      setUploading('');
      e.target.value = '';
    }
  };
  const FIELDS = [['name', 'Company Name'], ['tag1', 'Tagline — Line 1'], ['tag2', 'Tagline — Line 2'], ['contact', 'Contact Person'], ['phone', 'Phone'], ['email', 'Email'], ['bank', 'Bank Name'], ['account', 'Account Number'], ['ifsc', 'IFSC Code'], ['branch', 'Branch']
  // ['signatory', 'Authorized Signatory'],
  ];
  const uploadBox = (label, hint, kind, preview, setPreview, ref, urlKey) => <div>
      <div className="ap-settings-page-20">
        {label}
        <span className="ap-settings-page-21">
          {hint}
        </span>
      </div>

      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleImageChange(kind, setPreview, urlKey)} className="ap-settings-page-22" />

      <div onClick={() => uploading === '' && ref.current?.click()} style={{
      border: `2px dashed ${preview ? COLORS.brand : COLORS.border}`,
      cursor: uploading ? "wait" : "pointer"
    }} onMouseEnter={e => {
      e.currentTarget.style.borderColor = COLORS.brand;
      e.currentTarget.style.background = `${COLORS.brand}08`;
    }} onMouseLeave={e => {
      e.currentTarget.style.borderColor = preview ? COLORS.brand : COLORS.border;
      e.currentTarget.style.background = '#FAFAFA';
    }} className="ap-settings-page-23">
        {uploading === kind ? <>
            <div className="ap-settings-page-24">⏳</div>
            <div className="ap-settings-page-25">Uploading…</div>
          </> : preview ? <>
            <img src={preview} alt={label} onError={() => setPreview(null)} className="ap-settings-page-26" />
            <div className="ap-settings-page-27">Click to change</div>
            <button onClick={e => {
          e.stopPropagation();
          setPreview(null);
          setForm(p => ({
            ...p,
            [urlKey]: ''
          }));
        }} className="ap-settings-page-28">
              ✕
            </button>
          </> : <>
            <div className="ap-settings-page-29">🖼️</div>
            <div className="ap-settings-page-30">Click to upload</div>
          </>}
      </div>
    </div>;
  return <div>
      {toast.msg && <div style={{
      background: toast.ok ? "var(--x1a1a1a)" : "var(--xa32d2d)"
    }} className="ap-settings-page-31">
          {toast.msg}
        </div>}

      <div className="ap-settings-page-32">
        Invoice Information
      </div>
      <div className="ap-settings-page-33">
        This appears on every printed invoice — header, bank details, and signature block.
      </div>

      {/* Text fields grid */}
      <div className="ap-settings-page-34">
        {FIELDS.map(([key, label]) => <div key={key}>
            <div className="ap-settings-page-35">
              {label}
            </div>
            <input value={form[key]} onChange={e => setForm(p => ({
          ...p,
          [key]: e.target.value
        }))} onFocus={e => {
          e.target.style.borderColor = COLORS.brand;
        }} onBlur={e => {
          e.target.style.borderColor = COLORS.border;
        }} className="ap-settings-page-36" />
          </div>)}
        {/* Address spans full width */}
        <div className="ap-settings-page-37">
          <div className="ap-settings-page-38">
            Business Address
          </div>
          <textarea value={form.address} onChange={e => setForm(p => ({
          ...p,
          address: e.target.value
        }))} rows={2} onFocus={e => {
          e.target.style.borderColor = COLORS.brand;
        }} onBlur={e => {
          e.target.style.borderColor = COLORS.border;
        }} className="ap-settings-page-39" />
        </div>
      </div>

      {/* Image uploads */}
      <div className="ap-settings-page-40">
        {uploadBox('Invoice Logo', 'PNG/JPG/SVG · max 2MB', 'logo', previewLogo, setPreviewLogo, logoRef, 'logoUrl')}
        {uploadBox('Payment QR Code', 'UPI QR image', 'qr', previewQr, setPreviewQr, qrRef, 'qrUrl')}
        {uploadBox('Signature Image', 'Scanned signature', 'signature', previewSignature, setPreviewSig, sigRef, 'signatureUrl')}
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving || uploading !== ''} style={{
      background: saving || uploading !== '' ? "var(--xcbd5e1)" : "linear-gradient(135deg, var(--brand), var(--brand-dark))",
      cursor: saving || uploading !== '' ? "not-allowed" : "pointer",
      boxShadow: saving || uploading !== '' ? "none" : "0 4px 12px var(--xea580c40)"
    }} className="ap-settings-page-41">
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>;
};

// ── GST Tab ──────────────────────────────────────────────────────────────────
export const GstTab = () => {
  const [form, setForm] = useState({
    gstin: '',
    gstRate: 18,
    pan: '',
    hsnCode: '',
    invoiceFooter: ''
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    msg: '',
    ok: true
  });
  const showToast = (msg, ok = true) => {
    setToast({
      msg,
      ok
    });
    setTimeout(() => setToast({
      msg: '',
      ok: true
    }), 2500);
  };
  useEffect(() => {
    settingsApi.getTab('gst').then(res => {
      const d = res?.data ?? res;
      if (!d) return;
      setForm({
        gstin: d.gstin || '',
        gstRate: d.gstRate ?? 18,
        pan: d.pan || '',
        hsnCode: d.hsnCode || '',
        invoiceFooter: d.invoiceFooter || ''
      });
    }).catch(() => {});
  }, []);
  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.saveGst(form);
      showToast('✅ GST settings saved!');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Save failed'), false);
    } finally {
      setSaving(false);
    }
  };
  const field = (label, key, mono = false) => <div key={key}>
      <div className="ap-settings-page-42">
        {label}
      </div>
      <input value={form[key]} onChange={e => setForm(p => ({
      ...p,
      [key]: e.target.value
    }))} style={{
      fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
    }} onFocus={e => e.target.style.borderColor = COLORS.brand} onBlur={e => e.target.style.borderColor = COLORS.border} className="ap-settings-page-43" />
    </div>;
  return <div>
      {toast.msg && <div style={{
      background: toast.ok ? "var(--x1a1a1a)" : "var(--xa32d2d)"
    }} className="ap-settings-page-44">
          {toast.msg}
        </div>}
      <div className="ap-settings-page-45">
        GST &amp; Tax Configuration
      </div>
      <div className="ap-settings-page-46">
        {field('GSTIN', 'gstin', true)}
        {field('GST Rate (%)', 'gstRate')}
        {field('PAN Number', 'pan', true)}
        {field('HSN Code', 'hsnCode', true)}
      </div>
      <div className="ap-settings-page-47">
        <div className="ap-settings-page-48">
          Invoice Footer
        </div>
        <textarea value={form.invoiceFooter} onChange={e => setForm(p => ({
        ...p,
        invoiceFooter: e.target.value
      }))} rows={3} className="ap-settings-page-49" />
      </div>
      <button onClick={handleSave} disabled={saving} style={{
      background: saving ? "var(--xcbd5e1)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
      cursor: saving ? "not-allowed" : "pointer"
    }} className="ap-settings-page-50">
        {saving ? 'Saving…' : 'Save GST Settings'}
      </button>
    </div>;
};

// ── Notifications Tab ─────────────────────────────────────────────────────────
const DEFAULT_TOGGLES = [{
  label: 'New job created',
  enabled: true
}, {
  label: 'Job assigned to technician',
  enabled: true
}, {
  label: 'Job completed',
  enabled: true
}, {
  label: 'Invoice overdue reminder',
  enabled: true
}, {
  label: 'AMC contract expiring soon',
  enabled: true
}, {
  label: 'Complaint logged',
  enabled: true
}, {
  label: 'Low inventory alert',
  enabled: false
}, {
  label: 'Quotation approved / rejected',
  enabled: true
}, {
  label: 'Salary processed',
  enabled: false
}, {
  label: 'Advance requested',
  enabled: true
}];
export const NotificationsTab = () => {
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    msg: '',
    ok: true
  });
  const showToast = (msg, ok = true) => {
    setToast({
      msg,
      ok
    });
    setTimeout(() => setToast({
      msg: '',
      ok: true
    }), 2500);
  };
  useEffect(() => {
    settingsApi.getTab('notifications').then(res => {
      const d = res?.data ?? res;
      if (d?.toggles?.length) setToggles(d.toggles);
    }).catch(() => {});
  }, []);
  const flip = index => setToggles(prev => prev.map((t, i) => i === index ? {
    ...t,
    enabled: !t.enabled
  } : t));
  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.saveNotifications({
        toggles
      });
      showToast('✅ Notification preferences saved!');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Save failed'), false);
    } finally {
      setSaving(false);
    }
  };
  return <div>
      {toast.msg && <div style={{
      background: toast.ok ? "var(--x1a1a1a)" : "var(--xa32d2d)"
    }} className="ap-settings-page-51">
          {toast.msg}
        </div>}

      <div className="ap-settings-page-52">
        Notification Preferences
      </div>

      {toggles.map((t, i) => <div key={t.label} className="ap-settings-page-53">
          <span className="ap-settings-page-54">{t.label}</span>

          {/* Toggle switch */}
          <div onClick={() => flip(i)} style={{
        background: t.enabled ? "var(--brand)" : "var(--xcbd5e1)"
      }} className="ap-settings-page-55">
            <div style={{
          left: t.enabled ? "23px" : "3px"
        }} className="ap-settings-page-56" />
          </div>
        </div>)}

      <button onClick={handleSave} disabled={saving} style={{
      background: saving ? "var(--xcbd5e1)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
      cursor: saving ? "not-allowed" : "pointer"
    }} className="ap-settings-page-57">
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>;
};

// ── Backup Tab ────────────────────────────────────────────────────────────────
export const BackupTab = () => {
  const [backupData, setBackupData] = useState(null);
  const [frequency, setFrequency] = useState('daily');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState({
    msg: '',
    ok: true
  });
  const [exportOpen, setExportOpen] = useState(false);
  const showToast = (msg, ok = true) => {
    setToast({
      msg,
      ok
    });
    setTimeout(() => setToast({
      msg: '',
      ok: true
    }), 2500);
  };

  // ── Load backup settings ──────────────────────────────────────────────────
  useEffect(() => {
    settingsApi.getTab('backup').then(res => {
      const d = res?.data ?? res;
      if (!d) return;
      setBackupData(d);
      if (d.frequency) setFrequency(d.frequency);
    }).catch(() => {});
  }, []);
  const fmtDate = d => d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '—';
  const usedGB = backupData ? (backupData.storageUsedKB / (1024 * 1024)).toFixed(1) : '2.4';
  const limitGB = backupData ? (backupData.storageLimitKB / (1024 * 1024)).toFixed(0) : '10';
  const usedPct = Math.min(100, parseFloat(usedGB) / parseFloat(limitGB) * 100).toFixed(0);

  // ── Save frequency ────────────────────────────────────────────────────────
  const handleSaveFrequency = async () => {
    setSaving(true);
    try {
      await settingsApi.saveBackup({
        frequency
      });
      showToast('✅ Backup frequency saved!');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Save failed'), false);
    } finally {
      setSaving(false);
    }
  };

  // ── Replace handleBackupNow — now downloads a JSON backup file ────────────
  const handleBackupNow = async () => {
    setBacking(true);
    try {
      // 1. Tell backend to log the backup
      const res = await settingsApi.triggerBackup({
        triggeredBy: 'Admin User'
      });
      const d = res?.data ?? res;
      setBackupData(d);

      // 2. Download full data as JSON for import
      await handleExportFmt('json');
      showToast('✅ Backup downloaded!');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Backup failed'), false);
    } finally {
      setBacking(false);
    }
  };

  // ── Replace handleExport with handleExportFmt(fmt) ────────────────────────
  const handleExportFmt = async fmt => {
    setExporting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/settings/backup/export?format=${fmt}`, {
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : {}
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = fmt === 'excel' ? 'xlsx' : fmt;
      a.download = `cooltech-backup-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`✅ Exported as ${fmt.toUpperCase()}!`);
    } catch (err) {
      showToast('❌ ' + (err.message || 'Export failed'), false);
    } finally {
      setExporting(false);
    }
  };
  const statRow = (label, value, color = COLORS.h2) => <div className="ap-settings-page-58">
      <span className="ap-settings-page-59">{label}</span>
      <span style={{
      color
    }} className="ap-settings-page-60">{value}</span>
    </div>;
  return <div>
      {toast.msg && <div style={{
      background: toast.ok ? "var(--x1a1a1a)" : "var(--xa32d2d)"
    }} className="ap-settings-page-61">
          {toast.msg}
        </div>}

      <div className="ap-settings-page-62">
        Data Backup &amp; Export
      </div>

      {/* ── Backup Status ─────────────────────────────────────────────────── */}
      <div className="ap-settings-page-63">
        {statRow('Last Backup', fmtDate(backupData?.lastBackupAt), '#16A34A')}
        {statRow('Next Auto Backup', fmtDate(backupData?.nextBackupAt))}
        {statRow('Storage Used', `${usedGB} GB of ${limitGB} GB`, '#0369A1')}
      </div>

      {/* Storage progress bar */}
      <div className="ap-settings-page-64">
        <div className="ap-settings-page-65">
          <span>Storage usage</span>
          <span>{usedPct}%</span>
        </div>
        <div className="ap-settings-page-66">
          <div style={{
          width: `${usedPct}%`,
          background: parseFloat(usedPct) > 80 ? "var(--danger-text)" : "var(--info-text)"
        }} className="ap-settings-page-67" />
        </div>
      </div>

      {/* ── Backup Frequency ──────────────────────────────────────────────── */}
      <div className="ap-settings-page-68">
        <div className="ap-settings-page-69">
          Backup Frequency
        </div>
        <div className="ap-settings-page-70">
          {['daily', 'weekly', 'manual'].map(f => <button key={f} onClick={() => setFrequency(f)} style={{
          border: `1.5px solid ${frequency === f ? COLORS.brand : COLORS.border}`,
          background: frequency === f ? "var(--xea580c12)" : "var(--bg)",
          color: frequency === f ? "var(--brand)" : "var(--text-muted)"
        }} className="ap-settings-page-71">
              {f}
            </button>)}
        </div>
        <button onClick={handleSaveFrequency} disabled={saving} style={{
        background: saving ? "var(--xcbd5e1)" : "var(--brand)",
        cursor: saving ? "not-allowed" : "pointer"
      }} className="ap-settings-page-72">
          {saving ? 'Saving…' : 'Save Frequency'}
        </button>
      </div>

      <div className="ap-settings-page-73" />

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="ap-settings-page-74">
  Actions
</div>

<div className="ap-settings-page-75">

  {/* Backup Now — downloads JSON backup file */}
  <button onClick={handleBackupNow} disabled={backing} style={{
        cursor: backing ? "not-allowed" : "pointer",
        background: backing ? "var(--xcbd5e1)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
        boxShadow: backing ? "none" : "0 4px 12px var(--xea580c40)"
      }} className="ap-settings-page-76">
    {backing ? '⏳ Backing up…' : '⬇ Backup Now'}
  </button>

  {/* Export dropdown */}
  <div className="ap-settings-page-77">
    <button onClick={() => setExportOpen(p => !p)} className="ap-settings-page-78">
      📤 Export All Data
      <span style={{
            transform: exportOpen ? "rotate(180deg)" : "rotate(0deg)"
          }} className="ap-settings-page-79">▼</span>
    </button>

    {exportOpen && <>
        <div onClick={() => setExportOpen(false)} className="ap-settings-page-80" />
        <div className="ap-settings-page-81">
          {[{
              fmt: 'pdf',
              icon: '📄',
              label: 'Export as PDF',
              sub: 'Human-readable report'
            }, {
              fmt: 'excel',
              icon: '📊',
              label: 'Export as Excel',
              sub: 'Importable .xlsx file'
            }
            // { fmt: 'json',  icon: '🗄', label: 'Export as JSON',  sub: 'Full data backup file'  },
            ].map(({
              fmt,
              icon,
              label,
              sub
            }) => <div key={fmt} onClick={() => {
              setExportFormat(fmt);
              setExportOpen(false);
              handleExportFmt(fmt);
            }} onMouseEnter={e => e.currentTarget.style.background = `${COLORS.brand}08`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} className="ap-settings-page-82">
              <div className="ap-settings-page-83">
                {icon} {label}
              </div>
              <div className="ap-settings-page-84">{sub}</div>
            </div>)}
        </div>
      </>}
  </div>
</div>

      {/* ── Recent backup logs ────────────────────────────────────────────── */}
      {backupData?.logs?.length > 0 && <div className="ap-settings-page-85">
          <div className="ap-settings-page-86">
            Recent Backups
          </div>
          <div className="ap-settings-page-87">
            {backupData.logs.slice(-5).reverse().map((log, i) => <div key={i} style={{
          borderBottom: i < 4 ? "1px solid var(--border)" : "none"
        }} className="ap-settings-page-88">
                <span style={{
            color: log.status === 'success' ? "var(--success-text)" : "var(--danger-text)"
          }}>
                  {log.status === 'success' ? '✓' : '✕'} {fmtDate(log.triggeredAt)}
                </span>
                <span className="ap-settings-page-89">{log.triggeredBy}</span>
              </div>)}
          </div>
        </div>}
    </div>;
};

// ── SMS Tab ───────────────────────────────────────────────────────────────────
export const SmsTab = () => {
  const [toggles, setToggles] = useState([{
    key: 'jobAssignment',
    label: 'Send SMS on job assignment',
    desc: 'Send job details to customer automatically',
    enabled: true
  }, {
    key: 'completion',
    label: 'Send completion SMS',
    desc: 'Notify customer when job is marked complete',
    enabled: true
  }, {
    key: 'invoiceWhatsApp',
    label: 'Send invoice via WhatsApp',
    desc: 'Share PDF invoice on WhatsApp after job',
    enabled: false
  }, {
    key: 'amcRenewal',
    label: 'AMC renewal reminder SMS',
    desc: 'Alert customer 30 days before contract end',
    enabled: true
  }, {
    key: 'paymentDue',
    label: 'Payment due reminder',
    desc: 'Auto-remind customer before invoice due date',
    enabled: true
  }]);
  const [template, setTemplate] = useState('Dear {customer}, your AC service has been scheduled for {date} at {time}. Technician: {tech}. CoolTech AC Services – {phone}');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    msg: '',
    ok: true
  });
  const showToast = (msg, ok = true) => {
    setToast({
      msg,
      ok
    });
    setTimeout(() => setToast({
      msg: '',
      ok: true
    }), 2500);
  };
  useEffect(() => {
    settingsApi.getTab('sms').then(res => {
      const d = res?.data ?? res;
      if (!d) return;
      if (d.toggles?.length) {
        setToggles(prev => prev.map(t => {
          const saved = d.toggles.find(s => s.key === t.key);
          return saved ? {
            ...t,
            enabled: saved.enabled
          } : t;
        }));
      }
      if (d.jobAssignTemplate) setTemplate(d.jobAssignTemplate);
    }).catch(() => {});
  }, []);
  const flip = key => setToggles(prev => prev.map(t => t.key === key ? {
    ...t,
    enabled: !t.enabled
  } : t));
  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.saveSms({
        toggles: toggles.map(({
          key,
          label,
          enabled
        }) => ({
          key,
          label,
          enabled
        })),
        jobAssignTemplate: template
      });
      showToast('✅ SMS settings saved!');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Save failed'), false);
    } finally {
      setSaving(false);
    }
  };
  return <div>
      {toast.msg && <div style={{
      background: toast.ok ? "var(--x1a1a1a)" : "var(--xa32d2d)"
    }} className="ap-settings-page-90">
          {toast.msg}
        </div>}

      <div className="ap-settings-page-91">
        SMS &amp; WhatsApp Automation
      </div>

      {toggles.map(t => <div key={t.key} className="ap-settings-page-92">
          <div>
            <div className="ap-settings-page-93">{t.label}</div>
            <div className="ap-settings-page-94">{t.desc}</div>
          </div>
          <div onClick={() => flip(t.key)} style={{
        background: t.enabled ? "var(--brand)" : "var(--xcbd5e1)"
      }} className="ap-settings-page-95">
            <div style={{
          left: t.enabled ? "23px" : "3px"
        }} className="ap-settings-page-96" />
          </div>
        </div>)}

      <div className="ap-settings-page-97">
        <div className="ap-settings-page-98">
          SMS Template – Job Assignment
        </div>
        <textarea value={template} onChange={e => setTemplate(e.target.value)} rows={3} className="ap-settings-page-99" />
        <div className="ap-settings-page-100">
          Variables: {'{customer}'} {'{date}'} {'{time}'} {'{tech}'} {'{phone}'}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{
      background: saving ? "var(--xcbd5e1)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
      cursor: saving ? "not-allowed" : "pointer"
    }} className="ap-settings-page-101">
        {saving ? 'Saving…' : 'Save SMS Settings'}
      </button>
    </div>;
};

// ── Appearance Tab ────────────────────────────────────────────────────────────
const BRAND_COLORS = [{
  hex: '#EA580C',
  name: 'Orange (Default)'
}, {
  hex: '#2563EB',
  name: 'Blue'
}, {
  hex: '#16A34A',
  name: 'Green'
}, {
  hex: '#7C3AED',
  name: 'Purple'
}, {
  hex: '#DC2626',
  name: 'Red'
}, {
  hex: '#0891B2',
  name: 'Cyan'
}];
export const AppearanceTab = () => {
  const {
    setBrandColor: setCtxColor
  } = useCompany();
  const [brandColor, setBrandColor] = useState('#EA580C');
  const [sidebarStyle, setSidebarStyle] = useState('dark');
  const [dateFormat, setDateFormat] = useState('DD MMM, YYYY');
  const [currency, setCurrency] = useState('INR');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    msg: '',
    ok: true
  });
  const showToast = (msg, ok = true) => {
    setToast({
      msg,
      ok
    });
    setTimeout(() => setToast({
      msg: '',
      ok: true
    }), 2500);
  };
  useEffect(() => {
    settingsApi.getTab('appearance').then(res => {
      const d = res?.data ?? res;
      if (!d) return;
      if (d.brandColor) setBrandColor(d.brandColor);
      if (d.sidebarStyle) setSidebarStyle(d.sidebarStyle);
      if (d.dateFormat) setDateFormat(d.dateFormat);
      if (d.currency) setCurrency(d.currency);
    }).catch(() => {});
  }, []);
  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.saveAppearance({
        brandColor,
        sidebarStyle,
        dateFormat,
        currency,
        currencySymbol: currency === 'INR' ? '₹' : '$'
      });
      setCtxColor(brandColor); // ← updates brand color in context instantly
      showToast('✅ Appearance saved!');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Save failed'), false);
    } finally {
      setSaving(false);
    }
  };
  return <div>
      {toast.msg && <div style={{
      background: toast.ok ? "var(--x1a1a1a)" : "var(--xa32d2d)"
    }} className="ap-settings-page-102">
          {toast.msg}
        </div>}

      <div className="ap-settings-page-103">
        Appearance &amp; Theme
      </div>

      {/* Brand Color */}
      <div className="ap-settings-page-104">
        <div className="ap-settings-page-105">
          Brand Color
        </div>
        <div className="ap-settings-page-106">
          {BRAND_COLORS.map(({
          hex,
          name
        }) => <div key={hex} onClick={() => setBrandColor(hex)} style={{
          border: `2px solid ${brandColor === hex ? hex : COLORS.border}`,
          background: brandColor === hex ? `${hex}10` : COLORS.bg
        }} className="ap-settings-page-107">
              <div style={{
            background: hex,
            boxShadow: brandColor === hex ? `0 0 0 3px ${hex}30` : 'none'
          }} className="ap-settings-page-108" />
              <span style={{
            color: brandColor === hex ? hex : COLORS.muted
          }} className="ap-settings-page-109">
                {name}
              </span>
            </div>)}
        </div>
      </div>

      {/* Sidebar Style */}
      <div className="ap-settings-page-110">
        <div className="ap-settings-page-111">
          Sidebar Style
        </div>
        <div className="ap-settings-page-112">
          {[['dark', 'Dark (Default)'], ['light', 'Light'], ['auto', 'Auto']].map(([val, label]) => <div key={val} onClick={() => setSidebarStyle(val)} style={{
          border: `2px solid ${sidebarStyle === val ? COLORS.brand : COLORS.border}`,
          background: sidebarStyle === val ? "var(--brand-light)" : "var(--bg)"
        }} className="ap-settings-page-113">
              <span style={{
            color: sidebarStyle === val ? "var(--brand)" : "var(--text-muted)"
          }} className="ap-settings-page-114">
                {label}
              </span>
            </div>)}
        </div>
      </div>

      {/* Date & Currency */}
      <div className="ap-settings-page-115">
        <div className="ap-settings-page-116">
          Date &amp; Currency Format
        </div>
        <div className="ap-settings-page-117">
          <div>
            <div className="ap-settings-page-118">
              DATE FORMAT
            </div>
            <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="ap-settings-page-119">
              <option value="DD MMM, YYYY">DD MMM, YYYY (27 Jun, 2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>
          <div>
            <div className="ap-settings-page-120">
              CURRENCY
            </div>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="ap-settings-page-121">
              <option value="INR">₹ Indian Rupee (INR)</option>
              <option value="USD">$ US Dollar (USD)</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{
      background: saving ? "var(--xcbd5e1)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
      cursor: saving ? "not-allowed" : "pointer"
    }} className="ap-settings-page-122">
        {saving ? 'Saving…' : 'Save Appearance'}
      </button>
    </div>;
};

// ─── SettingsPage ───────────────────────────────────────────────────────────────

const SettingsPage = ({
  openModal
}) => {
  const [tab, setTab] = useState("company");
  const TABS = [["company", "🏢 Company"], ["invoiceInfo", "🧾 Invoice Info"], ["gst", "🧾 GST & Tax"], ["notifications", "🔔 Notifications"], ["Roles & Permissions", "👤 Roles & Permissions"], ["sms", "📱 SMS / WhatsApp"], ["appearance", "🎨 Appearance"], ["integrations", "🔗 Integrations"], ["backup", "💾 Backup"]];
  return <div className="fi ap-settings-page-123">
      <SectionHdr title="Settings" sub="Configure your platform" />
      <div className="ap-settings-page-124">
        <div className="ap-settings-page-125">
          {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{
          background: tab === k ? "var(--brand-light)" : "transparent",
          color: tab === k ? "var(--brand)" : "var(--text-muted)",
          border: `1px solid ${tab === k ? COLORS.brand + "40" : "transparent"}`,
          fontWeight: tab === k ? "700" : "400"
        }} className="ap-settings-page-126">
              {l}
            </button>)}
        </div>
        <div className="ap-settings-page-127">
          {tab === "company" && <CompanyTab />}
          {tab === "invoiceInfo" && <InvoiceInfoTab />}
          {tab === "gst" && <GstTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "Roles & Permissions" &&
        // <div>
        //   <div style={{fontSize:15,fontWeight:700,color:COLORS.h1,marginBottom:20}}>Admin Users & Permissions</div>
        //   <div style={{display:"flex",flexDirection:"column",gap:10}}>
        //     {[{name:"Rajesh Patel",email:"rajesh@cooltech.com",role:"Super Admin"},{name:"Rekha Sharma",email:"rekha@cooltech.com",role:"Manager"},{name:"Priya Singh",email:"priya@cooltech.com",role:"Accountant"}].map(u=>(
        //       <div key={u.email} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${COLORS.border}`,background:COLORS.bg}}>
        //         <Avatar name={u.name} size={36}/>
        //         <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:COLORS.h1}}>{u.name}</div><div style={{fontSize:12,color:COLORS.muted}}>{u.email}</div></div>
        //         <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,background:COLORS.brandL,color:COLORS.brand}}>{u.role}</span>
        //         <button className="btn" onClick={()=>openModal("new_admin")} style={{padding:"5px 12px",borderRadius:7,background:COLORS.white,border:`1px solid ${COLORS.border}`,color:COLORS.muted,fontSize:11}}>Edit</button>
        //       </div>
        //     ))}
        //     <button className="btn" onClick={()=>openModal("new_admin")} style={{padding:"10px",borderRadius:9,background:COLORS.brandL,border:`1px solid ${COLORS.brand}30`,color:COLORS.brand,fontSize:13,fontWeight:700,width:"100%"}}>+ Add Admin User</button>
        //   </div>
        // </div>
        <RolesPermissions />}
          {tab === "sms" && <SmsTab />}
          {tab === "appearance" && <AppearanceTab />}
          {tab === "integrations" && <div>
              <div className="ap-settings-page-128">Integrations & Connected Apps</div>
              {[{
            name: "Google My Business",
            desc: "Sync reviews and business info",
            icon: "G",
            color: "#EA4335",
            bg: "#FEF2F2",
            connected: true
          }, {
            name: "WhatsApp Business API",
            desc: "Send automated customer messages",
            icon: "WA",
            color: "#25D366",
            bg: "#F0FDF4",
            connected: true
          }, {
            name: "Google Calendar",
            desc: "Sync job schedules and reminders",
            icon: "📅",
            color: "#0369A1",
            bg: "#EFF6FF",
            connected: false
          }, {
            name: "Tally / Zoho Books",
            desc: "Auto-sync invoices and payments",
            icon: "💼",
            color: "#7C3AED",
            bg: "#F5F3FF",
            connected: false
          }, {
            name: "SMS Gateway (MSG91)",
            desc: "Send automated SMS to customers",
            icon: "📱",
            color: "#B45309",
            bg: "#FFFBEB",
            connected: true
          }, {
            name: "Razorpay / PayU",
            desc: "Accept online payments via invoice link",
            icon: "💳",
            color: "#0369A1",
            bg: "#EFF6FF",
            connected: false
          }, {
            name: "Google Drive",
            desc: "Backup documents and photos",
            icon: "🗂",
            color: "#16A34A",
            bg: "#F0FDF4",
            connected: false
          }, {
            name: "Slack",
            desc: "Get job alerts on your team Slack",
            icon: "💬",
            color: "#4A154B",
            bg: "#F5F3FF",
            connected: false
          }].map(intg => <div key={intg.name} style={{
            border: `1px solid ${intg.connected ? intg.color + "40" : COLORS.border}`,
            background: intg.connected ? intg.bg : COLORS.bg
          }} className="ap-settings-page-129">
                  <div style={{
              background: intg.connected ? intg.color + "15" : "#F3F4F6",
              color: intg.color
            }} className="ap-settings-page-130">{intg.icon}</div>
                  <div className="ap-settings-page-131"><div className="ap-settings-page-132">{intg.name}</div><div className="ap-settings-page-133">{intg.desc}</div></div>
                  {intg.connected ? <span className="ap-settings-page-134">✓ Connected</span> : <button className="btn ap-settings-page-135" onClick={() => openModal("report", {
              title: `Connect ${intg.name}`,
              format: "Auth"
            })}>Connect</button>}
                </div>)}
            </div>}
          {tab === "backup" && <BackupTab />}
        </div>
      </div>
    </div>;
};
export default SettingsPage;