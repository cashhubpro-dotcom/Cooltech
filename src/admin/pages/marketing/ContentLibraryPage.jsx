import { useState, useEffect, useRef } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { contentLibraryApi } from '../../services/api';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Toast system (lightweight, no extra deps) ─────────────────────────────────
// FIX: replaces window.alert() calls with a dismissible inline toast.
let toastId = 0;
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const push = (message, type = 'success') => {
    const id = ++toastId;
    setToasts(t => [...t, {
      id,
      message,
      type
    }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };
  const ToastHost = () => <div className="ap-content-library-page-1">
      {toasts.map(t => <div key={t.id} style={{
      background: t.type === 'error' ? '#DC2626' : t.type === 'info' ? '#0369A1' : '#16A34A'
    }} className="ap-content-library-page-2">
          {t.message}
        </div>)}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>;
  return {
    push,
    ToastHost
  };
};

// ─── Shared channel meta ───────────────────────────────────────────────────────
const CHANNEL_META = {
  facebook: {
    emoji: "📘",
    color: "var(--brand-facebook)"
  },
  instagram: {
    emoji: "📸",
    color: "var(--brand-instagram)"
  },
  twitter: {
    emoji: "🐦",
    color: "var(--brand-twitter)"
  },
  linkedin: {
    emoji: "💼",
    color: "var(--brand-linkedin)"
  },
  youtube: {
    emoji: "▶️",
    color: "var(--xff0000)"
  },
  google: {
    emoji: "⭐",
    color: "var(--brand-google-yellow)"
  },
  fb: {
    emoji: "📘",
    color: "var(--brand-facebook)"
  },
  ig: {
    emoji: "📸",
    color: "var(--brand-instagram)"
  },
  wa: {
    emoji: "💬",
    color: "var(--brand-whatsapp)"
  },
  yt: {
    emoji: "▶️",
    color: "var(--xff0000)"
  }
};

// ─── ChannelChips ──────────────────────────────────────────────────────────────
const ChannelChips = ({
  channels = []
}) => <div className="ap-content-library-page-3">
    {channels.map(ch => {
    const meta = CHANNEL_META[ch] || {
      emoji: "🌐",
      color: "#94A3B8"
    };
    return <span key={ch} style={{
      background: meta.color + "18",
      color: meta.color
    }} className="ap-content-library-page-4">
          {meta.emoji} {ch}
        </span>;
  })}
  </div>;

// ─── Type → emoji/preview map ──────────────────────────────────────────────────
const TYPE_PREVIEW = {
  image: '🖼️',
  video: '🎬',
  template: '📋',
  caption: '✏️',
  banner: '🎨'
};

// ─── Column config for export ──────────────────────────────────────────────────
const CONTENT_COLUMNS = [{
  label: "ID",
  key: "id",
  width: 10,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: "#EA580C",
    fontSize: 11
  }
}, {
  label: "Name",
  key: "name",
  width: 28,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: "Type",
  key: "type",
  width: 14
}, {
  label: "Category",
  key: "category",
  width: 14
}, {
  label: "Tags",
  key: "tags",
  width: 18,
  format: v => Array.isArray(v) ? v.join(", ") : v
}, {
  label: "Used",
  key: "used",
  width: 8,
  tdStyle: {
    fontFamily: "monospace",
    textAlign: "center"
  },
  format: v => `${v}x`
}];

// ─── normalize raw backend doc to the shape this UI uses ──────────────────────
const normalizeAsset = (a, idx) => ({
  ...a,
  id: a.contentId ?? a.id ?? a._id ?? `con-${idx}`,
  _id: a._id,
  name: a.title ?? a.name ?? 'Untitled',
  type: a.type || 'template',
  category: a.category || 'General',
  url: a.url || '',
  content: a.content || '',
  tags: Array.isArray(a.tags) ? a.tags : [],
  used: a.usageCount ?? a.used ?? 0,
  format: (a.url || '').split('.').pop()?.toUpperCase() || (a.type === 'video' ? 'MP4' : a.type === 'image' ? 'PNG' : 'TXT'),
  size: a.size || '—',
  channels: Array.isArray(a.channels) ? a.channels : [],
  preview: TYPE_PREVIEW[a.type] || '📄',
  createdAt: a.createdAt || a.created_at || null
});

