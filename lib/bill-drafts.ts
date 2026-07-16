"use client";

import { supabase } from "@/lib/supabase/client";
import type { LocalUser } from "@/lib/local-user";

type CreateBillDraftInput = {
  owner: LocalUser;
  source: "scan" | "upload" | "manual";
  receiptFile?: File | null;
};

type CreateBillDraftResult = {
  id: string;
  share_token: string;
  parseStatus?: "ocr" | "failed";
  parseError?: string;
  ocrText?: string;
};

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export async function createBillDraft({ owner, source, receiptFile }: CreateBillDraftInput): Promise<CreateBillDraftResult> {
  const title =
    source === "manual" ? "Manual bill" : receiptFile ? receiptFile.name.replace(/\.[^.]+$/, "") : "New receipt";

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({
      owner_user_id: owner.id,
      title,
      currency: "MYR",
      status: "draft",
      split_mode: source === "manual" ? "equal" : "itemized",
      rounding_mode: "exact",
    })
    .select("id, share_token")
    .single();

  if (billError) throw billError;

  const { data: payer, error: participantError } = await supabase
    .from("bill_participants")
    .insert({
      bill_id: bill.id,
      user_id: owner.id,
      display_name: owner.displayName,
      role: "payer",
      settlement_status: "paid",
    })
    .select("id")
    .single();

  if (participantError) throw participantError;

  const { error: updateError } = await supabase
    .from("bills")
    .update({ paid_by_participant_id: payer.id })
    .eq("id", bill.id);

  if (updateError) throw updateError;

  if (receiptFile) {
    const safeName = cleanFileName(receiptFile.name);
    const storagePath = `${bill.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(storagePath, receiptFile, {
        cacheControl: "3600",
        contentType: receiptFile.type || undefined,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: receiptRow, error: receiptError } = await supabase
      .from("receipt_images")
      .insert({
        bill_id: bill.id,
        file_name: receiptFile.name,
        storage_path: storagePath,
        content_type: receiptFile.type,
      })
      .select("id")
      .single();

    if (receiptError) throw receiptError;

    if (receiptFile.type.startsWith("image/")) {
      const parseForm = new FormData();
      parseForm.set("billId", bill.id);
      parseForm.set("receiptImageId", receiptRow.id);
      parseForm.set("file", receiptFile);

      const parseResponse = await fetch("/api/receipts/parse", {
        method: "POST",
        body: parseForm,
      });

      if (!parseResponse.ok) {
        const parsePayload = await parseResponse.json().catch(() => null);
        return {
          ...bill,
          parseStatus: "failed",
          parseError: parsePayload?.error || "Receipt uploaded, but OCR failed.",
        };
      }

      const parsePayload = await parseResponse.json().catch(() => null);
      return {
        ...bill,
        parseStatus: "ocr",
        ocrText: parsePayload?.ocrText || "",
      };
    }
  }

  return bill;
}
