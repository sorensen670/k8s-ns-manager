from typing import Dict, Any, List
from kubernetes import client, config
from kubernetes.client import ApiException


class K8sClient:
    def __init__(self):
        # Try in-cluster, fallback to kubeconfig
        try:
            config.load_incluster_config()
        except Exception:
            config.load_kube_config()

        self.core = client.CoreV1Api()
        self.apps = client.AppsV1Api()
        self.rbac = client.RbacAuthorizationV1Api()

    def list_namespaces(self) -> List[Dict[str, Any]]:
        ns_list = self.core.list_namespace().items
        out = []
        for ns in ns_list:
            out.append({
                "name": ns.metadata.name,
                "status": ns.status.phase,
                "labels": ns.metadata.labels or {},
            })
        return out

    def list_resources(self, namespace: str) -> Dict[str, Any]:
        result = {"pods": [], "deployments": [], "services": []}
        try:
            pods = self.core.list_namespaced_pod(namespace=namespace).items
            for p in pods:
                result["pods"].append({
                    "name": p.metadata.name,
                    "phase": p.status.phase,
                    "node": p.spec.node_name,
                    "containers": [c.name for c in p.spec.containers],
                })

            deps = self.apps.list_namespaced_deployment(namespace=namespace).items
            for d in deps:
                result["deployments"].append({
                    "name": d.metadata.name,
                    "replicas": d.spec.replicas,
                    "available_replicas": d.status.available_replicas or 0,
                })

            svcs = self.core.list_namespaced_service(namespace=namespace).items
            for s in svcs:
                result["services"].append({
                    "name": s.metadata.name,
                    "type": s.spec.type,
                    "cluster_ip": s.spec.cluster_ip,
                })
        except ApiException as e:
            raise

        return result

    def get_pod_logs(self, namespace: str, pod_name: str, container: str = None, tail_lines: int = 200) -> str:
        try:
            return self.core.read_namespaced_pod_log(name=pod_name, namespace=namespace, container=container, tail_lines=tail_lines)
        except ApiException as e:
            return f"error: {e}"

    def list_events(self, namespace: str) -> List[Dict[str, Any]]:
        ev = self.core.list_namespaced_event(namespace=namespace).items
        out = []
        for e in ev:
            out.append({
                "message": e.message,
                "reason": e.reason,
                "type": e.type,
                "firstTimestamp": str(e.first_timestamp),
                "lastTimestamp": str(e.last_timestamp),
            })
        return out

    def get_resource_quotas(self, namespace: str) -> List[Dict[str, Any]]:
        rq_list = client.CoreV1Api().list_namespaced_resource_quota(namespace=namespace).items
        out = []
        for rq in rq_list:
            status = rq.status
            hard = status.hard or {}
            used = status.used or {}
            out.append({
                "name": rq.metadata.name,
                "hard": hard,
                "used": used,
            })
        return out


_client = None


def get_client() -> K8sClient:
    global _client
    if _client is None:
        _client = K8sClient()
    return _client
