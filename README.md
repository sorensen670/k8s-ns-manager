# Kubernetes Namespace Manager (FastAPI + React)

This project is a starter scaffold for a Kubernetes Namespace Manager: a FastAPI backend using the Kubernetes Python client and a Vite + React frontend.

## Local Development

Run backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend expects either in-cluster config or a local kubeconfig at `~/.kube/config`.

Run frontend (in a separate terminal):

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` with Vite's dev server. The Vite proxy config automatically forwards `/api/*` requests to the backend at `http://localhost:8000`.

## Docker Build

Build backend image:
```bash
cd backend
docker build -t k8s-manager-backend:latest .
```

Build frontend image:
```bash
cd frontend
docker build -t k8s-manager-frontend:latest .
```

## Kubernetes Deployment

Apply the manifest to deploy both services to a Kubernetes cluster:

```bash
kubectl apply -f k8s/manifest.yaml
```

This creates:
- Namespace: `k8s-manager`
- Backend deployment and ClusterIP service
- Frontend deployment and LoadBalancer service
- RBAC: ServiceAccount and ClusterRole for the backend to read K8s resources

To verify:
```bash
kubectl get pods -n k8s-manager
kubectl get svc -n k8s-manager
```

Access the frontend via the LoadBalancer IP (or port-forward for testing):
```bash
kubectl port-forward -n k8s-manager svc/k8s-manager-frontend 3000:80
```

Then visit `http://localhost:3000`.
