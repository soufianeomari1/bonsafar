import type { RunEvent } from "@/lib/ai/events";
import type { Intent } from "@/lib/intent/schema";
import type { Offer } from "@/lib/prices/store";
import { adminClient } from "@/lib/supabase/admin";
import type { AgentPackage } from "./schema";

/**
 * Saves a successful run in public.runs (RLS on, no policy: server only) so
 * block 5 can replay it with a visible "replay" badge and the capture time.
 */
export async function saveRun(run: {
  id: string;
  scenario: string | null;
  intent: Intent;
  events: RunEvent[];
  offers: Offer[];
  package: AgentPackage;
}): Promise<boolean> {
  const { error } = await adminClient().from("runs").insert({
    id: run.id,
    scenario: run.scenario,
    intent: run.intent,
    events: run.events,
    offers: run.offers,
    package: run.package,
    prices_captured_at: run.package.prices_captured_at,
  });
  return !error;
}
