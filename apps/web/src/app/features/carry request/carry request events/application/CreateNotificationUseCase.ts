import type { CarryRequestNotification } from "../domain/CarryRequestNotification";
import type { NotificationRepository } from "../domain/NotificationRepository";

export class GetNotificationUseCase {
  repo: NotificationRepository;
  constructor(repo: NotificationRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<CarryRequestNotification[]> {
    return await this.repo.fetchNotifications(userId);
  }

  async makeAllAsRead(userId: string): Promise<string> {
    return await this.repo.markAllAsRead(userId);
  }
}