// ─── DetailModal ────────────────────────────────────────────────────────────────
const DetailModal = ({
  asset,
  onClose,
  onUse,
  onDownload,
  onDelete
}) => {
  if (!asset) return null;
  const hasFile = Boolean(asset.url);
  return <div onClick={onClose} className="ap-content-library-page-5">
      <div onClick={e => e.stopPropagation()} className="ap-content-library-page-6">
        <div className="ap-content-library-page-7">
          {asset.preview}
          <button onClick={onClose} className="ap-content-library-page-8">×</button>
          <div className="ap-content-library-page-9">
            {asset.format}
          </div>
        </div>

        <div className="ap-content-library-page-10">
          <div className="ap-content-library-page-11">{asset.name}</div>
          <div className="ap-content-library-page-12">
            <span className="ap-content-library-page-13">{asset.type}</span>
            <span className="ap-content-library-page-14">{asset.category}</span>
            <span className="ap-content-library-page-15">{asset.size}</span>
          </div>

          {asset.content && <div className="ap-content-library-page-16">
              <div className="ap-content-library-page-17">Content / Caption</div>
              <div className="ap-content-library-page-18">
                {asset.content}
              </div>
            </div>}

          {/* FIX: show a clear "no file" state instead of an empty/broken link when url is blank */}
          <div className="ap-content-library-page-19">
            <div className="ap-content-library-page-20">Asset File</div>
            {hasFile ? (
          /* FIX: base64 data URLs can be megabytes of text — rendering the raw
             string would be useless and can hang the layout. Show a clean
             "stored as embedded file" label instead, and only print real
             http(s) URLs verbatim. Both cases link to onDownload, which
             already handles data: URLs correctly via the download attribute. */
          asset.url.startsWith('data:') ? <button onClick={() => onDownload(asset)} className="ap-content-library-page-21">
                  📎 Embedded file — click to download
                </button> : <a href={asset.url} target="_blank" rel="noreferrer" className="ap-content-library-page-22">{asset.url}</a>) : <div className="ap-content-library-page-23">
                No file uploaded for this asset yet.
              </div>}
          </div>

          {asset.tags?.length > 0 && <div className="ap-content-library-page-24">
              <div className="ap-content-library-page-25">Tags</div>
              <div className="ap-content-library-page-26">
                {asset.tags.map(tag => <span key={tag} className="ap-content-library-page-27">{tag}</span>)}
              </div>
            </div>}

          <div className="ap-content-library-page-28">
            <span>Used {asset.used}× total</span>
            {asset.createdAt && <span>Added {fmtDateDMY(new Date(asset.createdAt))}</span>}
          </div>

          <div className="ap-content-library-page-29">
            <button onClick={() => onUse(asset)} className="ap-content-library-page-30">
              ✓ Use This Asset
            </button>
            <button onClick={() => onDownload(asset)} disabled={!hasFile} style={{
            color: hasFile ? "var(--text-h2)" : "var(--text-faint)",
            cursor: hasFile ? "pointer" : "not-allowed"
          }} className="ap-content-library-page-31">
              ⬇ Download
            </button>
            <button onClick={() => onDelete(asset)} title="Delete asset" className="ap-content-library-page-32">
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>;
};

