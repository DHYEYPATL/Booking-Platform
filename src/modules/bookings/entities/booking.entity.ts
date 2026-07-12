import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Service } from '../../services/entities/service.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Booking {
  @ApiProperty({
    description: 'Unique identifier of the booking',
    example: 'e3b07384-d113-49c5-a559-6d6f46e0401b',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the customer', example: 'Jane Doe' })
  @Column()
  customerName: string;

  @ApiProperty({
    description: 'Email address of the customer',
    example: 'jane.doe@example.com',
  })
  @Column()
  customerEmail: string;

  @ApiProperty({
    description: 'Phone number of the customer',
    example: '555-0199',
  })
  @Column()
  customerPhone: string;

  @ApiProperty({
    description: 'ID of the booked service',
    example: 'd3b07384-d113-49c5-a559-6d6f46e0401d',
  })
  @Column()
  serviceId: string;

  @ApiProperty({
    description: 'Date of the booking (YYYY-MM-DD)',
    example: '2026-08-10',
  })
  @Column()
  bookingDate: string;

  @ApiProperty({ description: 'Time of the booking (HH:MM)', example: '14:30' })
  @Column()
  bookingTime: string;

  @ApiProperty({
    description: 'Status of the booking',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  @Column({
    type: 'simple-enum', // Use simple-enum for SQLite compatibility
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @ApiProperty({
    description: 'Optional customer notes',
    example: 'Please prepare the table beforehand.',
    required: false,
  })
  @Column('text', { nullable: true })
  notes?: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @ApiProperty({ description: 'Timestamp when the booking was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the booking was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Timestamp when the booking was soft-deleted' })
  @DeleteDateColumn()
  deletedAt: Date;

  @ApiProperty({
    description: 'User identifier who created this booking (null for public)',
    required: false,
  })
  @Column({ nullable: true })
  createdBy?: string;

  @ApiProperty({
    description: 'User identifier who last updated this booking status',
    required: false,
  })
  @Column({ nullable: true })
  updatedBy?: string;
}
