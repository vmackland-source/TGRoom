
import { useState } from 'react';

export default function Profile(){
  const [email, setEmail] = useState('');
  const [pref, setPref] = useState('hybrid');
  const [resp, setResp] = useState(null);

  async function save(){
    const res = await fetch('/api/profile/update', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, cannabisPreference: pref })
    });
    const data = await res.json();
    setResp(data);
  }

  return (
    <main className="container">
      <div className="card">
        <h2 style={{marginTop:0}}>Your Profile</h2>
        <input className="input" placeholder="Your account email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <select className="select" value={pref} onChange={e=>setPref(e.target.value)}>
          <option value="indica">Indica</option>
          <option value="sativa">Sativa</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <button className="button" onClick={save}>Save Preference</button>
        {resp && <p style={{marginTop:12}}><span className="badge">Saved</span></p>}
      </div>
    </main>
  );
}
