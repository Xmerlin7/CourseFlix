import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
  @IsUUID() id!: string;
  @IsInt() sortOrder!: number;
}

export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
