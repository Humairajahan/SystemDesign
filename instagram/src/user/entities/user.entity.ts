import { Exclude } from 'class-transformer';
import { CustomBaseEntity } from 'src/common/entity/custom-base-entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class User extends CustomBaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 30,
    unique: true,
    nullable: false,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: false,
  })
  instaHandle: string;

  @Column({
    type: 'date',
    nullable: false,
  })
  DOB: Date;

  @Exclude()
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  avatarUrl: string;

  @Column({
    type: 'bool',
    nullable: false,
    default: false,
  })
  isVerified: boolean;
}
