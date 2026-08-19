import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Same shape and cap as `ExamGenerationFeedbackDto` — one teacher note. */
export class StepFeedbackDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) message!: string;
}
