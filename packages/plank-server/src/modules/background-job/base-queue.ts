import { Queue } from "bullmq";
import type Redis from "ioredis";

import type { BaseJob } from "./base-job";

export abstract class BaseQueue<T extends BaseJob> {
  private static _globalRedis: Redis | null = null;
  private static readonly instances = new Map<string, Queue>();

  public instance: Queue<Omit<T, "name">>;
  public readonly name: string;

  static register(redis: Redis) {
    BaseQueue._globalRedis = redis;
  }

  static get redis(): Redis {
    if (!BaseQueue._globalRedis) {
      throw new Error(
        "Redis connection not found. BackgroundJobModule must register before queues are constructed.",
      );
    }
    return BaseQueue._globalRedis;
  }

  /** All queue instances created this process (for shutdown / Bull Board). */
  static getAll(): Queue[] {
    return [...BaseQueue.instances.values()];
  }

  static async closeAll(): Promise<void> {
    await Promise.all(
      [...BaseQueue.instances.values()].map((queue) => queue.close()),
    );
    BaseQueue.instances.clear();
  }

  constructor(name: string) {
    this.name = name;

    if (!BaseQueue._globalRedis) {
      throw new Error(
        `Redis connection not found. Please ensure BackgroundJobModule is registered before constructing ${this.constructor.name}.`,
      );
    }

    const existing = BaseQueue.instances.get(name);
    if (existing) {
      this.instance = existing as Queue<Omit<T, "name">>;
    } else {
      this.instance = new Queue<Omit<T, "name">>(name, {
        connection: BaseQueue._globalRedis,
      });
      BaseQueue.instances.set(name, this.instance);
    }
  }

  /**
   * Enqueue a job. Pass the full payload including `name` (processor key).
   * Prefer a union of job types on the queue: `BaseQueue<JobA | JobB>`.
   */
  public async dispatch<J extends T>(
    job: J,
    opts?: Parameters<Queue["add"]>[2],
  ) {
    const { name, ...data } = job;
    // BullMQ's ExtractDataType/ExtractNameType generics don't accept open T.
    return this.instance.add(name as never, data as never, opts);
  }
}
