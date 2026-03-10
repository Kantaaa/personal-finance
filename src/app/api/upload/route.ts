import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { parseCSV, type SourceType } from "@/lib/parsers";

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
      { status: 400 },
    );
  }

  const csvText = await file.text();
  const { transactions, errors } = parseCSV(source, csvText);

  if (transactions.length === 0) {
    return NextResponse.json(
      { error: "No valid transactions found", parseErrors: errors },
      { status: 400 },
    );
  }

  // Fetch user's categories to validate parsed categories
  const { data: userCategories } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", user.id);

  const validNames = new Set(userCategories?.map((c) => c.name) ?? []);

  // Insert transactions, falling back to "Other" for unknown categories
  const rows = transactions.map((t) => ({
    user_id: user.id,
    account_id: accountId || null,
    date: t.date,
    amount: t.amount,
    currency: t.currency,
    description: t.description,
    merchant: t.merchant,
    category: validNames.size > 0 && !validNames.has(t.category) ? "Other" : t.category,
    source_raw: `${source}:${file.name}`,
  }));

  const { error: insertError, data } = await supabase
    .from("transactions")
    .insert(rows)
    .select("id");

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  // Compute date range
  const dates = transactions.map((t) => t.date).sort();

  return NextResponse.json({
    inserted: data?.length ?? 0,
    dateRange: { from: dates[0], to: dates[dates.length - 1] },
    parseErrors: errors,
  });
}
