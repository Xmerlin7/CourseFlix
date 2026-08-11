export interface AvatarPreset {
  id: string
  label: string
  url: string
}

// Served from apps/web/public/avatars — Vite serves everything under
// public/ at the site root, unbuilt. The backend's UpdateProfileDto
// validates avatarUrl with class-validator's @IsUrl(), which requires a
// real absolute URL (a data: URI fails that check), so presets are
// resolved to an absolute URL against the current origin rather than
// stored as bare paths.
const AVATAR_FILENAMES = [
  'avatar-1.svg',
  'avatar-2.svg',
  'avatar-3.svg',
  'avatar-4.svg',
  'avatar-5.svg',
  'avatar-6.svg',
  'avatar-7.svg',
  'avatar-8.svg',
]

export function getAvatarPresets(): AvatarPreset[] {
  return AVATAR_FILENAMES.map((filename, index) => ({
    id: filename,
    label: `صورة رمزية ${index + 1}`,
    url: new URL(`/avatars/${filename}`, window.location.origin).toString(),
  }))
}