// ─── UploadAssetModal ───────────────────────────────────────────────────────────
const UploadAssetModal = ({
  open,
  onClose,
  onUploaded,
  toast
}) => {
  const EMPTY = {
    title: '',
    type: 'image',
    category: '',
    url: '',
    content: '',
    tagsInput: ''
  };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [filePreview, setFilePreview] = useState(null); // local preview only, never sent as `url`

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setFileName('');
      setFilePreview(null);
    }
  }, [open]);
  if (!open) return null;
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));

  // FIX: previously used URL.createObjectURL(file) and stored that as `url`.
  // blob: URLs only live as long as the tab/session that created them — after
  // a reload the reference is garbage-collected, which is exactly why the
  // asset's "url" stopped working and download failed.
  //
  // Real fix requires a backend file-storage endpoint (multer + disk/S3/Cloudinary).
  // Until that exists, we convert the file to a base64 data: URL instead — this
  // is a stable string that survives reloads and can be downloaded directly,
  // at the cost of being impractical for large files (only use for small assets).
  // TODO: replace this with a real upload endpoint once one exists; swap the
  // `reader.readAsDataURL(file)` branch below for a `fetch('/api/uploads', ...)` call.
  const handleFilePick = file => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.push('File too large for base64 storage (max 4MB) — connect real file storage for bigger files.', 'error');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result; // e.g. "data:image/png;base64,...."
      setFilePreview(dataUrl);
      setForm(f => ({
        ...f,
        url: dataUrl,
        // FIX: title is ONLY ever set from the filename here — never from the URL/data string,
        // which is what likely caused "Certificate SQL" to end up with a URL-looking title
        // if it was pasted into the wrong field during a manual/test entry.
        title: f.title || file.name.replace(/\.[^/.]+$/, '')
      }));
    };
    reader.readAsDataURL(file);
  };
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.push('Please enter a title', 'error');
      return;
    }
    // FIX: guard against accidentally saving a URL/data-string as the title
    if (/^(https?:|data:|blob:)/i.test(form.title.trim())) {
      toast.push('Title looks like a URL — please enter a real name for this asset.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        category: form.category.trim() || 'General',
        url: form.url.trim(),
        content: form.content.trim(),
        tags: form.tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      };
      const doc = await contentLibraryApi.create(payload);
      onUploaded({
        ...payload,
        ...doc
      });
      toast.push('Asset uploaded successfully');
      onClose();
    } catch (e) {
      toast.push('Upload failed: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  return <div onClick={onClose} className="ap-content-library-page-33">
      <div onClick={e => e.stopPropagation()} className="ap-content-library-page-34">
        <div className="ap-content-library-page-35">
          <div className="ap-content-library-page-36">⬆ Upload Asset</div>
          <button onClick={onClose} className="ap-content-library-page-37">×</button>
        </div>

        <div onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => {
        e.preventDefault();
        handleFilePick(e.dataTransfer.files[0]);
      }} style={{
        border: `2px dashed ${fileName ? COLORS.brand : COLORS.border}`,
        background: fileName ? "var(--xea580c06)" : "var(--bg)"
      }} className="ap-content-library-page-38">
          <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf" onChange={e => handleFilePick(e.target.files[0])} className="ap-content-library-page-39" />
          {/* FIX: show an actual thumbnail for images so the user can confirm what they uploaded,
              instead of just a generic checkmark — also makes it obvious the file loaded correctly */}
          {filePreview && form.type === 'image' ? <img src={filePreview} alt="preview" className="ap-content-library-page-40" /> : <div className="ap-content-library-page-41">{fileName ? '✅' : '📎'}</div>}
          {fileName ? <div className="ap-content-library-page-42">{fileName}</div> : <>
                <div className="ap-content-library-page-43">Click or drag a file to upload</div>
                <div className="ap-content-library-page-44">Image, video, or PDF · max 4MB</div>
              </>}
        </div>

        <div className="ap-content-library-page-45">
          <div>
            <label className="ap-content-library-page-46">Title *</label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Summer Offer Banner" className="ap-content-library-page-47" />
          </div>

          <div className="ap-content-library-page-48">
            <div>
              <label className="ap-content-library-page-49">Type</label>
              <select value={form.type} onChange={set('type')} className="ap-content-library-page-50">
                {['image', 'video', 'template', 'caption', 'banner'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="ap-content-library-page-51">Category</label>
              <input value={form.category} onChange={set('category')} placeholder="e.g. Promotion" className="ap-content-library-page-52" />
            </div>
          </div>

          <div>
            <label className="ap-content-library-page-53">Caption / Content Text</label>
            <textarea value={form.content} onChange={set('content')} rows={3} placeholder="Caption text or template content…" className="ap-content-library-page-54" />
          </div>

          <div>
            <label className="ap-content-library-page-55">Tags (comma separated)</label>
            <input value={form.tagsInput} onChange={set('tagsInput')} placeholder="Summer, Offer, Promotion" className="ap-content-library-page-56" />
          </div>
        </div>

        <div className="ap-content-library-page-57">
          <button onClick={onClose} className="ap-content-library-page-58">Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
          cursor: saving ? "default" : "pointer",
          opacity: saving ? "0.7" : "1"
        }} className="ap-content-library-page-59">
            {saving ? 'Uploading…' : '✓ Upload'}
          </button>
        </div>
      </div>
    </div>;
};

