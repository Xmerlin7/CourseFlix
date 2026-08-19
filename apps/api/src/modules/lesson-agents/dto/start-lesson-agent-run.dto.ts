import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { UpdateAgentSettingsDto } from './update-agent-settings.dto';

/**
 * Starting a run normally needs no body at all — the teacher's saved
 * settings are the defaults, which is the whole point of having them.
 *
 * `overrides` exists for the one-off case: "this particular lesson is
 * short, skip the quiz". It is validated with the same DTO the settings
 * form uses, and is merged over the saved settings into the run's frozen
 * `config` without ever writing back to `teacher_agent_settings`.
 */
export class StartLessonAgentRunDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAgentSettingsDto)
  overrides?: UpdateAgentSettingsDto;
}
