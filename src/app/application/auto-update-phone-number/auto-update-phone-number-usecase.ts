import { delay, extractPhoneNumber } from '@common/utils/helper';
import { CommentEntity } from '@domain/entities/comment.entity';
import { LinkEntity, LinkType } from '@domain/entities/links.entity';
import { RedisService } from '@infrastructure/redis/redis.service';
import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import * as dayjs from 'dayjs';
import { firstValueFrom } from 'rxjs';

export enum KEY_QUEUE {
    COMMENT = 'comment'
}
export enum KEY_HANDLE_QUEUE {
    ADD_COMMENT = 'add-comment',
}
const KEY_GET_COMMENT = 'share-link-tiktok:execute-comment'

export enum LoadResource {
  COOKIE = 'cookie-active',
  PROXY_CMT = 'proxy-cmt',
  PROXY_INFO = 'proxy-info',
  PROXY_PAGE = 'proxy-page',
  TOKEN = 'token-active',
  FB_NUMBER = 'fb-number-active',
}


@Injectable()
export class AutoUpdatePhoneNumberUseCase {
  linksPublic: LinkEntity[] = []
  isRunning = false

  constructor(
    private redisService: RedisService,
    private readonly httpService: HttpService,
    @InjectQueue(KEY_QUEUE.COMMENT) private queue: Queue
  ) {}

  async execute() {
    if (this.isRunning) return
    this.isRunning = true 

    try {
      const linksSchedule = await this.getLinkSchedule()
      console.log(1111, linksSchedule?.length)

      for (const element of linksSchedule) {
        const itemPublic = this.linksPublic.find(item => item.id === element.id)
        if (itemPublic) {
          itemPublic.delayTime = element.delayTime
        }
      }

      return Promise.all([this.handleStartMonitoring((linksSchedule || []), LinkType.PUBLIC)])      
    } catch (error) {
      console.log(error)
    } finally {
      this.isRunning = false
    }
  }

  handleStartMonitoring(links: LinkEntity[], type: LinkType) {
    let oldLinksRunning = []
    if (type === LinkType.PUBLIC) {
      oldLinksRunning = this.linksPublic
    }


    const oldIdsSet = new Set(oldLinksRunning.map(item => item.id));
    const linksRunning = links.filter(item => !oldIdsSet.has(item.id));

    if (type === LinkType.PUBLIC) {
      this.linksPublic = links
      return this.handlePostsPublic(linksRunning)
    }
  }

  async handlePostsPublic(linksRunning: LinkEntity[]) {
    const postHandle = linksRunning.map((link) => {
      return this.processLinkPublic(link)
    })

    return Promise.all([...postHandle])
  }

  async processLinkPublic(link: LinkEntity) {
    
    while (true) {
      console.log(link.linkUrl)
      const linkRuning = this.linksPublic.find(item => item.id === link.id)
      if (!linkRuning) { break };

      try {
        
          let dataComments = await this.calApi(linkRuning)

          const comments = dataComments.map(item => {
              const {
                userIdComment, 
                userNameComment,
                commentCreatedAt,
                commentId,
                commentMessage,
                phoneNumber
              } = item
            const entity: Partial<CommentEntity> = {
              message: commentMessage,
              userUid: userIdComment,
              linkId: link.id,
              username: userNameComment,
              cmtId: commentId,
              createdAt: commentCreatedAt as any,
              postId: link.postId,
              phoneNumber
            }
            return entity
          })

          await this.queue.addBulk(
            comments.map(c => ({
              name: KEY_HANDLE_QUEUE.ADD_COMMENT,
              data: c,
              opts: {
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3
              }
            }))
          )
      } catch (error) {
        console.log(`Crawl comment with postId ${link.postId} Error.`, error)
      } finally {
        await delay((linkRuning.delayTime) * 1000)
      }

    }
  }


  async calApi(link: LinkEntity) {
    const response = await firstValueFrom(
      this.httpService.get(`https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id=${link.postId}&count=1000&device_id=7550562218283191570`)
    )

    const comments = response.data.comments ?? []
    const cmts = [...comments]
    .sort((a, b) => b.create_time - a.create_time)
    .slice(0, 10).map((cmt) => {
      const res: any = {
        postId: link.postId,
        userIdComment: cmt.user.uid,
        userNameComment: cmt.user.unique_id,
        commentId: cmt.cid,
        phoneNumber: extractPhoneNumber(cmt.text),
        commentMessage: cmt.text,
        commentCreatedAt: dayjs(cmt?.create_time * 1000).utc().format('YYYY-MM-DD HH:mm:ss'),
      }
      
      return res
    })
    
    return cmts;
  }

  async getLinkSchedule() {
    try {
      const dataRedis = await this.redisService.get(KEY_GET_COMMENT)
      if (dataRedis) {
        const links = JSON.parse(dataRedis)
        return links
      }

      return []   
    } catch (error) {
      return []  
    }
  }
}
