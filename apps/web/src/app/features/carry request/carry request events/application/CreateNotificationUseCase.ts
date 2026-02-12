import type { CarryRequestNotification } from "../domain/CarryRequestNotification";
import type { NotificationRepository } from "../domain/NotificationRepository";

export class GetNotificationUseCase {
  repo: NotificationRepository;
  constructor(repo: NotificationRepository) {
    this.repo = repo;
  }

  execute(userId: string): Promise<CarryRequestNotification[]> {
    return this.repo.fetchNotifications(userId);
  }
}
