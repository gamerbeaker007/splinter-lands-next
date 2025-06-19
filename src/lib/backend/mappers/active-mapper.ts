import type { ActiveDto } from "@/types/active";
import { Active } from "@/generated/prisma";

export function toActiveDto(active: Active): ActiveDto {
  return {
    activeBasedOnPp: active.active_based_on_pp,
    activeBasedOnInUse: active.active_based_on_in_use ?? undefined,
    date: active.date.toISOString(),
  };
}

export function toActiveDtoList(list: Active[]): ActiveDto[] {
  return list.map(toActiveDto);
}
