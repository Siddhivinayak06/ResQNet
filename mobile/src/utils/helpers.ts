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
    crime: '👮 Crime',
    hazmat: '☣️ Hazmat',
    rescue: '🚁 Rescue',
    other: '⚠️ Other',
  };
  return labels[type] || type.toUpperCase();
}

/**
 * Get a color for incident status.
 */
export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f59e0b',
    verified: '#3b82f6',
    assigned: '#8b5cf6',
    in_progress: '#ef4444',
    resolved: '#22c55e',
    closed: '#64748b',
    false_alarm: '#94a3b8',
  };
  return colors[status] || '#94a3b8';
}

/**
 * Get a color for incident severity.
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#eab308',
    low: '#3b82f6',
  };
  return colors[severity] || '#64748b';
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
