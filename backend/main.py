import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from k8s_client import get_client

app = FastAPI(title="Kubernetes Namespace Manager API")

_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

kc = get_client()


@app.get("/api/namespaces")
def namespaces():
    return kc.list_namespaces()


@app.get("/api/namespaces/{namespace}/resources")
def namespace_resources(namespace: str):
    try:
        return kc.list_resources(namespace)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/namespaces/{namespace}/logs")
def namespace_logs(namespace: str, pod: str = Query(...), container: Optional[str] = None, tail: int = 200):
    res = kc.get_pod_logs(namespace=namespace, pod_name=pod, container=container, tail_lines=tail)
    return {"logs": res}


@app.get("/api/namespaces/{namespace}/events")
def namespace_events(namespace: str):
    try:
        return kc.list_events(namespace)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/namespaces/{namespace}/quotas")
def namespace_quotas(namespace: str):
    try:
        return kc.get_resource_quotas(namespace)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
