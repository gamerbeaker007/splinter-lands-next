"use server";

import { prisma } from "@/lib/prisma";
import {
  CustomPlan,
  CustomPlanItem,
  MAX_CUSTOM_PLAN_NAME_LENGTH,
  MAX_CUSTOM_PLANS_PER_PLAYER,
} from "@/types/landManager";
import { getAuthStatus } from "../auth-actions";

function mapItem(item: {
  id: string;
  sequence: number;
  action_type: string;
  from_region_uid: string | null;
  to_region_uid: string | null;
  from_resource: string | null;
  to_resource: string | null;
  amount_type: string;
  amount: number;
}): CustomPlanItem {
  return {
    id: item.id,
    sequence: item.sequence,
    action_type: item.action_type as CustomPlanItem["action_type"],
    from_region_uid: item.from_region_uid,
    to_region_uid: item.to_region_uid,
    from_resource: item.from_resource,
    to_resource: item.to_resource,
    amount_type: item.amount_type as CustomPlanItem["amount_type"],
    amount: item.amount,
  };
}

function mapPlan(row: {
  id: string;
  player: string;
  name: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  items: Parameters<typeof mapItem>[0][];
}): CustomPlan {
  return {
    id: row.id,
    player: row.player,
    name: row.name,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: row.items
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map(mapItem),
  };
}

export async function getCustomPlans(): Promise<{
  plans: CustomPlan[];
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { plans: [], error: "Not authenticated" };
  }

  const rows = await prisma.landCustomPlan.findMany({
    where: { player: auth.username },
    include: { items: true },
    orderBy: { sort_order: "asc" },
  });

  return { plans: rows.map(mapPlan) };
}

/** Plan items are always rewritten as a whole, renumbered from the array order. */
function toItemCreateData(items: Omit<CustomPlanItem, "id">[]) {
  return items.map((item, idx) => ({
    sequence: idx,
    action_type: item.action_type,
    from_region_uid: item.from_region_uid,
    to_region_uid: item.to_region_uid,
    from_resource: item.from_resource,
    to_resource: item.to_resource,
    amount_type: item.amount_type,
    amount: item.amount,
  }));
}

export interface SaveCustomPlanInput {
  id?: string;
  name: string;
  items: Omit<CustomPlanItem, "id">[];
}

export async function saveCustomPlan(
  input: SaveCustomPlanInput
): Promise<{ plan?: CustomPlan; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { error: "Not authenticated" };
  }

  const trimmedName = input.name.trim();
  if (!trimmedName) return { error: "Plan name is required" };
  if (trimmedName.length > MAX_CUSTOM_PLAN_NAME_LENGTH) {
    return {
      error: `Plan name must be at most ${MAX_CUSTOM_PLAN_NAME_LENGTH} characters`,
    };
  }
  if (input.items.length === 0) {
    return { error: "Plan must contain at least one row" };
  }

  const player = auth.username;

  try {
    if (input.id) {
      // Update existing plan — verify ownership
      const existing = await prisma.landCustomPlan.findUnique({
        where: { id: input.id },
      });
      if (!existing || existing.player !== player) {
        return { error: "Plan not found" };
      }

      // Check name uniqueness (excluding itself)
      const nameConflict = await prisma.landCustomPlan.findFirst({
        where: { player, name: trimmedName, NOT: { id: input.id } },
      });
      if (nameConflict) {
        return { error: `A plan named "${trimmedName}" already exists` };
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.landCustomPlanItem.deleteMany({
          where: { plan_id: input.id },
        });
        const plan = await tx.landCustomPlan.update({
          where: { id: input.id },
          data: {
            name: trimmedName,
            items: { create: toItemCreateData(input.items) },
          },
          include: { items: true },
        });
        return plan;
      });

      return { plan: mapPlan(updated) };
    } else {
      // New plan — check per-player cap
      const count = await prisma.landCustomPlan.count({ where: { player } });
      if (count >= MAX_CUSTOM_PLANS_PER_PLAYER) {
        return {
          error: `You can have at most ${MAX_CUSTOM_PLANS_PER_PLAYER} saved plans`,
        };
      }

      // Check name uniqueness
      const nameConflict = await prisma.landCustomPlan.findFirst({
        where: { player, name: trimmedName },
      });
      if (nameConflict) {
        return { error: `A plan named "${trimmedName}" already exists` };
      }

      // Use current max sort_order + 1 so new plans appear last
      const maxOrder = await prisma.landCustomPlan.aggregate({
        where: { player },
        _max: { sort_order: true },
      });
      const nextOrder = (maxOrder._max.sort_order ?? -1) + 1;

      // A nested create is already atomic — no explicit transaction needed.
      const created = await prisma.landCustomPlan.create({
        data: {
          player,
          name: trimmedName,
          sort_order: nextOrder,
          items: { create: toItemCreateData(input.items) },
        },
        include: { items: true },
      });

      return { plan: mapPlan(created) };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    // Surface unique-constraint violations from the DB as a friendly message
    if (msg.includes("Unique constraint") && msg.includes("player_name")) {
      return { error: `A plan named "${trimmedName}" already exists` };
    }
    return { error: msg };
  }
}

export async function renameCustomPlan(
  id: string,
  newName: string
): Promise<{ error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { error: "Not authenticated" };
  }

  const trimmed = newName.trim();
  if (!trimmed) return { error: "Plan name is required" };
  if (trimmed.length > MAX_CUSTOM_PLAN_NAME_LENGTH) {
    return {
      error: `Plan name must be at most ${MAX_CUSTOM_PLAN_NAME_LENGTH} characters`,
    };
  }

  const player = auth.username;
  const existing = await prisma.landCustomPlan.findUnique({ where: { id } });
  if (!existing || existing.player !== player)
    return { error: "Plan not found" };

  try {
    await prisma.landCustomPlan.update({
      where: { id },
      data: { name: trimmed },
    });
    return {};
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("Unique constraint")) {
      return { error: `A plan named "${trimmed}" already exists` };
    }
    return { error: msg };
  }
}

export async function deleteCustomPlan(
  id: string
): Promise<{ error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { error: "Not authenticated" };
  }

  const existing = await prisma.landCustomPlan.findUnique({ where: { id } });
  if (!existing || existing.player !== auth.username) {
    return { error: "Plan not found" };
  }

  await prisma.landCustomPlan.delete({ where: { id } });
  return {};
}
