"use server";
import { authenticatedApi } from "@/lib/api/authenticated";
export async function reportOptions(): Promise<{
  categories: string[];
  locations: string[];
} | null> {
  const response = await authenticatedApi("/reports/options");
  return response?.ok ? response.json() : null;
}