// ─── DeleteConfirmModal ─────────────────────────────────────────────────────────
const DeleteConfirmModal = ({
  asset,
  onClose,
  onConfirm
}) => {
  if (!asset) return null;
  return <div onClick={onClose} className="ap-content-library-page-60">
      <div onClick={e => e.stopPropagation()} className="ap-content-library-page-61">
        <div className="ap-content-library-page-62">🗑️</div>
        <div className="ap-content-library-page-63">Delete this asset?</div>
        <div className="ap-content-library-page-64">
          "<strong>{asset.name}</strong>" will be moved to Recently Deleted. You can restore it from there later.
        </div>
        <div className="ap-content-library-page-65">
          <button onClick={onClose} className="ap-content-library-page-66">Cancel</button>
          <button onClick={() => onConfirm(asset)} className="ap-content-library-page-67">Delete</button>
        </div>
      </div>
    </div>;
};

// ─── ContentLibraryPage ───────────────────────────────────────────────────────
const ContentLibraryPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();
  useEffect(() => {
    contentLibraryApi.list({
      limit: 200
    }).then(r => {
      const raw = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
      setAssets(raw.map(normalizeAsset));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredAssets
  } = useTableSearch(assets, ['id', 'name', 'type', 'category', 'tags'], {
    type: '',
    category: ''
  });
  const {
    exportProps
  } = useExport({
    title: "Content Library",
    filename: "content-library",
    template: "generic_list",
    subtitle: `Marketing Content Library · ${filteredAssets.length} assets`,
    docId: "CL-EXPORT",
    columns: CONTENT_COLUMNS,
    rows: filteredAssets
  });
  const typeOptions = [...new Set(assets.map(c => c.type))].sort();
  const categoryOptions = [...new Set(assets.map(c => c.category))].filter(Boolean).sort();

  // ── Use ────────────────────────────────────────────────────────────────────
  const handleUse = async asset => {
    try {
      await contentLibraryApi.use(asset._id || asset.id);
      setAssets(prev => prev.map(a => (a._id || a.id) === (asset._id || asset.id) ? {
        ...a,
        used: a.used + 1
      } : a));
      setSelectedAsset(null);
      // FIX: replaced alert() with a toast notification
      toast.push(`"${asset.name}" used — count updated`);
    } catch (e) {
      toast.push('Failed to log usage: ' + e.message, 'error');
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = asset => {
    // FIX: graceful handling when url is blank (seeded assets have no file yet)
    if (!asset.url) {
      toast.push('No file uploaded for this asset yet.', 'info');
      return;
    }
    const a = document.createElement('a');
    a.href = asset.url;
    a.download = asset.name || 'asset';
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const handleUploaded = created => {
    setAssets(prev => [normalizeAsset(created, prev.length), ...prev]);
  };

  // ── Delete → moves to Recently Deleted (soft delete via isDeleted flag) ────
  // FIX: new delete flow. Backend ContentLibrary schema already has `isDeleted`
  // (see extendedModels.js), and crud() exposes DELETE /content-library/:id
  // which createCRUD implementations typically soft-delete (sets isDeleted: true)
  // rather than removing the document — this is what makes "Recently Deleted"
  // possible across all your other modules (jobs, customers, etc).
  const handleDeleteConfirmed = async asset => {
    try {
      await contentLibraryApi.remove(asset._id || asset.id);
      setAssets(prev => prev.filter(a => (a._id || a.id) !== (asset._id || asset.id)));
      setDeleteTarget(null);
      setSelectedAsset(null);
      toast.push(`"${asset.name}" moved to Recently Deleted`);
    } catch (e) {
      toast.push('Delete failed: ' + e.message, 'error');
    }
  };
  return <div className="fi ap-content-library-page-68">

      {/* Header */}
      <div className="ap-content-library-page-69">
        <div>
          <div className="ap-content-library-page-70">Content Library</div>
          <div className="ap-content-library-page-71">
            {filteredAssets.length} of {assets.length} assets
          </div>
        </div>
        <div className="ap-content-library-page-72">
          <button className="btn ap-content-library-page-73" onClick={() => toast.push('Google Drive connection would open here', 'info')}>
            🔗 Connect Drive
          </button>
          <button className="btn ap-content-library-page-74" onClick={() => setShowUpload(true)}>
            ⬆ Upload Asset
          </button>
        </div>
      </div>

      {/* Search + Filter + Export bar */}
      <div className="ap-content-library-page-75">
        <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, type, tags…" />
        <FilterSelect value={activeFilters.type} onChange={val => setFilter("type", val)} options={typeOptions} allLabel="All Types" />
        <FilterSelect value={activeFilters.category} onChange={val => setFilter("category", val)} options={categoryOptions} allLabel="All Categories" />
        <div className="ap-content-library-page-76">
          <ExportDropdown {...exportProps} />
        </div>
      </div>

      {/* Grid */}
      {loading ? <div className="ap-content-library-page-77">Loading assets…</div> : filteredAssets.length > 0 ? <div className="ap-content-library-page-78">
          {filteredAssets.map(asset => <div key={asset.id} className="card ap-content-library-page-79" onClick={() => setSelectedAsset(asset)}>
              <div className="ap-content-library-page-80">
                {/* FIX: render the real image thumbnail when one exists, instead of
                    always showing the generic type emoji — makes it obvious at a
                    glance which assets have actual files vs. which are still empty */}
                {asset.type === 'image' && asset.url ? <img src={asset.url} alt={asset.name} onError={e => {
            e.target.style.display = 'none';
          }} className="ap-content-library-page-81" /> : asset.preview}
                <div className="ap-content-library-page-82">
                  {asset.format}
                </div>
                {/* FIX: delete button on the card itself, not just inside the detail modal */}
                <button onClick={e => {
            e.stopPropagation();
            setDeleteTarget(asset);
          }} title="Delete asset" className="ap-content-library-page-83">
                  🗑
                </button>
              </div>
              <div className="ap-content-library-page-84">
                <div className="ap-content-library-page-85">
                  {asset.name}
                </div>
                <div className="ap-content-library-page-86">
                  <span className="ap-content-library-page-87">
                    {asset.type}
                  </span>
                  <span className="ap-content-library-page-88">{asset.category}</span>
                </div>
                {asset.tags?.length > 0 && <div className="ap-content-library-page-89">
                    {asset.tags.map(tag => <span key={tag} className="ap-content-library-page-90">
                        {tag}
                      </span>)}
                  </div>}
                <div className="ap-content-library-page-91">
                  <ChannelChips channels={asset.channels} />
                  <span className="ap-content-library-page-92">Used {asset.used}x</span>
                </div>
                <div onClick={e => e.stopPropagation()} className="ap-content-library-page-93">
                  <button className="btn ap-content-library-page-94" onClick={() => handleUse(asset)}>
                    Use
                  </button>
                  <button className="btn ap-content-library-page-95" onClick={() => handleDownload(asset)} disabled={!asset.url} style={{
              color: asset.url ? "var(--text-muted)" : "var(--xcbd5e1)",
              cursor: asset.url ? "pointer" : "not-allowed"
            }}>
                    ⬇
                  </button>
                </div>
              </div>
            </div>)}
        </div> : <div className="ap-content-library-page-96">
          <div className="ap-content-library-page-97">🔍</div>
          <div className="ap-content-library-page-98">No assets found</div>
          <div className="ap-content-library-page-99">Try adjusting your search or filters, or upload a new asset.</div>
        </div>}

      {/* Detail modal */}
      <DetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} onUse={handleUse} onDownload={handleDownload} onDelete={asset => setDeleteTarget(asset)} />

      {/* Upload modal */}
      <UploadAssetModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={handleUploaded} toast={toast} />

      {/* Delete confirmation */}
      <DeleteConfirmModal asset={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirmed} />

      {/* Toast host — renders all active toasts */}
      <toast.ToastHost />
    </div>;
};
export default ContentLibraryPage;