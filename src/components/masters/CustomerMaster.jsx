import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle, Users } from 'lucide-react';
import Header from '../Header';
import FooterFixed from '../Footer';

const T = {
  bg:        '#010408',
  cardBg:    'rgba(2,5,20,0.95)',
  border:    'rgba(37,99,235,0.14)',
  btnGrad:   'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)',
  accentLine:'linear-gradient(90deg,#1e3a8a,#2563eb,#0ea5e9,#7dd3fc)',
  text:      'rgba(224,242,254,0.88)',
  textSub:   'rgba(147,197,253,0.4)',
  textMuted: 'rgba(56,189,248,0.22)',
  inputBg:   'rgba(37,99,235,0.06)',
  inputBdr:  'rgba(37,99,235,0.18)',
};

const EMPTY = { email:'', password:'', full_name:'', company_name:'', phone:'', address:'' };

export default function CustomerMaster({ user, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  async function load() {
    setLoading(true);
    try { const r = await axios.get('/api/admin/customers'); setCustomers(r.data.data); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(''); setModal('create'); }
  function openEdit(c) { setForm({ full_name:c.full_name, company_name:c.company_name||'', phone:c.phone||'', address:c.address||'', email:'', password:'' }); setError(''); setModal({ customer_id:c.customer_id }); }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      modal==='create' ? await axios.post('/api/admin/customers', form) : await axios.put(`/api/admin/customers/${modal.customer_id}`, form);
      setModal(null); load();
    } catch(e) { setError(e.response?.data?.error||'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this customer?')) return;
    try { await axios.delete(`/api/admin/customers/${id}`); load(); }
    catch(e) { alert(e.response?.data?.error||'Delete failed'); }
  }

  const COLS = ['Name','Email','Company','Phone',''];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:T.bg, color:T.text, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', position:'relative' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ position:'fixed', inset:0, backgroundImage:'radial-gradient(circle, rgba(56,189,248,0.055) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:-200, right:-100, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 65%)', pointerEvents:'none', zIndex:0 }} />

      <Header user={user} onLogout={onLogout} />

      <main style={{ position:'relative', zIndex:1, flex:1, maxWidth:1000, width:'100%', margin:'0 auto', padding:'32px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
              <div style={{ width:3, height:22, borderRadius:2, background:T.accentLine }} />
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, letterSpacing:'-0.02em', margin:0 }}>Customer Database</h1>
            </div>
            <p style={{ fontSize:13, color:T.textSub, marginLeft:15 }}>Manage customer accounts and profiles</p>
          </div>
          <button onClick={openCreate} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:12, border:'none', background:T.btnGrad, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
            <Plus style={{ width:15,height:15 }}/> Add Customer
          </button>
        </div>

        <div style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${T.border}`, background:'rgba(2,5,20,0.8)' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}`, background:'rgba(37,99,235,0.04)' }}>
                  {COLS.map((c,i) => <th key={i} style={{ padding:'14px 20px', textAlign:i===4?'right':'left', fontSize:10, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.14em' }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding:'80px', textAlign:'center' }}>
                    <Loader2 style={{ width:28,height:28,color:'#2563eb',animation:'spin 0.7s linear infinite',margin:'0 auto 12px' }}/>
                    <p style={{ color:T.textSub, fontSize:13 }}>Loading customers…</p>
                  </td></tr>
                ) : customers.length===0 ? (
                  <tr><td colSpan={5} style={{ padding:'80px', textAlign:'center' }}>
                    <div style={{ width:48,height:48,borderRadius:14,background:'rgba(37,99,235,0.08)',border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px' }}>
                      <Users style={{ width:22,height:22,color:T.textMuted }}/>
                    </div>
                    <p style={{ color:T.textMuted, fontSize:13 }}>No customers yet. Add one to get started.</p>
                  </td></tr>
                ) : customers.map(c => (
                  <tr key={c.customer_id} style={{ borderBottom:`1px solid rgba(37,99,235,0.07)`, transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(37,99,235,0.05)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                  >
                    <td style={{ padding:'13px 20px', fontWeight:600, fontSize:13, color:T.text }}>{c.full_name}</td>
                    <td style={{ padding:'13px 20px', fontSize:13, color:T.textSub }}>{c.email}</td>
                    <td style={{ padding:'13px 20px', fontSize:13, color:'rgba(147,197,253,0.6)' }}>{c.company_name||'—'}</td>
                    <td style={{ padding:'13px 20px', fontSize:13, color:T.textSub }}>{c.phone||'—'}</td>
                    <td style={{ padding:'13px 20px', textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}>
                        <IconBtn icon={Pencil} onClick={() => openEdit(c)} color="#38bdf8" />
                        <IconBtn icon={Trash2} onClick={() => handleDelete(c.customer_id)} color="#f87171" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <FooterFixed />

      <Modal open={modal!==null} title={modal==='create'?'Add Customer':'Edit Customer'} onClose={()=>setModal(null)} onSave={handleSave} saving={saving} error={error}>
        {modal==='create' && <>
          <Field label="Email *"    value={form.email}    onChange={v=>setForm({...form,email:v})}    type="email" />
          <Field label="Password *" value={form.password} onChange={v=>setForm({...form,password:v})} type="password" />
        </>}
        <Field label="Full Name *"  value={form.full_name}    onChange={v=>setForm({...form,full_name:v})} />
        <Field label="Company Name" value={form.company_name} onChange={v=>setForm({...form,company_name:v})} />
        <Field label="Phone"        value={form.phone}        onChange={v=>setForm({...form,phone:v})} />
        <Field label="Address"      value={form.address}      onChange={v=>setForm({...form,address:v})} />
      </Modal>
    </div>
  );
}

/* ── Shared components ─────────────────────────────────── */
function IconBtn({ icon:Icon, onClick, color }) {
  return (
    <button onClick={onClick} style={{ padding:7, borderRadius:8, background:'transparent', border:`1px solid transparent`, cursor:'pointer', display:'flex', transition:'all 0.15s', color:'rgba(56,189,248,0.2)' }}
      onMouseEnter={e=>{ e.currentTarget.style.background=`${color}12`; e.currentTarget.style.borderColor=`${color}30`; e.currentTarget.style.color=color; }}
      onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='rgba(56,189,248,0.2)'; }}
    >
      <Icon style={{ width:14,height:14 }}/>
    </button>
  );
}

export function Modal({ open, title, onClose, onSave, saving, error, children }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,2,10,0.75)', backdropFilter:'blur(8px)' }} onClick={onClose} />
      <div style={{ position:'relative', width:'100%', maxWidth:440, background:'rgba(2,5,18,0.98)', border:'1px solid rgba(37,99,235,0.22)', borderRadius:20, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ height:2, background:'linear-gradient(90deg,#1e3a8a,#2563eb,#0ea5e9,#7dd3fc)' }} />
        <div style={{ padding:'24px 28px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
            <h3 style={{ fontSize:17, fontWeight:700, color:'rgba(224,242,254,0.9)', margin:0 }}>{title}</h3>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(56,189,248,0.3)', padding:4, display:'flex', borderRadius:6, transition:'color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='rgba(224,242,254,0.7)')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(56,189,248,0.3)')}
            ><X style={{ width:16,height:16 }}/></button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>{children}</div>
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginTop:14 }}>
              <AlertCircle style={{ width:14,height:14,color:'#fca5a5',flexShrink:0 }}/>
              <span style={{ color:'#fca5a5', fontSize:13 }}>{error}</span>
            </div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:22 }}>
            <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:12, border:'1px solid rgba(37,99,235,0.18)', background:'rgba(37,99,235,0.06)', color:'rgba(147,197,253,0.5)', fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>Cancel</button>
            <button onClick={onSave} disabled={saving} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.6:1, fontFamily:'inherit', boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
              {saving ? <Loader2 style={{ width:14,height:14,animation:'spin 0.7s linear infinite' }}/> : <Check style={{ width:14,height:14 }}/>}
              {saving?'Saving…':'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, type='text', disabled=false, placeholder='' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(56,189,248,0.35)', textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:6 }}>{label}</label>
      <input
        type={type} value={value} onChange={e=>onChange(e.target.value)}
        disabled={disabled} placeholder={placeholder}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${focused?'rgba(14,165,233,0.45)':'rgba(37,99,235,0.18)'}`, background:focused?'rgba(14,165,233,0.07)':'rgba(37,99,235,0.06)', color:'rgba(224,242,254,0.88)', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', opacity:disabled?0.4:1, transition:'all 0.2s', boxShadow:focused?'0 0 0 3px rgba(14,165,233,0.1)':'none' }}
      />
    </div>
  );
}
