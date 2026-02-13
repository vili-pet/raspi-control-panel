import { exec } from "child_process";
import { promisify } from "util";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { commandHistory } from "../drizzle/schema";
import { desc } from "drizzle-orm";

const execAsync = promisify(exec);

export const terminalRouter = router({
  execute: publicProcedure
    .input(
      z.object({
        command: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { stdout, stderr } = await execAsync(input.command, {
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 10,
        });

        const output = stdout + (stderr ? `\n${stderr}` : "");

        const db = await getDb();
        if (db) {
          try {
            await db.insert(commandHistory).values({
              userId: ctx.user?.id ?? 0,
              command: input.command,
              output,
              exitCode: 0,
            });
          } catch (dbError) {
            console.error("Failed to save command history:", dbError);
          }
        }

        return {
          success: true,
          output,
          exitCode: 0,
        };
      } catch (error: any) {
        const output = error.stdout + (error.stderr ? `\n${error.stderr}` : "");
        const exitCode = error.code || 1;

        const db = await getDb();
        if (db) {
          try {
            await db.insert(commandHistory).values({
              userId: ctx.user?.id ?? 0,
              command: input.command,
              output: output || error.message,
              exitCode,
            });
          } catch (dbError) {
            console.error("Failed to save command history:", dbError);
          }
        }

        return {
          success: false,
          output: output || error.message,
          exitCode,
        };
      }
    }),

  getHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        return { history: [] };
      }

      try {
        const history = await db
          .select()
          .from(commandHistory)
          .orderBy(desc(commandHistory.executedAt))
          .limit(input.limit);

        return { history };
      } catch (error) {
        console.error("Failed to get command history:", error);
        return { history: [] };
      }
    }),
});
