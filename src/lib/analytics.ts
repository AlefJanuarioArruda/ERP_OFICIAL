export const trackEvent = (name: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: name,
      ...params
    });
  }
};
