import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { recognize } from "tesseract.js";
import path from "node:path";

type ParsedReceipt = {
  currency: string;
  subtotal: number;
  tax: number;
  includedTax: number;
  service: number;
  discount: number;
  total: number;
  printedSubtotal: number;
  printedTotal: number;
  items: Array<{
    name: string;
    quantity: number;
    unit: number;
    total: number;
  }>;
};

type ParserSource = "local" | "gemini";

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, supabaseKey);
}

function normalizeOcrText(text: string) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function amountToMinor(value: number) {
  return Math.round(value * 100);
}

function parseMoney(raw: string) {
  const normalized = raw
    .replace(/[^\d.,-]/g, "")
    .replace(/,/g, ".");
  const match = normalized.match(/-?\d+(?:\.\d{1,2})?$/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function detectCurrency(text: string) {
  const upper = text.toUpperCase();
  if (/\bCHF\b/.test(upper)) return "CHF";
  if (/\bMYR\b|\bRM\b/.test(upper)) return "MYR";
  if (/\bUSD\b/.test(upper)) return "USD";
  if (/\$\s*\d+[.,]\d{2}\b/.test(text)) return "USD";
  if (/\bSGD\b/.test(upper)) return "SGD";
  if (/\bEUR\b/.test(upper)) return "EUR";
  if (/\bGBP\b/.test(upper)) return "GBP";
  return "MYR";
}

function lastAmountInLine(line: string) {
  const matches = [...line.matchAll(/(?:RM|MYR|CHF|USD|SGD|EUR|GBP|\$)?\s*-?\d+[.,]\d{2}\b/g)];
  const last = matches.at(-1);
  if (!last) return null;
  const amount = parseMoney(last[0]);
  if (amount === null) return null;
  return {
    amount,
    start: last.index ?? line.length,
    raw: last[0],
  };
}

function firstAmountInLine(line: string) {
  const match = line.match(/(?:RM|MYR|CHF|USD|SGD|EUR|GBP|\$)?\s*-?\d+[.,]\d{2}\b/);
  if (!match) return null;
  const amount = parseMoney(match[0]);
  if (amount === null) return null;
  return {
    amount,
    start: match.index ?? 0,
    raw: match[0],
  };
}

function cleanItemName(value: string) {
  return value
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[|[\]{}]+/g, "")
    .replace(/^[A-Z]\s+(?=[A-Z])/u, "")
    .replace(/^\d+\s*[xX*]?\s*/, "")
    .replace(/^[Il]\s*[xX]\s*/u, "")
    .replace(/\s+\d+$/g, "")
    .replace(/\s*[àa@]\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[-:|]+$/g, "")
    .trim();
}

function parseItemLine(line: string) {
  const lower = line.toLowerCase();
  if (/\b(rech|receipt|invoice|total|mwst|must|mst|tax|gst|sst|vat|euro|eur|cash|change|balance|paid|visa|mastercard|card|approval|date|time|tisch|table|bar)\b/.test(lower)) {
    return null;
  }

  const quantityLine = line.replace(/^(\s*[^\p{L}\p{N}]?\s*)[Il]\s*[xX]/u, "$11x");
  const quantityMatch = quantityLine.match(/^\s*[^\p{L}\p{N}]?\s*(\d+)\s*[xX]\s*/u);
  const amountMatches = [...line.matchAll(/(?:RM|MYR|CHF|USD|SGD|EUR|GBP|\$)?\s*-?\d+[.,]\d{2}\b/g)];
  if ((quantityMatch || amountMatches.length >= 2) && amountMatches.length >= 2) {
    const totalMatch = amountMatches.at(-1);
    const unitMatch = amountMatches.at(-2);
    if (!totalMatch || !unitMatch) return null;
    const total = parseMoney(totalMatch[0]);
    const unit = parseMoney(unitMatch[0]);
    if (total === null || unit === null) return null;

    const nameStart = quantityMatch ? (quantityMatch.index ?? 0) + quantityMatch[0].length : 0;
    const nameEnd = unitMatch.index ?? line.length;
    const sourceLine = quantityMatch ? quantityLine : line;
    const name = cleanItemName(sourceLine.slice(nameStart, nameEnd));
    if (!name || !/[a-zA-Z]/.test(name)) return null;

    return {
      name,
      quantity: quantityMatch ? Number(quantityMatch[1]) : 1,
      unit,
      total,
    };
  }

  if (amountMatches.length === 1) {
    const totalMatch = amountMatches[0];
    const total = parseMoney(totalMatch[0]);
    if (total === null) return null;

    const nameStart = quantityMatch ? (quantityMatch.index ?? 0) + quantityMatch[0].length : 0;
    const nameEnd = totalMatch.index ?? line.length;
    const sourceLine = quantityMatch ? quantityLine : line;
    const name = cleanItemName(sourceLine.slice(nameStart, nameEnd));
    if (!name || !/[a-zA-Z]/.test(name)) return null;

    const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;
    return {
      name,
      quantity,
      unit: quantity > 0 ? total / quantity : total,
      total,
    };
  }

  return null;
}

function parseReceiptText(ocrText: string) {
  const lines = ocrText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const keywordAmounts: Record<string, number | null> = {
    printedSubtotal: null,
    printedTotal: null,
    tax: null,
    includedTax: null,
    service: null,
    discount: null,
  };
  const items: Array<{ name: string; quantity: number; unit: number; total: number }> = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const amountMatch = lastAmountInLine(line);
    if (!amountMatch) continue;

    if (/\b(discount|disc|promo|rebate)\b/.test(lower)) {
      keywordAmounts.discount = Math.abs(amountMatch.amount);
      continue;
    }

    if (/\b(tax|gst|sst|vat|mwst|must|mst)\b/.test(lower)) {
      if (/\b(incl|included|inclusive)\b/.test(lower)) {
        keywordAmounts.includedTax = amountMatch.amount;
      } else {
        keywordAmounts.tax = amountMatch.amount;
      }
      continue;
    }

    if (/\b(service|svc)\b/.test(lower)) {
      keywordAmounts.service = amountMatch.amount;
      continue;
    }

    if (/\b(sub\s*total|subtotal)\b/.test(lower)) {
      keywordAmounts.printedSubtotal = amountMatch.amount;
      continue;
    }

    if (/\b(total|amount due|grand total|nett|net total)\b/.test(lower)) {
      keywordAmounts.printedTotal = amountMatch.amount;
      continue;
    }

    const item = parseItemLine(line);
    if (item) items.push(item);
  }

  const itemSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const subtotal = itemSubtotal;
  const tax = keywordAmounts.tax ?? 0;
  const service = keywordAmounts.service ?? 0;
  const discount = keywordAmounts.discount ?? 0;
  const total = subtotal + tax + service - discount;

  return {
    subtotal,
    tax,
    includedTax: keywordAmounts.includedTax ?? 0,
    service,
    discount,
    total,
    printedSubtotal: keywordAmounts.printedSubtotal ?? 0,
    printedTotal: keywordAmounts.printedTotal ?? 0,
    currency: detectCurrency(ocrText),
    items,
  };
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("AI parser did not return JSON.");
  return JSON.parse(raw.slice(start, end + 1));
}

