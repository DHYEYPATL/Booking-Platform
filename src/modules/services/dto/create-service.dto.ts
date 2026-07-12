import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'The title of the service',
    example: 'Hair Cut & Styling',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the service',
    example: 'Includes washing, cutting, and blow drying.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @ApiProperty({ description: 'Duration in minutes', example: 45 })
  @IsInt({ message: 'Duration must be an integer' })
  @IsPositive({ message: 'Duration must be a positive integer' })
  duration!: number;

  @ApiProperty({ description: 'Price of the service', example: 45.5 })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price!: number;

  @ApiProperty({
    description: 'Status indicating if this service is active and bookable',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
