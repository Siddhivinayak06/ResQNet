/**
 * Format a date string for display.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get a human-readable label for an incident type.
 */
export function incidentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    accident: '🚗 Accident',
    fire: '🔥 Fire',
    medical: '🏥 Medical',
    disaster: '🌊 Disaster',
  };
  return labels[type] || type;
}

/**
 * Get a color for incident status.
 */
export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f59e0b',
    active: '#ef4444',
    resolved: '#22c55e',
  };
  return colors[status] || '#94a3b8';
}

/**
 * Extract a user-friendly error message from an Axios error.
 */
export function getErrorMessage(error: any): string {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors[0];
  }
  if (error?.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
