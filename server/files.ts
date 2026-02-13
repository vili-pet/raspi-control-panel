import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { TRPCError } from "@trpc/server";

const HOME_DIR = process.env.HOME || "/home/pi";
const ALLOWED_BASE = HOME_DIR;

function sanitizePath(userPath: string): string {
  const resolved = path.resolve(ALLOWED_BASE, userPath);
  if (!resolved.startsWith(ALLOWED_BASE)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied: path outside allowed directory",
    });
  }
  return resolved;
}

export const filesRouter = router({
  browse: publicProcedure
    .input(
      z.object({
        path: z.string().default(""),
      })
    )
    .query(async ({ input }) => {
      try {
        const targetPath = sanitizePath(input.path);
        const entries = await fs.readdir(targetPath, { withFileTypes: true });

        const items = await Promise.all(
          entries.map(async (entry) => {
            const fullPath = path.join(targetPath, entry.name);
            const stats = await fs.stat(fullPath);
            const relativePath = path.relative(ALLOWED_BASE, fullPath);

            return {
              name: entry.name,
              path: relativePath,
              isDirectory: entry.isDirectory(),
              size: stats.size,
              modified: stats.mtime.toISOString(),
              permissions: stats.mode.toString(8).slice(-3),
            };
          })
        );

        const currentPath = path.relative(ALLOWED_BASE, targetPath);

        return {
          currentPath: currentPath || ".",
          items: items.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
          }),
        };
      } catch (error) {
        console.error("Error browsing files:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to browse directory",
        });
      }
    }),

  delete: publicProcedure
    .input(
      z.object({
        path: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const targetPath = sanitizePath(input.path);
        const stats = await fs.stat(targetPath);

        if (stats.isDirectory()) {
          await fs.rm(targetPath, { recursive: true, force: true });
        } else {
          await fs.unlink(targetPath);
        }

        return { success: true, message: `Deleted ${input.path}` };
      } catch (error) {
        console.error("Error deleting file:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete file or directory",
        });
      }
    }),

  createFolder: publicProcedure
    .input(
      z.object({
        path: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const parentPath = sanitizePath(input.path);
        const newFolderPath = path.join(parentPath, input.name);
        await fs.mkdir(newFolderPath, { recursive: false });

        return { success: true, message: `Created folder ${input.name}` };
      } catch (error) {
        console.error("Error creating folder:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create folder",
        });
      }
    }),

  readFile: publicProcedure
    .input(
      z.object({
        path: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const targetPath = sanitizePath(input.path);
        const content = await fs.readFile(targetPath, "utf-8");
        return { content };
      } catch (error) {
        console.error("Error reading file:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to read file",
        });
      }
    }),

  writeFile: publicProcedure
    .input(
      z.object({
        path: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const targetPath = sanitizePath(input.path);
        await fs.writeFile(targetPath, input.content, "utf-8");
        return { success: true, message: `File saved` };
      } catch (error) {
        console.error("Error writing file:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to write file",
        });
      }
    }),
});
