import { IsIn, IsObject, IsOptional } from 'class-validator';

export const SETTINGS_THEMES = ['light', 'dark', 'system'] as const;
export type SettingsTheme = (typeof SETTINGS_THEMES)[number];

export class UpdateSettingsDto {
  @IsOptional()
  @IsIn(SETTINGS_THEMES)
  theme?: SettingsTheme;

  // Partial map, e.g. { "hw_assigned": false } — merged onto the existing
  // preferences in UsersService.updateSettings, not replaced wholesale, so
  // one PATCH can't accidentally wipe out prior choices for other types.
  // Keys/values are validated against known NotificationType strings and
  // booleans in the service layer (class-validator can't express "record
  // of a specific key union to booleans" declaratively).
  @IsOptional()
  @IsObject()
  notificationPreferences?: Record<string, boolean>;
}
