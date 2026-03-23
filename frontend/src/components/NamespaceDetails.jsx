import React, {useEffect, useState} from 'react'
import { Bar } from 'react-chartjs-2'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function NamespaceDetails({namespace}){
  const [resources, setResources] = useState(null)
  const [quotas, setQuotas] = useState(null)
  const [events, setEvents] = useState([])
  const [pods, setPods] = useState([])
  const [selectedPod, setSelectedPod] = useState(null)
  const [logs, setLogs] = useState('')

  useEffect(()=>{
    if(!namespace) return
    fetch(`/api/namespaces/${namespace}/resources`).then(r=>r.json()).then(data=>{
      setResources(data)
      setPods(data.pods || [])
    }).catch(console.error)
    fetch(`/api/namespaces/${namespace}/quotas`).then(r=>r.json()).then(setQuotas).catch(console.error)
    fetch(`/api/namespaces/${namespace}/events`).then(r=>r.json()).then(setEvents).catch(console.error)
  },[namespace])

  const fetchLogs = (pod)=>{
    if(!pod) return
    setSelectedPod(pod)
    axios.get(`/api/namespaces/${namespace}/logs`, {params:{pod}}).then(r=>setLogs(r.data.logs)).catch(e=>setLogs('error fetching logs'))
  }

  return (
    <div>
      <h2>{namespace}</h2>
      <section>
        <h3>Resources</h3>
        {resources ? (
          <div className="resources">
            <div>
              <h4>Pods</h4>
              <ul>
                {resources.pods.map(p=> <li key={p.name}>{p.name} — {p.phase}</li>)}
              </ul>
            </div>
            <div>
              <h4>Deployments</h4>
              <ul>
                {resources.deployments.map(d=> <li key={d.name}>{d.name} — {d.available_replicas}/{d.replicas}</li>)}
              </ul>
            </div>
            <div>
              <h4>Services</h4>
              <ul>
                {resources.services.map(s=> <li key={s.name}>{s.name} — {s.type}</li>)}
              </ul>
            </div>
          </div>
        ) : <div>Loading resources...</div>}
      </section>

      <section>
        <h3>Resource Quotas</h3>
        {quotas && quotas.length>0 ? quotas.map(q=> (
          <div key={q.name} className="quota">
            <h4>{q.name}</h4>
            <QuotaChart hard={q.hard} used={q.used} />
          </div>
        )) : <div>No resource quotas found</div>}
      </section>

      <section>
        <h3>Events</h3>
        <ul className="events">
          {events.map((e,i)=> <li key={i}><strong>{e.type}</strong> {e.reason} — {e.message}</li>)}
        </ul>
      </section>

      <section>
        <h3>Logs</h3>
        <div className="logs-pane">
          <div className="pods-list">
            <h4>Pods</h4>
            <ul>
              {pods.map(p=> <li key={p.name}><button onClick={()=>fetchLogs(p.name)}>{p.name}</button></li>)}
            </ul>
          </div>
          <div className="logs-output">
            <h4>Pod Logs: {selectedPod || 'none'}</h4>
            <pre>{logs}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}

function QuotaChart({hard, used}){
  // Create arrays of metric names and values; numeric parsing best-effort
  const labels = Object.keys(hard)
  const hardVals = labels.map(k=>parseResource(hard[k]))
  const usedVals = labels.map(k=>parseResource(used[k] || '0'))

  const data = {
    labels,
    datasets: [
      {label: 'Hard', data: hardVals, backgroundColor: 'rgba(200,200,200,0.7)'},
      {label: 'Used', data: usedVals, backgroundColor: 'rgba(75,192,192,0.7)'}
    ]
  }

  return <div style={{maxWidth:600}}><Bar data={data} /></div>
}

function parseResource(val){
  if(!val) return 0
  try{
    if(typeof val === 'string'){
      if(val.endsWith('Ki')) return parseFloat(val.slice(0,-2)) / 1024
      if(val.endsWith('Mi')) return parseFloat(val.slice(0,-2))
      if(val.endsWith('Gi')) return parseFloat(val.slice(0,-2)) * 1024
      if(val.endsWith('m')) return parseFloat(val.slice(0,-1)) / 1000
      return parseFloat(val)
    }
    return Number(val) || 0
  }catch(e){
    return 0
  }
}
