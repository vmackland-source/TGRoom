
import { useEffect, useState } from 'react';

function useFetch(url){
  const [data, setData] = useState(null);
  useEffect(()=>{
    (async ()=>{
      const res = await fetch(url);
      const d = await res.json();
      setData(d);
    })();
  }, [url]);
  return data;
}

export default function Admin(){
  const key = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('key') : '';
  const memberships = useFetch('/api/admin/members?key='+key);
  const reservations = useFetch('/api/admin/reservations?key='+key);
  const orders = useFetch('/api/admin/orders?key='+key);

  return (
    <main className="container">
      <div className="card">
        <h2 style={{marginTop:0}}>Admin Dashboard</h2>
        <p>Append <code>?key=YOUR_ADMIN_KEY</code> to URL.</p>
        <div className="grid grid-3">
          <div className="card">
            <h3>Memberships</h3>
            <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(memberships, null, 2)}</pre>
          </div>
          <div className="card">
            <h3>Reservations</h3>
            <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(reservations, null, 2)}</pre>
          </div>
          <div className="card">
            <h3>Orders</h3>
            <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(orders, null, 2)}</pre>
          </div>
        </div>
      </div>
    </main>
  );
}
