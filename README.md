# Kubernetes Namespace Manager

A demo application for browsing Kubernetes cluster namespaces, resources, events, quotas, and pod logs. Built with a **FastAPI** backend (Kubernetes Python client) and a **Vite + React** frontend.

Images are built and pushed to Docker Hub via GitHub Actions and deployed to a local Kind cluster with ArgoCD.

![Architecture: React ➜ Nginx ➜ FastAPI ➜ Kubernetes API](https://img.shields.io/badge/stack-React%20%7C%20FastAPI%20%7C%20K8s-blue)

## Features

- List all namespaces with status
- Browse pods, deployments, and services per namespace
- View resource quotas with bar charts (Chart.js)
- Stream pod logs
- Namespace events timeline

## Project Structure

```
.
├── backend/            # FastAPI API server
│   ├── main.py         # Routes: /api/namespaces, resources, logs, events, quotas
│   ├── k8s_client.py   # Kubernetes Python client wrapper
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/           # Vite + React SPA
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── NamespaceList.jsx
│   │       └── NamespaceDetails.jsx
│   ├── nginx.conf      # Production proxy (forwards /api/ to backend)
│   └── Dockerfile      # Multi-stage: npm build ➜ nginx
├── k8s/
│   └── manifest.yaml   # Namespace, Deployments, Services, RBAC
├── compose.yml         # Local Docker Compose stack
└── README.md
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Kubernetes (Kind) enabled
- `kubectl` configured to talk to your local cluster
- Node.js 18+ and Python 3.11+ (for local dev without Docker)

## Quick Start — Docker Compose

The fastest way to run the full stack locally against your Docker Desktop Kubernetes cluster:

```bash
docker compose up --build
```

This mounts your local kubeconfig read-only into the backend container. If your kubeconfig is not at `~/.kube/config`, set `KUBECONFIG_PATH` first:

```bash
export KUBECONFIG_PATH=/path/to/your/kubeconfig
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

## Local Development (without Docker)

**Backend:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend auto-detects in-cluster config or falls back to `~/.kube/config`.

**Frontend** (separate terminal):

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on http://localhost:5173 and proxies `/api/*` requests to the backend.

## Kubernetes Deployment (Kind + ArgoCD)

### Manual apply

```bash
kubectl apply -f k8s/manifest.yaml
```

This creates:
- `k8s-manager` namespace
- Backend Deployment + ClusterIP Service (port 8000)
- Frontend Deployment + LoadBalancer Service (port 80 ➜ 3000)
- ServiceAccount + ClusterRole/ClusterRoleBinding (read-only access to namespaces, pods, services, deployments, events, quotas, and pod logs)

### Port-forward to access locally

```bash
kubectl port-forward -n k8s-manager svc/k8s-manager-frontend 3000:80
```

Then visit http://localhost:3000.

### Verify

```bash
kubectl get pods -n k8s-manager
kubectl get svc -n k8s-manager
```

## CI/CD

### GitHub Actions

Images are built and pushed to Docker Hub on every push to `main`. The workflow tags images with the Git commit SHA:

```
docker.io/sorensen670/k8s-ns-manager-backend:<sha>
docker.io/sorensen670/k8s-ns-manager-frontend:<sha>
```

**Required repository secrets:**
| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

### ArgoCD

ArgoCD watches this repo and syncs `k8s/manifest.yaml` into the local Kind cluster. After a GitHub Actions build pushes new images, update the image tags in the manifest (or use an image updater) and ArgoCD will roll out the change.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/namespaces` | List all namespaces |
| `GET` | `/api/namespaces/{ns}/resources` | Pods, deployments, services in a namespace |
| `GET` | `/api/namespaces/{ns}/logs?pod=<name>` | Pod logs (optional `container`, `tail` params) |
| `GET` | `/api/namespaces/{ns}/events` | Namespace events |
| `GET` | `/api/namespaces/{ns}/quotas` | Resource quotas |

Interactive API docs available at `/docs` (Swagger UI) when the backend is running.

## License

MIT
