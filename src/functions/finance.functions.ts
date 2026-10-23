import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SaleInput {
  product_name: string;
  customer_name: string;
  license_type: string;
  quantity: number;
  amount: number;
  currency: string;
  sold_at: string;
  notes?: string | null;
}

export interface ExpenseInput {
  category: string;
  vendor: string;
  amount: number;
  currency: string;
  spent_at: string;
  notes?: string | null;
}

export const getFinanceData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [salesRes, expensesRes] = await Promise.all([
      supabase.from("sales").select("*").order("sold_at", { ascending: false }),
      supabase.from("expenses").select("*").order("spent_at", { ascending: false }),
    ]);
    if (salesRes.error) throw new Error(salesRes.error.message);
    if (expensesRes.error) throw new Error(expensesRes.error.message);
    return { sales: salesRes.data, expenses: expensesRes.data };
  });

export const createSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SaleInput) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("sales").insert({ ...data, user_id: userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sales").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ExpenseInput) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("expenses").insert({ ...data, user_id: userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("expenses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
