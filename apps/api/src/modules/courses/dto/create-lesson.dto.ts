import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateLessonDto {
  @IsString() @Length(1, 200) title!: string;

  @IsOptional() @IsString() @MaxLength(5000) videoUrl?: string | null;

  /**
   * Set when the teacher chose the multi-agent path for this lesson.
   *
   * It only suppresses the plain caption-ingestion job that a new video
   * normally fires: the agent pipeline transcribes and indexes the same
   * video itself, and two jobs writing chunks for one transcript would
   * race over which version ends up active.
   *
   * Starting the run is a separate call
   * (`POST teacher/lessons/:id/agent-runs`) — CoursesService does not
   * reach into LessonAgentsService, which would make the two modules
   * mutually dependent.
   */
  @IsOptional() @IsBoolean() useAgents?: boolean;
}
