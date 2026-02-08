import type { CarryRequestNotification } from "../domain/Notification";
import type { NotificationRepository } from "../domain/NotificationRepository";

export class CreateNotificationUseCase {
  repo: NotificationRepository;
  constructor(repo: NotificationRepository) {
    this.repo = repo;
  }

  execute(notification: CarryRequestNotification): Promise<void> {
    return this.repo.createNotification(notification);
  }
}
