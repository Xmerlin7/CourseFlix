// Mirrors apps/web/package.json's "version" field — there's no build-time
// wiring (no resolveJsonModule/define) exposing it to the client yet, so
// this is kept as the one place to bump alongside a package.json version
// change rather than importing package.json into the bundle.
export const APP_VERSION = '0.0.0'
