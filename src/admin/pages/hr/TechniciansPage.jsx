import { JOB_STATUS, TECH_STATUS } from '../../constants/statusMaps';
import { jobsApi, techsApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, Avatar } from '../../components/ui/Badges';
import { Thead } from '../../components/ui/Cards';
import ActionDropdown from '../../components/ui/ActionDropdown';
import EditableDetailView from '../../components/ui/EditableDetailView';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import PDFPreview from '../../components/layout/PDFPreview';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Normalise API technician → UI shape ─────────────────────────────────────
const normaliseTech = t => ({
  ...t,
  id: t.techId || 'TECH-' + String(t._id || t.id).slice(-6).toUpperCase(),
  _id: t._id || t.id,
  name: t.name || t.techName || 'Unknown',
  role: t.role || t.designation || 'Technician',
  status: t.status || 'available',
  area: t.area || t.serviceArea || t.zone || '',
  phone: t.phone || t.mobile || '',
  email: t.email || '',
  skills: Array.isArray(t.skills) ? t.skills : t.skills ? [t.skills] : [],
  jobs: t.jobs ?? t.totalJobs ?? 0,
  completed: t.completed ?? t.completedJobs ?? t.done ?? 0,
  rating: t.rating ?? 0
});

// ─── Normalise API job → UI shape ─────────────────────────────────────────────
const normaliseJob = j => ({
  ...j,
  id: j.jobId || 'JOB-' + String(j._id).slice(-6).toUpperCase(),
  customer: typeof j.customer === 'object' ? j.customer?.name : j.customerName || j.customer || '',
  tech: typeof j.technician === 'object' ? j.technician?.name : j.techName || j.tech || 'Unassigned',
  date: j.scheduledDate ?fmtDateDMY(new Date(j.scheduledDate)) : j.date || '',
  time: j.scheduledTime || j.time || ''
});

// ─── Export column config ─────────────────────────────────────────────────────
const TECH_COLUMNS = [{
  label: 'Tech ID',
  key: 'id',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 11
  }
}, {
  label: 'Name',
  key: 'name',
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Role',
  key: 'role',
  width: 18,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Status',
  key: 'status',
  width: 12,
  format: v => TECH_STATUS[v]?.label ?? v
}, {
  label: 'Service Area',
  key: 'area',
  width: 16,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Phone',
  key: 'phone',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Jobs',
  key: 'jobs',
  width: 8,
  tdStyle: {
    fontFamily: 'monospace',
    textAlign: 'center'
  },
  format: v => v
}, {
  label: 'Done',
  key: 'completed',
  width: 8,
  tdStyle: {
    fontFamily: 'monospace',
    textAlign: 'center'
  },
  format: v => v
}, {
  label: 'Rating',
  key: 'rating',
  width: 8,
  format: v => `${v}★`
}];

// ─── View toggle ──────────────────────────────────────────────────────────────
const ViewToggle = ({
  view,
  setView
}) => <div className="ap-technicians-page-1">
    {[{
    key: 'grid',
    icon: '⊞',
    label: 'Grid'
  }, {
    key: 'table',
    icon: '☰',
    label: 'Table'
  }].map(({
    key,
    icon,
    label
  }) => <button key={key} onClick={() => setView(key)} style={{
    background: view === key ? "var(--brand)" : "var(--white)",
    color: view === key ? "var(--white)" : "var(--text-muted)"
  }} className="ap-technicians-page-2">
        <span className="ap-technicians-page-3">{icon}</span>{label}
      </button>)}
  </div>;
const statusColor = s => s === 'available' ? '#10B981' : s === 'busy' ? COLORS.brand : '#94A3B8';
const DS = ({
  title,
  icon
}) => <div className="ap-technicians-page-4">
    {icon && <span className="ap-technicians-page-5">{icon}</span>}{title}
  </div>;
const DR = ({
  label,
  value,
  mono
}) => !value ? null : <div className="ap-technicians-page-6">
    <div className="ap-technicians-page-7">{label}</div>
    <div style={{
    fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
  }} className="ap-technicians-page-8">{value}</div>
  </div>;
