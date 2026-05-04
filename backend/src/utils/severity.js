const highSeverityKeywords = [
  'fire',
  'explosion',
  'crash',
  'accident',
  'critical',
  'severe',
  'danger',
  'heart attack',
  'unconscious',
];

const mediumSeverityKeywords = [
  'injury',
  'injured',
  'bleeding',
  'fracture',
  'burn',
  'burns',
  'collapse',
  'fall',
];

export function detectSeverity(description = '') {
  const normalizedDescription = description.toLowerCase();

  if (highSeverityKeywords.some((keyword) => normalizedDescription.includes(keyword))) {
    return 'high';
  }

  if (mediumSeverityKeywords.some((keyword) => normalizedDescription.includes(keyword))) {
    return 'medium';
  }

  return 'low';
}
