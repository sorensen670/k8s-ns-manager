import React from 'react'

export default function NamespaceList({namespaces, onSelect, selected}){
  return (
    <div>
      <h2>Namespaces</h2>
      <ul className="ns-list">
        {namespaces.map(ns => (
          <li key={ns.name} className={selected===ns.name? 'selected': ''} onClick={()=>onSelect(ns.name)}>
            <div className="ns-name">{ns.name}</div>
            <div className="ns-status">{ns.status}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
