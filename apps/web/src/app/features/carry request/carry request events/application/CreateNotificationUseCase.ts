import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { CarryRequestNotification } from "../domain/CarryRequestNotification";
import type { NotificationRepository } from "../domain/NotificationRepository";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class GetNotificationUseCase {
  repo: NotificationRepository;
  constructor(repo: NotificationRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<CarryRequestNotification[]>> {
    const data = await this.repo.fetchNotifications(userId);
    return toResult(data);
  }

  async makeAllAsRead(userId: string): Promise<Result<string>> {
    const result = await this.repo.markAllAsRead(userId);
    return toResult(result);
  }
}