function getGeminiOutputText(payload: any) {
  return (payload?.candidates ?? [])
    .flatMap((candidate: any) => candidate?.content?.parts ?? [])
    .map((part: any) => part?.text ?? "")
    .filter(Boolean)
    .join("\n");
}

function normalizeParsedReceipt(value: any, fallbackCurrency: string): ParsedReceipt {
  const items: ParsedReceipt["items"] = Array.isArray(value?.items)
    ? value.items
        .map((item: any) => {
          const quantity = Number(item?.quantity ?? 1) || 1;
          const total = Number(item?.total ?? 0) || 0;
          const unit = Number(item?.unit ?? total / quantity) || total;
          return {
            name: String(item?.name ?? "").trim(),
            quantity,
            unit,
            total,
          };
        })
        .filter((item: ParsedReceipt["items"][number]) => item.name && item.total > 0)
    : [];

  const itemSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const subtotal = itemSubtotal;
  const tax = Number(value?.tax ?? 0) || 0;
  const includedTax = Number(value?.includedTax ?? 0) || 0;
  const service = Number(value?.service ?? 0) || 0;
  const discount = Number(value?.discount ?? 0) || 0;
  const total = subtotal + tax + service - discount;
  const printedSubtotal = Number(value?.printedSubtotal ?? value?.receiptSubtotal ?? value?.subtotal ?? 0) || 0;
  const printedTotal = Number(value?.printedTotal ?? value?.receiptTotal ?? value?.total ?? 0) || 0;

  return {
    currency: String(value?.currency || fallbackCurrency || "MYR").toUpperCase(),
    subtotal,
    tax,
    includedTax,
    service,
    discount,
    total,
    printedSubtotal,
    printedTotal,
    items,
  };
}

function buildReceiptParserPrompt(ocrText: string) {
  const prompt = `Parse restaurant receipt OCR into compact JSON only. No markdown. No explanation.

Rules:
- Extract only real purchased line items.
- Ignore receipt number, server, table, card/payment info, tax ID, barcode, dates, URLs, and thank-you text.
- If an item line starts with quantity like "2X CAESAR SALAD $24.00", quantity is 2 and total is 24.00.
- If tax says included/incl/inclusive/MwSt/MuSt, put it in includedTax, not tax.
- tax means additional tax that should be added to the item subtotal.
- includedTax is informational and already inside item prices/total.
- The app code calculates subtotal and total from items, tax, service, and discount. Put printed subtotal in printedSubtotal and printed total in printedTotal only for validation.
- Use major currency units, not cents.
- If a value is missing, use 0.

JSON shape: {"currency":"MYR|USD|SGD|CHF|EUR|GBP|...","tax":number,"includedTax":number,"service":number,"discount":number,"printedSubtotal":number,"printedTotal":number,"items":[{"name":string,"quantity":number,"unit":number,"total":number}]}

OCR text:
${ocrText}`;

  return prompt;
}

