import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { asValue } from "awilix";
import { Job, Worker } from "bullmq";
import Redis from "ioredis";

import { ServerModule } from "@/server/module";
import type { ModuleRegistrationContext } from "@/server/types";
import { modulesRootDir } from "@/server/utils/modules-root";
import type { BaseJob } from "@/modules/background-job/base-job";
import { BaseProcessor } from "@/modules/background-job/base-processor";
import { BaseQueue } from "@/modules/background-job/base-queue";
import {
  discoverProcessorFiles,
  discoverQueueFiles,
  importDefaultExport,
} from "@/modules/background-job/discover";

export type BackgroundJobModuleOptions = {
  redisUrl: string;
  /**
   * Mount Bull Board UI. Defaults to `true`.
   * Pass `{ prefix }` to override the path (default `/externals/bull-board`).
   */
  bullBoard?: boolean | { prefix?: string };
};

type QueueConstructor = new () => BaseQueue<BaseJob>;
type ProcessorConstructor = new () => BaseProcessor;

const DEFAULT_BULL_BOARD_PREFIX = "/externals/bull-board";

export class BackgroundJobModule extends ServerModule {
  name = "background-job";

  private redis: Redis | null = null;
  private workers: Worker[] = [];
  private shuttingDown = false;

  constructor(private readonly options: BackgroundJobModuleOptions) {
    super();
  }

  async register(context: ModuleRegistrationContext) {
    const redis = new Redis(this.options.redisUrl, {
      maxRetriesPerRequest: null,
    });
    this.redis = redis;

    BaseQueue.register(redis);

    context.container.register({
      redis: asValue(redis),
    });

    const modulesDir = modulesRootDir();
    const [queueFiles, processorFiles] = await Promise.all([
      discoverQueueFiles(modulesDir),
      discoverProcessorFiles(modulesDir),
    ]);

    context.app.log.info(
      {
        queues: queueFiles.length,
        processors: processorFiles.length,
      },
      "[BackgroundJob] Discovered worker files",
    );

    const queues = (
      await Promise.all(
        queueFiles.map(async (queueFile) => {
          const QueueClass =
            await importDefaultExport<QueueConstructor>(queueFile);
          if (!QueueClass) {
            context.app.log.warn(
              { queueFile },
              "[BackgroundJob] Queue file missing default export — skipping",
            );
            return null;
          }
          return new QueueClass();
        }),
      )
    ).filter((queue): queue is BaseQueue<BaseJob> => queue != null);

    const processors = (
      await Promise.all(
        processorFiles.map(async (processorFile) => {
          const ProcessorClass =
            await importDefaultExport<ProcessorConstructor>(processorFile);
          if (!ProcessorClass) {
            context.app.log.warn(
              { processorFile },
              "[BackgroundJob] Processor file missing default export — skipping",
            );
            return null;
          }
          return new ProcessorClass();
        }),
      )
    ).filter((processor): processor is BaseProcessor => processor != null);

    const processorsMap = new Map<string, BaseProcessor>(
      processors.map((processor) => [processor.name, processor]),
    );

    this.workers = queues.map((queue) => {
      const worker = new Worker(
        queue.name,
        async (job: Job) => {
          const processor = processorsMap.get(job.name);
          if (!processor) {
            throw new Error(`No processor registered for job: ${job.name}`);
          }
          return processor.handle(job);
        },
        {
          connection: redis.duplicate(),
        },
      );

      worker.on("failed", (job, error) => {
        context.app.log.error(
          {
            queue: queue.name,
            jobId: job?.id,
            jobName: job?.name,
            err: error,
          },
          "[BackgroundJob] Job failed",
        );
      });

      worker.on("error", (error) => {
        context.app.log.error(
          { queue: queue.name, err: error },
          "[BackgroundJob] Worker error",
        );
      });

      return worker;
    });

    const bullBoardOption = this.resolveBullBoardOption();
    if (bullBoardOption) {
      const serverAdapter = new FastifyAdapter();
      serverAdapter.setBasePath(bullBoardOption.prefix);

      createBullBoard({
        serverAdapter,
        queues: queues.map((queue) => new BullMQAdapter(queue.instance)),
      });

      await context.app.register(
        async (scoped) => {
          scoped.addHook("onRoute", (routeOptions) => {
            routeOptions.config = {
              ...routeOptions.config,
              allow: ["read:all"],
            };
          });
          await scoped.register(serverAdapter.registerPlugin());
        },
        { prefix: bullBoardOption.prefix },
      );

      context.app.log.info(
        { prefix: bullBoardOption.prefix, queues: queues.length },
        "[BackgroundJob] Bull Board mounted",
      );
    }

    context.app.addHook("onClose", async () => {
      await this.shutdown(context);
    });
  }

  private resolveBullBoardOption(): { prefix: string } | null {
    const option = this.options.bullBoard;
    if (option === false) return null;

    if (typeof option === "object") {
      return { prefix: option.prefix ?? DEFAULT_BULL_BOARD_PREFIX };
    }

    return { prefix: DEFAULT_BULL_BOARD_PREFIX };
  }

  private async shutdown(context: ModuleRegistrationContext) {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    context.app.log.info(
      "[BackgroundJob] Graceful shutdown — closing workers, queues, and Redis",
    );

    await Promise.all(
      this.workers.map(async (worker) => {
        try {
          await worker.close();
        } catch (error) {
          context.app.log.error(
            { err: error },
            "[BackgroundJob] Failed to close worker",
          );
        }
      }),
    );
    this.workers = [];

    try {
      await BaseQueue.closeAll();
    } catch (error) {
      context.app.log.error(
        { err: error },
        "[BackgroundJob] Failed to close queues",
      );
    }

    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        context.app.log.error(
          { err: error },
          "[BackgroundJob] Failed to quit Redis",
        );
        this.redis.disconnect();
      }
      this.redis = null;
    }
  }
}
