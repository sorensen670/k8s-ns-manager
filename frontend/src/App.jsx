import React, {useState, useEffect} from 'react'
import NamespaceList from './components/NamespaceList'
import NamespaceDetails from './components/NamespaceDetails'
import './styles.css'

export default function App(){
  const [namespaces, setNamespaces] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(()=>{
    fetch('/api/namespaces').then(r=>r.json()).then(setNamespaces).catch(console.error)
  },[])

  return (
    <div className="app">
      <header><h1>Kubernetes Namespace Manager v1.0.1</h1></header>
      <div className="layout">
        <aside>
          <NamespaceList namespaces={namespaces} onSelect={setSelected} selected={selected} />
        </aside>
        <main>
          {selected ? <NamespaceDetails namespace={selected} /> : <div>Select a namespace</div>}
        </main>
      </div>
    </div>
  )
}
