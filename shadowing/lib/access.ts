export function getAccess(metadata: Record<string, unknown>) {
  const admin = metadata.role === 'admin';
  const support = metadata.role === 'support';
  const staff = admin || support;
  return { admin, support, staff, approved: staff || metadata.approvalStatus === 'approved' };
}

export function isPublicPath(path: string) {
  return path === '/' || /^\/sign-(in|up)(\/|$)/.test(path);
}

export function isAdminPath(path: string) {
  return /^\/(admin(?:\/|$)|api\/admin(?:\/|$)|add-audio-sample|addaudiosample|AddAudioSample|AddReadAloud|AddRepeatSentence|AudioSampleList|EditAudioSamplePage|EditReadAloudList|EditRepeatSentenceList|essays-admin|manage-questions|sentence(?:\/|$)|scraper|api\/(scrape|test-puppeteer|hello)(?:\/|$))/.test(path);
}