import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  lastName: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ type: 'enum', enum: ['M', 'F', 'other'], nullable: true })
  gender: string;

  @Column({ type: 'bigint', nullable: true })
  ci: number;

  @Column({ length: 255, unique: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  codPhone: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirthday: Date;

  @Column({ length: 255, nullable: true })
  profileImage: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ type: 'enum', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  entityStatus: string;
}
