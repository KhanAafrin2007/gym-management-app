/**
 * Formats a number as Indian Rupee (Rs. 15,000)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs. 0';
  }
  return `Rs. ${Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into readable format (e.g., 15 Apr 2024)
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns color classes for payment and membership statuses
 */
export function getStatusBadgeClasses(status: string | null | undefined): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'active':
    case 'working':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'pending':
    case 'in progress':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'under repair':
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
    case 'failed':
    case 'expired':
    case 'cancelled':
    case 'retired':
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    case 'refunded':
      return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
    default:
      return 'bg-slate-700/40 text-slate-300 border border-slate-600/30';
  }
}
