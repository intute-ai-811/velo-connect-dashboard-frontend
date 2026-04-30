import { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Pencil, Trash2, Truck } from 'lucide-react';
import Header from '../Header';
import FooterFixed from '../Footer';
import { Modal, Field } from './CustomerMaster';

const T = {
  bg:        '#010408',
  border:    'rgba(37,99,235,0.14)',
  btnGrad:   'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)',
  accentLine:'linear-gradient(90deg,#1e3a8a,#2563eb,#0ea5e9,#7dd3fc)',
  text:      'rgba(224,242,254,0.88)',
  textSub:   'rgba(147,197,253,0.4)',
  textMuted: 'rgba(56,189,248,0.22)',
};

const EMPTY = { vehicle_unique_id:'', vehicle_no:'', make:'', model:'', customer_id:'', date_of_deployment:'' };

export default function VehicleMaster({ user, onLogout }) {
  const [vehicles,  setVehicles]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  async function load() {
    setLoading(true);
    try { const [vR,cR] = await Promise.all([api.get('/api/admin/vehicles'),api.get('/api/admin/customers')]); setVehicles(vR.data.data); setCustomers(cR.data.data); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(''); setModal('create'); }
  function openEdit(v) { setForm({ vehicle_unique_id:v.vehicle_unique_id, vehicle_no:v.vehicle_no||'', make:v.make||'', model:v.model||'', customer_id:v.customer_id||'', date_of_deployment:v.date_of_deployment?v.date_of_deployment.split('T')[0]:'' }); setError(''); setModal({ vehicle_master_id:v.vehicle_master_id }); }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const payload = { ...form, customer_id:form.customer_id||null };
      modal==='create' ? await api.post('/api/admin/vehicles',payload) : await api.put(`/api/admin/vehicles/${modal.vehicle_master_id}`,payload);
      setModal(null); load();
    } catch(e) { setError(e.response?.data?.error||'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this vehicle? All telemetry data will be removed.')) return;
    try { await api.delete(`/api/admin/vehicles/${id}`); load(); }
    catch(e) { alert(e.response?.data?.error||'Delete failed'); }
  }

  const f = key => val => setForm({...form,[key]:val});
  const COLS = ['Device ID','Reg. No.','Make / Model','Customer','Deployed',''];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:T.bg, color:T.text, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', position:'relative' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ position:'fixed', inset:0, backgroundImage:'radial-gradient(circle, rgba(56,189,248,0.055) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:-200, right:-100, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 65%)', pointerEvents:'none', zIndex:0 }} />

      <Header user={user} onLogout={onLogout} />

      <main style={{ position:'relative', zIndex:1, flex:1, maxWidth:1150, width:'100%', margin:'0 auto', padding:'32px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
              <div style={{ width:3, height:22, borderRadius:2, background:T.accentLine }} />
              <h1 style={{ fontSize:22, fontWeight:700, color:T.text, letterSpacing:'-0.02em', margin:0 }}>Vehicle Database</h1>
            </div>
            <p style={{ fontSize:13, color:T.textSub, marginLeft:15 }}>Manage vehicle records and customer assignments</p>
          </div>
          <button onClick={openCreate} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:12, border:'none', background:T.btnGrad, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
            <Plus style={{ width:15,height:15 }}/> Add Vehicle
          </button>
        </div>

        <div style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${T.border}`, background:'rgba(2,5,20,0.8)' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}`, background:'rgba(37,99,235,0.04)' }}>
                  {COLS.map((c,i) => <th key={i} style={{ padding:'14px 20px', textAlign:i===5?'right':'left', fontSize:10, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.14em', whiteSpace:'nowrap' }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding:'80px', textAlign:'center' }}>
                    <div style={{ width:28,height:28,border:'2px solid rgba(37,99,235,0.25)',borderTopColor:'#2563eb',borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto 12px' }}/>
                    <p style={{ color:T.textSub, fontSize:13 }}>Loading vehicles…</p>
                  </td></tr>
                ) : vehicles.length===0 ? (
                  <tr><td colSpan={6} style={{ padding:'80px', textAlign:'center' }}>
                    <div style={{ width:48,height:48,borderRadius:14,background:'rgba(37,99,235,0.08)',border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px' }}>
                      <Truck style={{ width:22,height:22,color:T.textMuted }}/>
                    </div>
                    <p style={{ color:T.textMuted, fontSize:13 }}>No vehicles yet. Add one to get started.</p>
                  </td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.vehicle_master_id} style={{ borderBottom:`1px solid rgba(37,99,235,0.07)`, transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(37,99,235,0.05)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                  >
                    <td style={{ padding:'13px 20px', fontFamily:'monospace', fontSize:12, color:T.textSub }}>{v.vehicle_unique_id}</td>
                    <td style={{ padding:'13px 20px', fontWeight:600, fontSize:13, color:T.text }}>{v.vehicle_no||'—'}</td>
                    <td style={{ padding:'13px 20px', fontSize:13, color:'rgba(147,197,253,0.6)' }}>{[v.make,v.model].filter(Boolean).join(' ')||'—'}</td>
                    <td style={{ padding:'13px 20px', fontSize:13, color:T.textSub }}>{v.company_name||'—'}</td>
                    <td style={{ padding:'13px 20px', fontSize:12, color:T.textMuted }}>{v.date_of_deployment?new Date(v.date_of_deployment).toLocaleDateString('en-IN'):'—'}</td>
                    <td style={{ padding:'13px 20px', textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}>
                        <IBtn icon={Pencil} onClick={()=>openEdit(v)} color="#38bdf8"/>
                        <IBtn icon={Trash2} onClick={()=>handleDelete(v.vehicle_master_id)} color="#f87171"/>
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

      <Modal open={modal!==null} title={modal==='create'?'Add Vehicle':'Edit Vehicle'} onClose={()=>setModal(null)} onSave={handleSave} saving={saving} error={error}>
        <Field label="Device / Unique ID *" value={form.vehicle_unique_id} onChange={f('vehicle_unique_id')} disabled={modal!=='create'} placeholder="e.g. VH-001"/>
        <Field label="Registration No."     value={form.vehicle_no}        onChange={f('vehicle_no')}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Make"  value={form.make}  onChange={f('make')}/>
          <Field label="Model" value={form.model} onChange={f('model')}/>
        </div>
        <div>
          <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(56,189,248,0.35)', textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:6 }}>Assign to Customer</label>
          <select value={form.customer_id} onChange={e=>f('customer_id')(e.target.value)} style={{ colorScheme:'dark', width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid rgba(37,99,235,0.18)', background:'rgba(37,99,235,0.06)', color:'rgba(224,242,254,0.88)', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}>
            <option value="">— Unassigned —</option>
            {customers.map(c=><option key={c.customer_id} value={c.customer_id}>{c.company_name||c.full_name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(56,189,248,0.35)', textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:6 }}>Date of Deployment</label>
          <input type="date" value={form.date_of_deployment} onChange={e=>f('date_of_deployment')(e.target.value)} style={{ colorScheme:'dark', width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid rgba(37,99,235,0.18)', background:'rgba(37,99,235,0.06)', color:'rgba(224,242,254,0.88)', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
        </div>
      </Modal>
    </div>
  );
}

function IBtn({ icon:Icon, onClick, color }) {
  return (
    <button onClick={onClick} style={{ padding:7, borderRadius:8, background:'transparent', border:'1px solid transparent', cursor:'pointer', display:'flex', transition:'all 0.15s', color:'rgba(56,189,248,0.2)' }}
      onMouseEnter={e=>{ e.currentTarget.style.background=`${color}12`; e.currentTarget.style.borderColor=`${color}30`; e.currentTarget.style.color=color; }}
      onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='rgba(56,189,248,0.2)'; }}
    ><Icon style={{ width:14,height:14 }}/></button>
  );
}
