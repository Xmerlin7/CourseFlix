type AnalyticsEvent = Record<string, string | number | boolean | null>

export function pushDataLayerEvent(event: AnalyticsEvent) {
  void event
  // TODO: add privacy-safe dataLayer helper and PII denylist before sending events.
}
