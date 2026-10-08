import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Whether public/images/how-it-works/05-lesson-room.png exists. The student
 * steps show it for "Derse gir" once someone adds it, and the lesson
 * dashboard shot until then.
 *
 * Server only (it reads the file system). Checked when the module loads, so
 * adding the file needs a redeploy.
 */
export const LESSON_ROOM_SHOT_EXISTS = existsSync(
  path.join(process.cwd(), "public/images/how-it-works/05-lesson-room.png"),
);
