import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { parseCSV, type SourceType } from "@/lib/parsers";
import { categorize, type CategoryRule } from "@/lib/categorize";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const source = formData.get("source") as SourceType | null;
  const accountId = formData.get("accountId") as string | null;

  if (!file || !source) {
    return NextResponse.json(
      { error: "Missing file or source type" },
      { status: 400 }
    );
  }

  // 1. Parse CSV
  const csvText = await file.text();
  const { transactions: parsed, errors: parseErrors } = parseCSV(
    source,
    csvText
  );

  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "No valid transactions found", parseErrors },
      { status: 400 }
    );
  }

  // 2. Fetch user's category rules (seed defaults if none exist)
  let { data: rules } = await supabase
    .from("category_rules")
    .select("id, keyword, category, priority")
    .eq("user_id", user.id);

  if (!rules || rules.length === 0) {
    await supabase.rpc("seed_default_category_rules", {
      p_user_id: user.id,
    });
    const { data: seeded } = await supabase
      .from("category_rules")
      .select("id, keyword, category, priority")
      .eq("user_id", user.id);
    rules = seeded ?? [];
  }

  // 3. Categorize transactions
  const categorized = categorize(parsed, rules as CategoryRule[]);

  // 4. Validate categories against user's category list
  const { data: userCategories } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", user.id);

  if (!userCategories || userCategories.length === 0) {
    await supabase.rpc("seed_default_categories", { p_user_id: user.id });
  }

  const { data: freshCategories } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", user.id);

  const validNames = new Set(freshCategories?.map((c) => c.name) ?? []);

  // 5. App-level dedup: fetch existing transactions in the date range
  const dates = categorized.map((t) => t.date).sort();
  const { data: existing } = await supabase
    .from("transactions")
    .select("date, amount, description")
    .eq("user_id", user.id)
    .gte("date", dates[0])
    .lte("date", dates[dates.length - 1]);

  const existingKeys = new Set(
    (existing ?? []).map(
      (e) => `${e.date}|${e.amount}|${e.description ?? ""}`
    )
  );

  const newTransactions = categorized.filter(
    (t) => !existingKeys.has(`${t.date}|${t.amount}|${t.description ?? ""}`)
  );

  if (newTransactions.length === 0) {
    return NextResponse.json({
      inserted: 0,
      skipped: categorized.length,
      total: categorized.length,
      dateRange: { from: dates[0], to: dates[dates.length - 1] },
      categoryBreakdown: {},
      parseErrors,
    });
  }

  // 6. Build rows and insert
  const rows = newTransactions.map((t) => ({
    user_id: user.id,
    account_id: accountId || null,
    date: t.date,
    amount: t.amount,
    currency: t.currency,
    description: t.description,
    merchant: t.merchant,
    category:
      validNames.size > 0 && !validNames.has(t.category ?? "Other")
        ? "Other"
        : (t.category ?? "Other"),
    source_raw: `${source}:${file.name}`,
  }));

  const { error: insertError, data } = await supabase
    .from("transactions")
    .insert(rows)
    .select("id");

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  // 7. Compute response stats
  const inserted = data?.length ?? 0;
  const skipped = categorized.length - newTransactions.length;

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const t of categorized) {
    const cat = t.category ?? "Other";
    categoryBreakdown[cat] = (categoryBreakdown[cat] ?? 0) + 1;
  }

  return NextResponse.json({
    inserted,
    skipped,
    total: categorized.length,
    dateRange: { from: dates[0], to: dates[dates.length - 1] },
    categoryBreakdown,
    parseErrors,
  });
}
