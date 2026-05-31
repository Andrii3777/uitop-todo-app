import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  text: string;

  @IsInt()
  categoryId: number;
}
