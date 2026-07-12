import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Service {
  @ApiProperty({
    description: 'Unique identifier of the service',
    example: 'd3b07384-d113-49c5-a559-6d6f46e0401d',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Title of the service',
    example: 'Gentlemens Haircut',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the service',
    example: 'Precision cut, wash, and style',
  })
  @Column('text')
  description: string;

  @ApiProperty({
    description: 'Duration of the service in minutes',
    example: 45,
  })
  @Column()
  duration: number;

  @ApiProperty({ description: 'Price of the service', example: 35.0 })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    description: 'Indicates if the service is currently available for bookings',
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Timestamp when the service was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the service was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Timestamp when the service was soft-deleted' })
  @DeleteDateColumn()
  deletedAt: Date;

  @ApiProperty({
    description: 'User identifier who created this service',
    required: false,
  })
  @Column({ nullable: true })
  createdBy: string;

  @ApiProperty({
    description: 'User identifier who last updated this service',
    required: false,
  })
  @Column({ nullable: true })
  updatedBy: string;
}