async function parseReceiptTextWithGemini(ocrText: string, fallback: ParsedReceipt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      parsed: fallback,
      source: "local" as ParserSource,
      warning: "Gemini API key is missing. Backup local parser was used.",
    };
  }

  const model = process.env.GEMINI_RECEIPT_TEXT_MODEL || "gemini-3.5-flash";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildReceiptParserPrompt(ocrText) }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    const payload = await response.json();
    if (!response.ok) {
      return {
        parsed: fallback,
        source: "local" as ParserSource,
        warning: `Gemini failed: ${payload?.error?.message || "text parsing failed"}. Backup local parser was used.`,
      };
    }

    return {
      parsed: normalizeParsedReceipt(extractJson(getGeminiOutputText(payload)), fallback.currency),
      source: "gemini" as ParserSource,
    };
  } catch (error) {
    return {
      parsed: fallback,
      source: "local" as ParserSource,
      warning: `Gemini failed: ${error instanceof Error ? error.message : "JSON parsing failed"}. Backup local parser was used.`,
    };
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const billId = String(formData.get("billId") ?? "");
    const receiptImageId = String(formData.get("receiptImageId") ?? "");
    const file = formData.get("file");

    if (!billId || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing billId or receipt file." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Local OCR currently supports image files only." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await recognize(bytes, "eng", {
      workerPath: path.join(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js"),
      corePath: path.join(process.cwd(), "node_modules/tesseract.js-core/tesseract-core.wasm.js"),
      cachePath: path.join(process.cwd(), ".tesseract-cache"),
    });
    const ocrText = normalizeOcrText(result.data.text);
    const localParsed = normalizeParsedReceipt(parseReceiptText(ocrText), detectCurrency(ocrText));
    const { parsed, source, warning } = await parseReceiptTextWithGemini(ocrText, localParsed);
    const validationWarnings = [warning].filter(Boolean);
    if (parsed.printedSubtotal > 0 && Math.abs(parsed.printedSubtotal - parsed.subtotal) >= 0.01) {
      validationWarnings.push(
        `Receipt check: items add to ${parsed.subtotal.toFixed(2)}, but printed subtotal is ${parsed.printedSubtotal.toFixed(2)}.`,
      );
    }
    if (parsed.printedTotal > 0 && Math.abs(parsed.printedTotal - parsed.total) >= 0.01) {
      validationWarnings.push(
        `Receipt check: calculated total is ${parsed.total.toFixed(2)}, but printed total is ${parsed.printedTotal.toFixed(2)}.`,
      );
    }
    const supabase = getSupabaseServerClient();

    const billPatch = {
      subtotal_minor: amountToMinor(parsed.subtotal),
      tax_minor: amountToMinor(parsed.tax),
      service_charge_minor: amountToMinor(parsed.service),
      discount_minor: amountToMinor(parsed.discount),
      total_minor: amountToMinor(parsed.total),
      currency: parsed.currency,
      split_mode: "itemized",
      status: "review",
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("bills")
      .update(billPatch)
      .eq("id", billId);

    await supabase.from("bill_items").delete().eq("bill_id", billId);
    if (parsed.items.length) {
      const { error: itemsError } = await supabase.from("bill_items").insert(
        parsed.items.map((item, index) => ({
          bill_id: billId,
          name: item.name,
          quantity: item.quantity,
          unit_price_minor: amountToMinor(item.unit),
          total_price_minor: amountToMinor(item.total),
          sort_order: index,
        })),
      );

      if (itemsError) throw itemsError;
    }

    const { data: savedItems, error: savedItemsError } = await supabase
      .from("bill_items")
      .select("id, name, total_price_minor")
      .eq("bill_id", billId)
      .order("sort_order", { ascending: true });

    if (savedItemsError) throw savedItemsError;

    if (receiptImageId) {
      await supabase
        .from("receipt_images")
        .update({
        ocr_text: ocrText,
        ocr_provider: source === "gemini" ? "tesseract+gemini" : "tesseract",
      })
      .eq("id", receiptImageId);
    }

    return NextResponse.json({
      ocrText,
      bill: billPatch,
      included_tax_minor: amountToMinor(parsed.includedTax),
      items: savedItems ?? [],
      itemCount: savedItems?.length ?? 0,
      provider: source === "gemini" ? "tesseract+gemini" : "tesseract",
      warning: validationWarnings.join(" "),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Local OCR failed." },
      { status: 500 },
    );
  }
}
