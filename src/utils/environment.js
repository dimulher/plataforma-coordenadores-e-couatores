
export const isPreviewEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  return hostname.includes('app-preview.com') || hostname.includes('preview') || hostname.includes('localhost') || hostname.includes('127.0.0.1');
};
