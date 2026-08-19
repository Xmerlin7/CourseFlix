import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  HANDOUT_DETAIL_LEVELS,
  HANDOUT_PAGE_RANGE,
  QUIZ_DIFFICULTIES,
  QUIZ_DUE_DAYS_RANGE,
  QUIZ_QUESTION_RANGE,
  type HandoutDetailLevel,
  type QuizDifficulty,
} from '../lesson-agents.constants';

/**
 * Every field optional — the settings form PATCHes only what changed,
 * and the service merges onto whatever the teacher already had (or onto
 * the code defaults, for a teacher with no row yet).
 *
 * There is intentionally no way to disable `transcript`, `reviewer` or
 * `indexer`: those three are what make a lesson answerable by the
 * student assistant, which the pipeline always guarantees.
 */
export class UpdateAgentSettingsDto {
  @IsOptional() @IsBoolean() handoutEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(HANDOUT_PAGE_RANGE.min)
  @Max(HANDOUT_PAGE_RANGE.max)
  handoutPageCount?: number;

  @IsOptional()
  @IsIn(HANDOUT_DETAIL_LEVELS)
  handoutDetailLevel?: HandoutDetailLevel;

  @IsOptional() @IsBoolean() handoutIncludeExamples?: boolean;
  @IsOptional() @IsBoolean() handoutIncludeKeyTerms?: boolean;
  @IsOptional() @IsBoolean() handoutIncludeSummary?: boolean;

  @IsOptional() @IsBoolean() quizEnabled?: boolean;
  @IsOptional() @IsIn(QUIZ_DIFFICULTIES) quizDifficulty?: QuizDifficulty;

  // Counted per type rather than as one total the quizmaster splits, so
  // the teacher gets the breakdown they asked for. Either may be 0; the
  // service rejects the combination that leaves the quiz empty, which
  // class-validator can't express across two fields.
  @IsOptional()
  @IsInt()
  @Min(QUIZ_QUESTION_RANGE.min)
  @Max(QUIZ_QUESTION_RANGE.max)
  quizMcqCount?: number;

  @IsOptional()
  @IsInt()
  @Min(QUIZ_QUESTION_RANGE.min)
  @Max(QUIZ_QUESTION_RANGE.max)
  quizTrueFalseCount?: number;

  @IsOptional()
  @IsInt()
  @Min(QUIZ_DUE_DAYS_RANGE.min)
  @Max(QUIZ_DUE_DAYS_RANGE.max)
  quizDueInDays?: number;
}
