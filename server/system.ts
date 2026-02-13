import { exec } from "child_process";
import { promisify } from "util";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import os from "os";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export const systemRouter = router({
  getMetrics: publicProcedure.query(async () => {
    try {
      const cpuUsage = await getCPUUsage();
      const memoryInfo = getMemoryInfo();
      const temperature = await getTemperature();
      const diskSpace = await getDiskSpace();
      const uptime = os.uptime();

      return {
        cpu: cpuUsage,
        memory: memoryInfo,
        temperature,
        disk: diskSpace,
        uptime,
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
      };
    } catch (error) {
      console.error("Error getting system metrics:", error);
      throw new Error("Failed to get system metrics");
    }
  }),

  getNetworkInfo: publicProcedure.query(async () => {
    try {
      const interfaces = os.networkInterfaces();
      const networkInfo: Array<{
        name: string;
        address: string;
        netmask: string;
        family: string;
        mac: string;
        internal: boolean;
      }> = [];

      for (const [name, addrs] of Object.entries(interfaces)) {
        if (addrs) {
          for (const addr of addrs) {
            networkInfo.push({
              name,
              address: addr.address,
              netmask: addr.netmask,
              family: addr.family,
              mac: addr.mac,
              internal: addr.internal,
            });
          }
        }
      }

      let wifiStatus = null;
      try {
        const { stdout } = await execAsync("iwconfig 2>/dev/null || echo 'N/A'");
        wifiStatus = stdout;
      } catch {
        wifiStatus = "WiFi info not available";
      }

      return {
        interfaces: networkInfo,
        wifiStatus,
      };
    } catch (error) {
      console.error("Error getting network info:", error);
      throw new Error("Failed to get network info");
    }
  }),

  getProcesses: publicProcedure.query(async () => {
    try {
      const { stdout } = await execAsync(
        "ps aux --sort=-%cpu | head -20"
      );
      const lines = stdout.trim().split("\n");
      const headers = lines[0];
      const processes = lines.slice(1).map((line) => {
        const parts = line.trim().split(/\s+/);
        return {
          user: parts[0] || "",
          pid: parts[1] || "",
          cpu: parts[2] || "",
          mem: parts[3] || "",
          vsz: parts[4] || "",
          rss: parts[5] || "",
          tty: parts[6] || "",
          stat: parts[7] || "",
          start: parts[8] || "",
          time: parts[9] || "",
          command: parts.slice(10).join(" ") || "",
        };
      });

      return { processes };
    } catch (error) {
      console.error("Error getting processes:", error);
      throw new Error("Failed to get processes");
    }
  }),

  killProcess: publicProcedure
    .input(z.object({ pid: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await execAsync(`kill -9 ${input.pid}`);
        return { success: true, message: `Process ${input.pid} killed` };
      } catch (error) {
        console.error("Error killing process:", error);
        throw new Error(`Failed to kill process ${input.pid}`);
      }
    }),
});

async function getCPUUsage(): Promise<number> {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - (100 * idle) / total;

  return Math.round(usage * 10) / 10;
}

function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usagePercent = (used / total) * 100;

  return {
    total: Math.round(total / 1024 / 1024),
    used: Math.round(used / 1024 / 1024),
    free: Math.round(free / 1024 / 1024),
    usagePercent: Math.round(usagePercent * 10) / 10,
  };
}

async function getTemperature(): Promise<number | null> {
  try {
    const tempPath = "/sys/class/thermal/thermal_zone0/temp";
    const tempStr = await fs.readFile(tempPath, "utf-8");
    const temp = parseInt(tempStr.trim()) / 1000;
    return Math.round(temp * 10) / 10;
  } catch {
    return null;
  }
}

async function getDiskSpace() {
  try {
    const { stdout } = await execAsync("df -h / | tail -1");
    const parts = stdout.trim().split(/\s+/);
    return {
      filesystem: parts[0] || "",
      size: parts[1] || "",
      used: parts[2] || "",
      available: parts[3] || "",
      usePercent: parts[4] || "",
      mountPoint: parts[5] || "",
    };
  } catch (error) {
    console.error("Error getting disk space:", error);
    return {
      filesystem: "N/A",
      size: "N/A",
      used: "N/A",
      available: "N/A",
      usePercent: "N/A",
      mountPoint: "/",
    };
  }
}
