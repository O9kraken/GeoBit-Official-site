'use client'
const L: Record<string, [string, string]> = { admin: ['Администратор', 'won'], editor: ['Редактор', 'progress'], manager: ['Менеджер', 'new'] }
export function RoleCell({ cellData }: { cellData?: string }) {
  const [label, mod] = L[cellData || 'admin'] || L.admin
  return <span className={`gb-dash__st gb-dash__st--${mod}`}>{label}</span>
}
