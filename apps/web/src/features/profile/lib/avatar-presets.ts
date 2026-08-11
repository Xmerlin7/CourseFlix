export interface AvatarPreset {
  id: string
  label: string
  url: string
}

// DiceBear's "miniavs" style (https://www.dicebear.com/styles/miniavs/),
// MIT-licensed and served from their public API — no local asset or seed
// list to maintain, and it's already a real absolute URL, which is what
// the backend's UpdateProfileDto requires (@IsUrl() rejects a data: URI).
// Each seed deterministically maps to one fixed illustration, so the same
// preset always renders the same avatar for everyone.
const AVATAR_SEEDS = [
  'Aiden',
  'Aneka',
  'Bailey',
  'Caleb',
  'Destiny',
  'Eliza',
  'Felix',
  'Gracie',
]

export function getAvatarPresets(): AvatarPreset[] {
  return AVATAR_SEEDS.map((seed, index) => ({
    id: seed,
    label: `صورة رمزية ${index + 1}`,
    url: `https://api.dicebear.com/9.x/miniavs/svg?seed=${encodeURIComponent(seed)}`,
  }))
}