const EF = ({
  label,
  eKey,
  editMode,
  editData,
  setEditData,
  tech,
  type = 'text',
  options,
  mono,
  placeholder
}) => {
  const readVal = tech[eKey] ?? '—';
  const editVal = editData[eKey] ?? tech[eKey] ?? '';
  const set = e => setEditData(prev => ({
    ...prev,
    [eKey]: e.target.value
  }));
  const inputStyle = {
    flex: 1,
    padding: '7px 10px',
    borderRadius: 7,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 13,
    color: COLORS.h2,
    background: "var(--bg)",
    fontFamily: mono ? FONTS.mono : FONTS.sans,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
    width: '100%'
  };
  return <div style={{
    alignItems: editMode ? "center" : "flex-start"
  }} className="ap-technicians-page-9">
      <div style={{
      paddingTop: editMode ? "0" : "1px"
    }} className="ap-technicians-page-10">
        {label}
      </div>
      {editMode ? type === 'select' ? <select value={editVal} onChange={set} style={{
      fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
    }} className="ap-technicians-page-11">
              {(options || []).map(o => <option key={o}>{o}</option>)}
            </select> : <input type={type} value={editVal} onChange={set} placeholder={placeholder || label} style={{
      fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
    }} onFocus={e => e.target.style.borderColor = COLORS.brand} onBlur={e => e.target.style.borderColor = COLORS.border} className="ap-technicians-page-12" /> : <div style={{
      color: readVal === '—' ? "var(--text-faint)" : "var(--text-h2)",
      fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
    }} className="ap-technicians-page-13">
            {readVal}
          </div>}
    </div>;
};
const TECH_FIELDS = ['name', 'role', 'status', 'gender', 'dob', 'bloodGroup', 'maritalStatus', 'nationality', 'department', 'employmentType', 'phone', 'altPhone', 'email', 'personalEmail', 'emergencyName', 'emergencyPhone', 'street', 'area', 'city', 'state', 'country', 'pincode', 'joinDate', 'probationEnd', 'shift', 'reportingTo', 'salary', 'dailyAllowance', 'overtimeRate', 'skills', 'experience', 'brands', 'specialization', 'certification', 'certNo', 'vehicleType', 'vehicleReg', 'licenceNo', 'aadhaar', 'pan', 'accountHolder', 'bankName', 'accountNo', 'ifsc', 'accountType', 'upiId'].map(key => ({
  key
}));

