import type { Job } from "bullmq";

import type { BaseJob } from "@/modules/background-job/base-job";

export abstract class BaseProcessor<T extends BaseJob = BaseJob> {
  public abstract readonly name: string;
  public abstract handle(job: Job<Omit<T, "name">>): Promise<unknown>;
}
