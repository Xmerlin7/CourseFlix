import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import {
  HANDOUT_PAGE_RANGE,
  HANDOUT_TONES,
  QUIZ_DIFFICULTIES,
  QUIZ_DUE_DAYS_RANGE,
  QUIZ_QUESTION_RANGE,
  QUIZ_QUESTION_TYPES,
  type HandoutTone,
  type QuizDifficulty,
  type QuizQuestionType,
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

  @IsOptional() @IsIn(HANDOUT_TONES) handoutTone?: HandoutTone;
  @IsOptional() @IsBoolean() handoutIncludeExamples?: boolean;
  @IsOptional() @IsBoolean() handoutIncludeKeyTerms?: boolean;
  @IsOptional() @IsBoolean() handoutIncludeSummary?: boolean;

  @IsOptional() @IsBoolean() quizEnabled?: boolean;
  @IsOptional() @IsIn(QUIZ_DIFFICULTIES) quizDifficulty?: QuizDifficulty;

  @IsOptional()
  @IsInt()
  @Min(QUIZ_QUESTION_RANGE.min)
  @Max(QUIZ_QUESTION_RANGE.max)
  quizQuestionCount?: number;

  // At least one type, no duplicates — a quiz with an empty type list
  // would send the quizmaster a prompt it cannot satisfy.
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(QUIZ_QUESTION_TYPES, { each: true })
  quizTypes?: QuizQuestionType[];

  @IsOptional()
  @IsInt()
  @Min(QUIZ_DUE_DAYS_RANGE.min)
  @Max(QUIZ_DUE_DAYS_RANGE.max)
  quizDueInDays?: number;
}
