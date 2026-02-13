import { exec } from "child_process";
import { promisify } from "util";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

const execAsync = promisify(exec);

export const n8nRouter = router({
  getStatus: publicProcedure.query(async () => {
    try {
      const { stdout } = await execAsync("pgrep -f n8n");
      const isRunning = stdout.trim().length > 0;

      let port = "5678";
      try {
        const { stdout: netstat } = await execAsync(
          "netstat -tuln | grep :5678 || echo ''"
        );
        if (netstat.trim()) {
          port = "5678";
        }
      } catch {
        // ignore
      }

      return {
        isRunning,
        port,
        url: isRunning ? `http://localhost:${port}` : null,
      };
    } catch (error) {
      return {
        isRunning: false,
        port: "5678",
        url: null,
      };
    }
  }),

  start: publicProcedure.mutation(async () => {
    try {
      await execAsync("nohup n8n start > /tmp/n8n.log 2>&1 &");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        success: true,
        message: "n8n started successfully",
      };
    } catch (error: any) {
      throw new Error(`Failed to start n8n: ${error.message}`);
    }
  }),

  stop: publicProcedure.mutation(async () => {
    try {
      await execAsync("pkill -f n8n");
      return {
        success: true,
        message: "n8n stopped successfully",
      };
    } catch (error: any) {
      throw new Error(`Failed to stop n8n: ${error.message}`);
    }
  }),

  restart: publicProcedure.mutation(async () => {
    try {
      await execAsync("pkill -f n8n");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await execAsync("nohup n8n start > /tmp/n8n.log 2>&1 &");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        success: true,
        message: "n8n restarted successfully",
      };
    } catch (error: any) {
      throw new Error(`Failed to restart n8n: ${error.message}`);
    }
  }),

  getLogs: publicProcedure
    .input(
      z.object({
        lines: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const { stdout } = await execAsync(`tail -n ${input.lines} /tmp/n8n.log`);
        return { logs: stdout };
      } catch (error) {
        return { logs: "No logs available" };
      }
    }),
});
