import { exec } from "child_process";
import { promisify } from "util";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

const execAsync = promisify(exec);

export const servicesRouter = router({
  list: publicProcedure.query(async () => {
    try {
      const { stdout } = await execAsync(
        "systemctl list-units --type=service --all --no-pager --no-legend"
      );

      const services = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          const name = parts[0] || "";
          const load = parts[1] || "";
          const active = parts[2] || "";
          const sub = parts[3] || "";
          const description = parts.slice(4).join(" ") || "";

          return {
            name,
            load,
            active,
            sub,
            description,
          };
        })
        .filter((s) => s.name.endsWith(".service"))
        .slice(0, 50);

      return { services };
    } catch (error) {
      console.error("Error listing services:", error);
      throw new Error("Failed to list services");
    }
  }),

  getStatus: publicProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { stdout } = await execAsync(`systemctl status ${input.name}`);
        return { status: stdout };
      } catch (error: any) {
        return { status: error.stdout || error.message };
      }
    }),

  start: publicProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await execAsync(`sudo systemctl start ${input.name}`);
        return { success: true, message: `Started ${input.name}` };
      } catch (error: any) {
        throw new Error(`Failed to start service: ${error.message}`);
      }
    }),

  stop: publicProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await execAsync(`sudo systemctl stop ${input.name}`);
        return { success: true, message: `Stopped ${input.name}` };
      } catch (error: any) {
        throw new Error(`Failed to stop service: ${error.message}`);
      }
    }),

  restart: publicProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await execAsync(`sudo systemctl restart ${input.name}`);
        return { success: true, message: `Restarted ${input.name}` };
      } catch (error: any) {
        throw new Error(`Failed to restart service: ${error.message}`);
      }
    }),

  enable: publicProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await execAsync(`sudo systemctl enable ${input.name}`);
        return { success: true, message: `Enabled ${input.name}` };
      } catch (error: any) {
        throw new Error(`Failed to enable service: ${error.message}`);
      }
    }),

  disable: publicProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await execAsync(`sudo systemctl disable ${input.name}`);
        return { success: true, message: `Disabled ${input.name}` };
      } catch (error: any) {
        throw new Error(`Failed to disable service: ${error.message}`);
      }
    }),
});
