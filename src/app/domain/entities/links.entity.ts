import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum LinkStatus {
  Pending = 'pending',
  Started = 'started',
}

export enum LinkType {
  DIE = 'die',
  UNDEFINED = 'undefined',
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('links')
export class LinkEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ length: 255, name: 'link_name', nullable: true })
  linkName: string;

  @Column({ name: 'content', nullable: true })
  content: string;

  @Column({ length: 255, name: 'link_url' })
  linkUrl: string;

  @Column({ length: 255, nullable: true, name: 'post_id' })
  postId: string | null;

  @Column({ length: 255, nullable: true, name: 'post_id_v1' })
  postIdV1: string | null;

  @Column({ name: 'last_comment_time' })
  lastCommentTime: Date;

  @Column({ type: 'int', default: 0, name: 'delay_time' })
  delayTime: number;

  @Column({ default: 'pending' })
  status: LinkStatus;

  @Column()
  type: LinkType;

  @Column({ default: false })
  process: boolean;

  @Column({ default: false, name: 'is_deleted' })
  isDelete: boolean;

  @Column({ default: false, name: 'is_link_group' })
  isLinkGroup?: boolean;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;
}
