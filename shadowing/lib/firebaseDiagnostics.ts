// Server-only diagnostics: never return raw messages, stacks, keys or SDK payloads.
export function firebaseDiagnostic(error: unknown) {
  const messages: string[] = [];
  const codes: string[] = [];
  const seen = new Set<object>();
  function visit(value: unknown, depth = 0) {
    if (!value || typeof value !== 'object' || depth > 4 || seen.has(value)) return;
    seen.add(value);
    const item = value as Record<string, unknown>;
    if (typeof item.message === 'string') messages.push(item.message);
    if (typeof item.details === 'string') messages.push(item.details);
    if (typeof item.code === 'string' || typeof item.code === 'number') codes.push(String(item.code));
    visit(item.cause, depth + 1);
    visit(item.errorInfo, depth + 1);
  }
  visit(error);
  const text = messages.join(' ').toLowerCase();
  let category = 'UNCLASSIFIED';
  if (/could not load the default credentials|default credentials were not found/.test(text)) category = 'ADC_NOT_AVAILABLE';
  else if (/invalid_grant|invalid jwt|jwt signature|account has been disabled|account not found/.test(text)) category = 'CREDENTIAL_REJECTED';
  else if (/private key|pem|decoder routines/.test(text)) category = 'PRIVATE_KEY_FORMAT';
  else if (/has not been used|service_disabled|api.*disabled/.test(text)) category = 'API_DISABLED';
  else if (codes.includes('7') || /permission.denied|insufficient permissions/.test(text)) category = 'PERMISSION_DENIED';
  else if (codes.includes('16') || /unauthenticated/.test(text)) category = 'UNAUTHENTICATED';
  else if (codes.includes('5') || /database.*does not exist/.test(text)) category = 'RESOURCE_NOT_FOUND';
  else if (codes.some(code => ['4', '14', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'].includes(code)) || /deadline exceeded|fetch failed/.test(text)) category = 'NETWORK_OR_TIMEOUT';
  // An allowlist prevents arbitrary secret-bearing error.code strings being logged.
  const allowed = /^(?:[0-9]|1[0-6]|ENOTFOUND|ETIMEDOUT|ECONNRESET|app\/invalid-credential|app\/invalid-app-options|PERMISSION_DENIED|UNAUTHENTICATED|UNAVAILABLE|DEADLINE_EXCEEDED)$/;
  const code = codes.find(value => allowed.test(value)) || 'unknown';
  return { code, category };
}

export function firebaseCredentialPresence() {
  return {
    projectIdPresent: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
    clientEmailPresent: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
    privateKeyPresent: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    adcPathPresent: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  };
}