import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'nvarchar', length: 100 })
  full_name: string;

  @Column({ type: 'nvarchar', length: 20 })
  phone: string;

  @Column({ type: 'nvarchar', length: 255 })
  address_line: string;

  @Column({ type: 'nvarchar', length: 100 })
  city: string;

  @Column({ type: 'bit', default: false })
  is_default: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
