/**
 * Marker for typed BullMQ jobs. `name` is the processor key (job name in the queue).
 * Colocate concrete job types under `<module>/worker/jobs/`.
 */
export interface BaseJob {
  name: string;
}
