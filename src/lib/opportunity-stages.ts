import type { RowDataPacket } from "mysql2";
import type { Stage } from "@/features/opportunities/types";
import { db } from "./db";

const legacyStage: Partial<Record<Stage, string>> = {
  "L1 - Prospects": "L1 - Lead",
  "L2 - Opportunity": "L2 - Qualified",
};

/** Select a stage value supported by both current and older CRM databases. */
export async function databaseStageValue(stage: Stage): Promise<string> {
  const [columns] = await db.query<Array<{ COLUMN_TYPE: string } & RowDataPacket>>(
    "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='opportunities' AND COLUMN_NAME='stage' LIMIT 1",
  );
  const columnType = columns[0]?.COLUMN_TYPE || "";
  if (!columnType.toLowerCase().startsWith("enum(")) return stage;

  const supported = [...columnType.matchAll(/'((?:[^'\\]|\\.)*)'/g)]
    .map((match) => match[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\"));
  if (supported.includes(stage)) return stage;

  const fallback = legacyStage[stage];
  if (fallback && supported.includes(fallback)) return fallback;

  throw new Error(`The database does not support the opportunity stage “${stage}”. Run database/opportunity-stage-renames.sql and restart the app.`);
}
