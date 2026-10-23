import { queryOptions } from "@tanstack/react-query";
import { getFinanceData } from "@/functions/finance.functions";

export const financeQueryOptions = queryOptions({
  queryKey: ["finance"],
  queryFn: () => getFinanceData(),
});
