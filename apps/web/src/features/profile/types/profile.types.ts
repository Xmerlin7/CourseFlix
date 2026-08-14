// Mirrors the backend's UpdateProfileDto (apps/api/src/modules/users/dto/update-profile.dto.ts)
// exactly. Gender/language are deliberately not modeled here: there's no
// column for either on UserEntity yet, so a form field for them would have
// nowhere real to save.
export interface UpdateProfilePayload {
  fullName?: string
  avatarUrl?: string | null
  whatsappNumber?: string | null
}
