function toStringId(value) {
  if (!value) return undefined;

  if (typeof value === 'string') {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  if (value.id) {
    return value.id.toString();
  }

  return String(value);
}

export function formatReport(report) {
  const longitude = report.location?.coordinates?.[0] ?? 0;
  const latitude = report.location?.coordinates?.[1] ?? 0;

  return {
    id: report._id.toString(),
    description: report.description,
    latitude,
    longitude,
    timestamp: report.createdAt,
    severity: report.severity,
    status: report.status,
    reportedBy: toStringId(report.reportedBy),
    assignedTo: toStringId(report.assignedTo),
    assignedToHospital: toStringId(report.assignedToHospital),
    resolvedAt: report.resolvedAt,
    photo: report.photo || null,
  };
}
