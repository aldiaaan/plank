import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function pidsOnPort(port: number): Promise<number[]> {
  if (process.platform === "win32") {
    const { stdout } = await execFileAsync("netstat", ["-ano"], {
      windowsHide: true,
    });
    const pids = new Set<number>();
    for (const line of stdout.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const local = parts[1] ?? "";
      const pid = Number(parts[parts.length - 1]);
      if (
        (local.endsWith(`:${port}`) || local.endsWith(`]:${port}`)) &&
        Number.isInteger(pid) &&
        pid > 0
      ) {
        pids.add(pid);
      }
    }
    return [...pids];
  }

  try {
    const { stdout } = await execFileAsync("lsof", [
      "-ti",
      `TCP:${port}`,
      "-sTCP:LISTEN",
    ]);
    return stdout
      .split(/\s+/)
      .map(Number)
      .filter((pid) => Number.isInteger(pid) && pid > 0);
  } catch {
    return [];
  }
}

export async function killPort(port: number): Promise<void> {
  const pids = (await pidsOnPort(port)).filter((pid) => pid !== process.pid);
  if (pids.length === 0) return;

  await Promise.all(
    pids.map(async (pid) => {
      try {
        if (process.platform === "win32") {
          await execFileAsync("taskkill", ["/PID", String(pid), "/F"], {
            windowsHide: true,
          });
        } else {
          process.kill(pid, "SIGKILL");
        }
        console.log(`Freed port ${port} (killed PID ${pid})`);
      } catch {
        // Process may have already exited
      }
    }),
  );
}
