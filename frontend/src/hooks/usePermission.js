import { useAuthStore } from "../stores/useAuthStore";

export function usePermission() {
  const permissions = useAuthStore((s) => s.user?.permissions || []);

  {
    /* 
    Usage:
    const { hasPermission } = usePermission();

    {hasPermission("product.create") && (
        <Button onClick={openCreateModal}>Create Product</Button>
    )}
    */
  }
  const hasPermission = (perm) => permissions.includes(perm);

  const hasAny = (permList) => permList.some((p) => permissions.includes(p));

  return { hasPermission, hasAny };
}
