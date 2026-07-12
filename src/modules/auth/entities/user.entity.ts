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
export class User {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'f8b07384-d113-49c5-a559-6d6f46e0401a',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Unique email address of the user',
    example: 'admin@example.com',
  })
  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Hidden by default from queries for security
  password: string;

  @Column({ nullable: true, select: false }) // Hidden by default from queries
  currentRefreshTokenHash?: string;

  @ApiProperty({ description: 'Timestamp when the user account was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the user account was last updated',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    description: 'Timestamp when the user account was soft-deleted',
  })
  @DeleteDateColumn()
  deletedAt: Date;
}
