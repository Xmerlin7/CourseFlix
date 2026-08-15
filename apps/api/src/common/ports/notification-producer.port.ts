import { Injectable, Logger } from '@nestjs/common';

/**
 * Sprint 2 day-1 contract (sprint2-plan.md §2.1) — frozen shape so
 * Elgendy's ingestion worker never needs to know how notifications are
 * stored. `NotificationsService` implements this directly (see
 * notifications.module.ts's `useExisting` binding), so no fake is bound
 * there; `NoopNotificationProducer` below is only for a caller module
 * that needs the port before `NotificationsModule` is in its graph.
 */
export const NOTIFICATION_PRODUCER_PORT = Symbol('NOTIFICATION_PRODUCER_PORT');

export interface NotifyInput {
  userId: string;
  // Kept as `string`, not the notifications module's `NotificationType`
  // union, to avoid a cross-module import cycle (same reasoning as
  // enrollment.entity.ts's plain-UUID FK columns).
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface NotificationProducerPort {
  notify(input: NotifyInput): Promise<void>;
  markEntityRead?(
    userId: string,
    relatedEntityType: string,
    relatedEntityId: string,
  ): Promise<number>;
  markEntitiesRead?(
    userId: string,
    relatedEntityType: string,
    relatedEntityIds: string[],
  ): Promise<number>;
}

@Injectable()
export class NoopNotificationProducer implements NotificationProducerPort {
  private readonly logger = new Logger(NoopNotificationProducer.name);

  notify(input: NotifyInput): Promise<void> {
    this.logger.log(`(noop) notify ${input.userId}: ${input.type}`);
    return Promise.resolve();
  }

  markEntityRead(
    _userId: string,
    _relatedEntityType: string,
    _relatedEntityId: string,
  ): Promise<number> {
    return Promise.resolve(0);
  }

  markEntitiesRead(
    _userId: string,
    _relatedEntityType: string,
    _relatedEntityIds: string[],
  ): Promise<number> {
    return Promise.resolve(0);
  }
}