// ─── Technician Detail ────────────────────────────────────────────────────────
const TechnicianDetail = ({
  tech,
  onBack,
  initialEditMode = false,
  openModal,
  jobs = []
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const firstName = (tech.name ?? '').split(' ')[0];
  const techJobs = jobs.filter(j => (j.tech ?? '').toLowerCase().includes(firstName.toLowerCase()));
  const tabs = [{
    key: 'profile',
    label: '👤 Profile'
  }, {
    key: 'jobs',
    label: '🔧 Jobs'
  }, {
    key: 'docs',
    label: '📄 Documents'
  }, {
    key: 'bank',
    label: '🏦 Bank'
  }];
  return <EditableDetailView id={tech.id} breadcrumb="Technicians" onBack={onBack} fields={TECH_FIELDS} data={tech} initialEditMode={initialEditMode} onSave={updated => {
    console.log('Saved technician:', updated);
  }} onDelete={() => {
    console.log('Deleted:', tech.id);
    onBack();
  }}>
      {({
      editMode,
      editData,
      setEditData
    }) => {
      const ef = (label, eKey, extra = {}) => <EF key={eKey} label={label} eKey={eKey} editMode={editMode} editData={editData} setEditData={setEditData} tech={tech} {...extra} />;
      return <div className="ap-technicians-page-14">

            {/* ── LEFT SIDEBAR ── */}
            <div className="ap-technicians-page-15">

              <div style={{
            border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
            boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
          }} className="ap-technicians-page-16">
                <div className="ap-technicians-page-17">
                  <Avatar name={editMode ? editData.name || tech.name : tech.name} size={72} color={statusColor(editMode ? editData.status || tech.status : tech.status)} />
                  <div style={{
                background: statusColor(editMode ? editData.status || tech.status : tech.status)
              }} className="ap-technicians-page-18" />
                </div>

                <div className="ap-technicians-page-19">
                  {editMode ? <>
                      <input value={editData.name ?? tech.name} onChange={e => setEditData(p => ({
                  ...p,
                  name: e.target.value
                }))} className="ap-technicians-page-20" />
                      <select value={editData.role ?? tech.role} onChange={e => setEditData(p => ({
                  ...p,
                  role: e.target.value
                }))} className="ap-technicians-page-21">
                        {['Junior Technician', 'Technician', 'Senior Technician', 'Lead Technician', 'Supervisor', 'Foreman'].map(r => <option key={r}>{r}</option>)}
                      </select>
                      <select value={editData.status ?? tech.status} onChange={e => setEditData(p => ({
                  ...p,
                  status: e.target.value
                }))} className="ap-technicians-page-22">
                        {['available', 'busy', 'off', 'on_leave'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </> : <>
                      <div className="ap-technicians-page-23">{tech.name}</div>
                      <div className="ap-technicians-page-24">{tech.role}</div>
                      <div className="ap-technicians-page-25">{tech.id}</div>
                      <div className="ap-technicians-page-26"><SBadge s={tech.status} map={TECH_STATUS} /></div>
                    </>}
                </div>

                <div className="ap-technicians-page-27">
                  {[['Jobs', tech.jobs], ['Done', tech.completed], [`${tech.rating}★`, 'Rating']].map(([k, v], i) => <div key={k} className="ap-technicians-page-28">
                      <div style={{
                  color: i === 2 ? "var(--warning)" : "var(--text-h1)"
                }} className="ap-technicians-page-29">{i === 2 ? k : v}</div>
                      <div className="ap-technicians-page-30">{i === 2 ? 'Rating' : k}</div>
                    </div>)}
                </div>
              </div>

              <div style={{
            border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`
          }} className="ap-technicians-page-31">
                <div className="ap-technicians-page-32">Contact</div>
                {[{
              icon: '📞',
              key: 'phone',
              type: 'tel',
              fallback: ''
            }, {
              icon: '✉️',
              key: 'email',
              type: 'email',
              fallback: `${firstName.toLowerCase()}@cooltech.com`
            }, {
              icon: '📍',
              key: 'area',
              type: 'text',
              fallback: ''
            }].map(({
              icon,
              key,
              type,
              fallback
            }) => <div key={key} className="ap-technicians-page-33">
                    <span className="ap-technicians-page-34">{icon}</span>
                    {editMode ? <input type={type} value={editData[key] ?? tech[key] ?? fallback} onChange={e => setEditData(p => ({
                ...p,
                [key]: e.target.value
              }))} onFocus={e => e.target.style.borderColor = COLORS.brand} onBlur={e => e.target.style.borderColor = COLORS.border} className="ap-technicians-page-35" /> : <span className="ap-technicians-page-36">{tech[key] || fallback || '—'}</span>}
                  </div>)}
              </div>

              <div style={{
            border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`
          }} className="ap-technicians-page-37">
                <div className="ap-technicians-page-38">Skills</div>
                {editMode ? <input value={editData.skills ?? (Array.isArray(tech.skills) ? tech.skills.join(', ') : '')} onChange={e => setEditData(p => ({
              ...p,
              skills: e.target.value
            }))} placeholder="Split, VRF, Inverter…" onFocus={e => e.target.style.borderColor = COLORS.brand} onBlur={e => e.target.style.borderColor = COLORS.border} className="ap-technicians-page-39" /> : <div className="ap-technicians-page-40">
                      {(tech.skills ?? []).map(s => <span key={s} className="ap-technicians-page-41">{s}</span>)}
                    </div>}
              </div>
            </div>

            {/* ── RIGHT: Tabbed panel ── */}
            <div style={{
          border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
          boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
        }} className="ap-technicians-page-42">
              <div className="ap-technicians-page-43">
                {tabs.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              fontWeight: activeTab === t.key ? "800" : "600",
              color: activeTab === t.key ? "var(--brand)" : "var(--text-muted)",
              borderBottom: activeTab === t.key ? "2px solid var(--brand)" : "2px solid transparent"
            }} className="ap-technicians-page-44">{t.label}</button>)}
              </div>

              <div className="ap-technicians-page-45">
                {activeTab === 'profile' && <>
                  <DS title="Basic Information" icon="🪪" />
                  <DR label="Tech ID" value={tech.id} mono />
                  {ef('Gender', 'gender', {
                type: 'select',
                options: ['Male', 'Female', 'Other']
              })}
                  {ef('Date of Birth', 'dob', {
                type: 'date'
              })}
                  {ef('Blood Group', 'bloodGroup', {
                type: 'select',
                options: ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']
              })}
                  {ef('Marital Status', 'maritalStatus', {
                type: 'select',
                options: ['Single', 'Married', 'Divorced', 'Widowed']
              })}
                  {ef('Nationality', 'nationality')}
                  {ef('Department', 'department', {
                type: 'select',
                options: ['Field Service', 'Installation', 'AMC', 'Repair', 'VRF / Chillers']
              })}
                  {ef('Employment Type', 'employmentType', {
                type: 'select',
                options: ['Full-time', 'Part-time', 'Contract', 'Freelancer', 'Apprentice']
              })}
                  <DS title="Contact Details" icon="📞" />
                  {ef('Mobile / WhatsApp', 'phone', {
                type: 'tel'
              })}
                  {ef('Alternate Phone', 'altPhone', {
                type: 'tel'
              })}
                  {ef('Personal Email', 'personalEmail', {
                type: 'email'
              })}
                  {ef('Emergency Name', 'emergencyName')}
                  {ef('Emergency Phone', 'emergencyPhone', {
                type: 'tel'
              })}
                  <DS title="Address" icon="🏠" />
                  {ef('Street / Building', 'street')}
                  {ef('City', 'city')}
                  {ef('State', 'state')}
                  {ef('Country', 'country')}
                  {ef('Pincode', 'pincode', {
                mono: true
              })}
                  <DS title="Job Details" icon="💼" />
                  {ef('Join Date', 'joinDate', {
                type: 'date'
              })}
                  {ef('Probation End', 'probationEnd', {
                type: 'date'
              })}
                  {ef('Work Shift', 'shift', {
                type: 'select',
                options: ['Morning (8 AM – 5 PM)', 'Afternoon (12 PM – 9 PM)', 'Flexible', 'On-call']
              })}
                  {ef('Service Area', 'area')}
                  {ef('Reporting To', 'reportingTo')}
                  {ef('Basic Salary (₹)', 'salary', {
                type: 'number'
              })}
                  {ef('Daily Allowance', 'dailyAllowance', {
                type: 'number'
              })}
                  {ef('Overtime (₹/hr)', 'overtimeRate', {
                type: 'number'
              })}
                  <DS title="AC Skills & Certifications" icon="❄️" />
                  {ef('Experience (yrs)', 'experience', {
                type: 'number'
              })}
                  {ef('AC Brands', 'brands')}
                  {ef('Specialization', 'specialization', {
                type: 'select',
                options: ['General Service', 'Installation & Commissioning', 'VRF / VRV Systems', 'Chiller Plants', 'Duct / Central AC', 'Refrigerant Handling']
              })}
                  {ef('Certification', 'certification', {
                type: 'select',
                options: ['None / Not certified', 'RAC Technician (ITI)', 'HVAC Diploma', 'ASHRAE Certified', 'CAREL Certified', 'OEM Trained (Daikin / Carrier)']
              })}
                  {ef('Cert No. / Expiry', 'certNo', {
                mono: true
              })}
                  <DS title="Vehicle / Asset" icon="🏍️" />
                  {ef('Vehicle Type', 'vehicleType', {
                type: 'select',
                options: ['None', 'Bike (Own)', 'Bike (Company)', 'Van (Company)']
              })}
                  {ef('Reg. No.', 'vehicleReg', {
                mono: true
              })}
                  {ef('Licence No.', 'licenceNo', {
                mono: true
              })}
                </>}

                {activeTab === 'jobs' && <>
                  <div className="ap-technicians-page-46">
                    {techJobs.length} job{techJobs.length !== 1 ? 's' : ''} assigned
                  </div>
                  {techJobs.length === 0 ? <div className="ap-technicians-page-47">
                        <div className="ap-technicians-page-48">🔧</div>No jobs assigned yet
                      </div> : <table className="ap-technicians-page-49">
                        <Thead cols={['Job ID', 'Customer', 'Type', 'Scheduled', 'Status']} />
                        <tbody>
                          {techJobs.map(j => <tr key={j._id ?? j.id} className="row ap-technicians-page-50">
                              <td className="ap-technicians-page-51"><span className="ap-technicians-page-52">{j.id}</span></td>
                              <td className="ap-technicians-page-53">{j.customer}</td>
                              <td className="ap-technicians-page-54"><TypeTag type={j.type} /></td>
                              <td className="ap-technicians-page-55">{j.time || '—'}</td>
                              <td className="ap-technicians-page-56"><SBadge s={j.status} map={JOB_STATUS} /></td>
                            </tr>)}
                        </tbody>
                      </table>}
                </>}

                {activeTab === 'docs' && <>
                  <DS title="Identity Numbers" icon="📄" />
                  {ef('Aadhaar Number', 'aadhaar', {
                mono: true,
                placeholder: 'XXXX XXXX XXXX'
              })}
                  {ef('PAN Number', 'pan', {
                mono: true,
                placeholder: 'ABCDE1234F'
              })}
                  <DS title="Document Uploads" icon="📎" />
                  <div className="ap-technicians-page-57">
                    {[{
                  label: 'Aadhaar Card',
                  icon: '🪪',
                  color: '#1D4ED8',
                  bg: '#EFF6FF',
                  border: '#BFDBFE'
                }, {
                  label: 'PAN Card',
                  icon: '💳',
                  color: '#15803D',
                  bg: '#F0FDF4',
                  border: '#BBF7D0'
                }, {
                  label: 'Driving Licence',
                  icon: '🏍️',
                  color: '#7C3AED',
                  bg: '#F5F3FF',
                  border: '#DDD6FE'
                }, {
                  label: 'HVAC Certificate',
                  icon: '📜',
                  color: '#B45309',
                  bg: '#FFFBEB',
                  border: '#FDE68A'
                }].map(({
                  label,
                  icon,
                  color,
                  bg,
                  border
                }) => <div key={label} style={{
                  background: bg,
                  border: `1.5px dashed ${border}`,
                  cursor: editMode ? "pointer" : "default"
                }} className="ap-technicians-page-58">
                        <span className="ap-technicians-page-59">{icon}</span>
                        <div>
                          <div style={{
                      color
                    }} className="ap-technicians-page-60">{label}</div>
                          <div className="ap-technicians-page-61">{editMode ? 'Click to upload' : 'Not uploaded'}</div>
                        </div>
                      </div>)}
                  </div>
                </>}

                {activeTab === 'bank' && <>
                  <DS title="Bank Details" icon="🏦" />
                  {ef('Account Holder', 'accountHolder')}
                  {ef('Bank Name', 'bankName', {
                type: 'select',
                options: ['SBI – State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Bank of Baroda', 'Punjab National Bank', 'Canara Bank', 'Union Bank', 'IndusInd Bank', 'Other']
              })}
                  {ef('Account Number', 'accountNo', {
                mono: true
              })}
                  {ef('IFSC Code', 'ifsc', {
                mono: true
              })}
                  {ef('Account Type', 'accountType', {
                type: 'select',
                options: ['Savings', 'Current']
              })}
                  {ef('UPI ID', 'upiId')}
                  <DS title="System Access" icon="🔐" />
                  <DR label="App Login" value="Allowed ✅" />
                  <DR label="Email Notifications" value="Enabled" />
                  <DR label="WhatsApp Alerts" value="Disabled" />
                  <DR label="User Role" value={tech.role} />
                </>}
              </div>
            </div>
          </div>;
    }}
    </EditableDetailView>;
};

