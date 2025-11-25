import { useAuthStore } from "../stores/useAuthStore";

{
  /* 
    Usage:
    const { hasPermission } = usePermission();

    {hasPermission("product.create") && (
        <Button onClick={openCreateModal}>Create Product</Button>
    )}
    */
}
export function usePermission() {
  const permissions = useAuthStore((s) => s.user?.permissions || []);
  const user = useAuthStore((s) => s.user);
  const hasPermission = (perm) => {
    if (!perm) return true;
    if (!user) return false;

    // Superadmin override
    if (user.roles?.includes("Superadmin")) return true;

    return permissions.includes(perm);
  };

  return { hasPermission };
}