// ─── TechniciansPage ──────────────────────────────────────────────────────────
const TechniciansPage = ({
  openModal
}) => {
  const [view, setView] = useState('grid');
  const [selectedTech, setSelectedTech] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  useEffect(() => {
    techsApi.list({
      limit: 200
    }).then(r => setTechnicians((r.data ?? []).map(normaliseTech))).catch(() => {});
    jobsApi.list({
      limit: 500
    }).then(r => setJobs((r.data ?? []).map(normaliseJob))).catch(() => {});
  }, []);

  // ── Search + filters ────────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(technicians, ['id', 'name', 'role', 'area', 'phone', 'status'], {
    status: '',
    role: ''
  });
  const ROLE_OPTIONS = [...new Set(technicians.map(t => t.role).filter(Boolean))].sort();
  const STATUS_OPTIONS = ['available', 'busy', 'off', 'on_leave'];
  const {
    paginated,
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize,
    from,
    to,
    total
  } = usePagination(searchFiltered, 12);
  const {
    exportProps
  } = useExport({
    title: 'Technicians',
    filename: 'cooltech-technicians',
    template: 'generic_list',
    subtitle: `CoolTech AC Services · Technicians · ${searchFiltered.length} records`,
    docId: 'TECH-EXPORT',
    columns: TECH_COLUMNS,
    rows: searchFiltered,
    showTotals: false
  });
  const openDetail = (tech, editMode = false) => {
    setSelectedTech(tech);
    setOpenInEditMode(editMode);
  };
  const closeDetail = () => {
    setSelectedTech(null);
    setOpenInEditMode(false);
  };

  // ── Soft delete: calls API then removes from local state ────────────────
  // Tries delete → remove → hardDelete in order, falls back to local-only removal
  const handleDelete = async id => {
    try {
      const deleteFn = techsApi.delete ??
      // preferred: soft-delete
      techsApi.remove ??
      // some APIs name it remove
      techsApi.hardDelete ??
      // last resort
      null;
      if (deleteFn) {
        await deleteFn(id);
      } else {
        console.warn('techsApi has no delete/remove method — removing locally only');
      }
    } catch (e) {
      console.warn('Soft delete API call failed, removing locally only', e);
    }
    setTechnicians(prev => prev.filter(t => t._id !== id));
    setDeleteTarget(null);
    if (selectedTech?._id === id) closeDetail();
  };
  if (selectedTech) {
    return <TechnicianDetail tech={selectedTech} onBack={closeDetail} initialEditMode={openInEditMode} openModal={openModal} jobs={jobs} />;
  }
  const todayStr =fmtDateDMY(new Date());
  const todaysJobs = jobs.filter(j => j.date === todayStr);
  const available = technicians.filter(t => t.status === 'available').length;
  const busy = technicians.filter(t => t.status === 'busy').length;
  const onLeave = technicians.filter(t => t.status === 'on_leave' || t.status === 'off').length;
  return <div className="fi ap-technicians-page-62">

      {/* Header */}
      <div className="ap-technicians-page-63">
        <div>
          <div className="ap-technicians-page-64">Technicians</div>
          <div className="ap-technicians-page-65">{technicians.length} field staff · {available} available today</div>
        </div>
        <div className="ap-technicians-page-66">
          <ViewToggle view={view} setView={setView} />
          <button onClick={() => openModal('new_tech')} className="ap-technicians-page-67">+ Add Technician</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="ap-technicians-page-68">
        {[{
        label: 'Total Staff',
        value: technicians.length,
        sub: 'field staff',
        icon: '👷',
        iconBg: '#EFF6FF',
        color: '#1D4ED8'
      }, {
        label: 'Available',
        value: available,
        sub: 'ready to assign',
        icon: '✅',
        iconBg: '#F0FDF4',
        color: '#15803D'
      }, {
        label: 'On Job',
        value: busy,
        sub: 'currently busy',
        icon: '🔧',
        iconBg: COLORS.brandL,
        color: COLORS.brand
      }, {
        label: 'Off / Leave',
        value: onLeave,
        sub: 'unavailable',
        icon: '🏖️',
        iconBg: '#FFF7ED',
        color: '#B45309'
      }].map(({
        label,
        value,
        sub,
        icon,
        iconBg,
        color
      }) => <div key={label} className="ap-technicians-page-69">
            <div className="ap-technicians-page-70">
              <div>
                <div className="ap-technicians-page-71">{label}</div>
                <div style={{
              color
            }} className="ap-technicians-page-72">{value}</div>
                <div className="ap-technicians-page-73">{sub}</div>
              </div>
              <div style={{
            background: iconBg
          }} className="ap-technicians-page-74">{icon}</div>
            </div>
          </div>)}
      </div>

      {/* Toolbar */}
      <div className="ap-technicians-page-75">
        <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, ID, area, phone…" />
        <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={STATUS_OPTIONS} allLabel="All Statuses" />
        <FilterSelect value={activeFilters.role} onChange={val => setFilter('role', val)} options={ROLE_OPTIONS} allLabel="All Roles" />
        <span className="ap-technicians-page-76">{from}–{to} of {total}</span>
        <div className="ap-technicians-page-77"><ExportDropdown {...exportProps} /></div>
      </div>

      {searchFiltered.length === 0 && <div className="ap-technicians-page-78">
          <div className="ap-technicians-page-79">🔍</div>
          No technicians match your search or filters.
        </div>}

      {/* ══ GRID VIEW ══════════════════════════════════════════════════════ */}
      {view === 'grid' && searchFiltered.length > 0 && <>
          <div className="ap-technicians-page-80">
            {paginated.map(t => <div key={t._id ?? t.id} className="card ap-technicians-page-81" onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }} onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.05)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
                <div className="ap-technicians-page-82">
                  <div className="ap-technicians-page-83">
                    <Avatar name={t.name} size={44} color={t.status === 'available' ? '#10B981' : t.status === 'busy' ? COLORS.brand : '#94A3B8'} />
                    <div>
                      <div className="ap-technicians-page-84">{t.name}</div>
                      <div className="ap-technicians-page-85">{t.role}</div>
                      <div className="ap-technicians-page-86">{t.id}</div>
                    </div>
                  </div>
                  <SBadge s={t.status} map={TECH_STATUS} />
                </div>
                <div className="ap-technicians-page-87">
                  {[['Jobs', t.jobs], ['Done', t.completed], [`${t.rating}★`, 'Rating']].map(([k, v], i) => <div key={k} className="ap-technicians-page-88">
                      <div style={{
                color: i === 2 ? "var(--warning)" : "var(--text-h1)"
              }} className="ap-technicians-page-89">{i === 2 ? k : v}</div>
                      <div className="ap-technicians-page-90">{i === 2 ? 'Rating' : k}</div>
                    </div>)}
                </div>
                <div className="ap-technicians-page-91">
                  <div className="ap-technicians-page-92">Skills</div>
                  <div className="ap-technicians-page-93">
                    {(t.skills ?? []).map(s => <span key={s} className="ap-technicians-page-94">{s}</span>)}
                  </div>
                </div>
                <div className="ap-technicians-page-95">
                  <div className="ap-technicians-page-96">📍 {t.area || '—'}</div>
                  <div className="ap-technicians-page-97">
                    <button className="btn ap-technicians-page-98" onClick={() => openModal('advance', {
                prefillTech: {
                  empId: t._id,
                  name: t.name,
                  role: t.role
                }
              })}>
                      Advance
                    </button>
                    <button className="btn ap-technicians-page-99" onClick={() => openDetail(t, false)}>
                      Profile
                    </button>
                  </div>
                </div>
              </div>)}
          </div>
          {totalPages > 1 && <div className="ap-technicians-page-100">
              <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
            </div>}
        </>}

      {/* ══ TABLE VIEW ═════════════════════════════════════════════════════ */}
      {view === 'table' && searchFiltered.length > 0 && <div className="ap-technicians-page-101">
          <div className="ap-technicians-page-102">
            <table className="ap-technicians-page-103">
              <Thead cols={['Technician', 'Role', 'Status', 'Service Area', 'Skills', 'Jobs', 'Done', 'Rating', 'Actions']} />
              <tbody>
                {paginated.map((t, i) => <tr key={t._id ?? t.id ?? i} className="row ap-technicians-page-104" onClick={() => openDetail(t, false)} style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                    <td className="ap-technicians-page-105">
                      <div className="ap-technicians-page-106">
                        <div className="ap-technicians-page-107">
                          <Avatar name={t.name} size={34} color={t.status === 'available' ? '#10B981' : t.status === 'busy' ? COLORS.brand : '#94A3B8'} />
                          <div style={{
                      background: statusColor(t.status)
                    }} className="ap-technicians-page-108" />
                        </div>
                        <div>
                          <div className="ap-technicians-page-109">{t.name}</div>
                          <div className="ap-technicians-page-110">{t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="ap-technicians-page-111">{t.role}</td>
                    <td className="ap-technicians-page-112"><SBadge s={t.status} map={TECH_STATUS} /></td>
                    <td className="ap-technicians-page-113">📍 {t.area || '—'}</td>
                    <td className="ap-technicians-page-114">
                      <div className="ap-technicians-page-115">
                        {(t.skills ?? []).slice(0, 3).map(s => <span key={s} className="ap-technicians-page-116">{s}</span>)}
                        {(t.skills ?? []).length > 3 && <span className="ap-technicians-page-117">+{t.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="ap-technicians-page-118">{t.jobs}</td>
                    <td className="ap-technicians-page-119">{t.completed}</td>
                    <td className="ap-technicians-page-120">{t.rating}★</td>
                    <td onClick={e => e.stopPropagation()} className="ap-technicians-page-121">
                      <ActionDropdown onView={() => openDetail(t, false)} onEdit={() => openDetail(t, true)} onDelete={() => setDeleteTarget({
                  id: t._id,
                  name: t.name
                })} extraItems={[{
                  label: 'Assign Job',
                  icon: '🔧',
                  onClick: () => openModal('new_job')
                }, {
                  label: 'Give Advance',
                  icon: '⬆',
                  onClick: () => openModal('advance', {
                    prefillTech: {
                      empId: t._id,
                      name: t.name,
                      role: t.role
                    }
                  })
                }]} />
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        </div>}

      {/* Today's Assignments */}
      <div className="ap-technicians-page-122">
        <div className="ap-technicians-page-123">
          Today's Assignments
          <span className="ap-technicians-page-124">{todayStr}</span>
        </div>
        {todaysJobs.length === 0 ? <div className="ap-technicians-page-125">
            <div className="ap-technicians-page-126">📋</div>No jobs scheduled for today
          </div> : <div className="ap-technicians-page-127">
            <table className="ap-technicians-page-128">
              <Thead cols={['Job ID', 'Customer', 'Type', 'Scheduled', 'Technician', 'Status']} />
              <tbody>
                {todaysJobs.map(j => <tr key={j._id ?? j.id} className="row ap-technicians-page-129">
                    <td className="ap-technicians-page-130"><span className="ap-technicians-page-131">{j.id}</span></td>
                    <td className="ap-technicians-page-132">{j.customer}</td>
                    <td className="ap-technicians-page-133"><TypeTag type={j.type} /></td>
                    <td className="ap-technicians-page-134">{j.time || '—'}</td>
                    <td className="ap-technicians-page-135">
                      {j.tech === 'Unassigned' ? <span className="ap-technicians-page-136">⚠ Unassigned</span> : <div className="ap-technicians-page-137">
                            <Avatar name={j.tech} size={22} />
                            <span className="ap-technicians-page-138">{j.tech}</span>
                          </div>}
                    </td>
                    <td className="ap-technicians-page-139"><SBadge s={j.status} map={JOB_STATUS} /></td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </div>

      {/* ── Delete confirm — shows technician name ── */}
      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => handleDelete(deleteTarget?.id)} onCancel={() => setDeleteTarget(null)} message={deleteTarget ? `"${deleteTarget.name}" will be soft-deleted and visible in Recently Deleted.` : 'This technician will be soft-deleted.'} />
    </div>;
};
export default TechniciansPage;