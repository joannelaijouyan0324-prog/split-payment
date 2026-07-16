"use client";

import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";

type SplitMode = "equal" | "itemized";
type RoundingMode = "exact" | "down" | "up";
type SettlementStatus = "unpaid" | "pending" | "paid";

type Participant = {
  id: string;
  name: string;
  status: SettlementStatus;
};

type BillItem = {
  id: string;
  name: string;
  amount: number;
  assignedTo: string[];
};

type ParsedReceiptResponse = {
  ocrText?: string;
  bill?: {
    currency?: string;
    subtotal_minor?: number;
    tax_minor?: number;
    service_charge_minor?: number;
    discount_minor?: number;
    total_minor?: number;
  };
  included_tax_minor?: number;
  items?: Array<{
    id: string;
    name: string;
    total_price_minor: number;
  }>;
  itemCount?: number;
  provider?: string;
  warning?: string;
};

function formatMoney(value: number, currency = "MYR") {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
  }).format(value);
}

function roundAmount(value: number, mode: RoundingMode) {
  if (mode === "down") return Math.floor(value * 100) / 100;
  if (mode === "up") return Math.ceil(value * 100) / 100;
  return Math.round(value * 100) / 100;
}

function parseAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmountInput(amountMinor?: number | null) {
  const value = (amountMinor ?? 0) / 100;
  return value === 0 ? "" : String(value);
}

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

const extensionHydrationProps = {
  suppressHydrationWarning: true,
};

export default function NewBillPage() {
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const [activeBillId, setActiveBillId] = useState("");
  const [billSource, setBillSource] = useState<"manual" | "scan" | "upload">("manual");
  const [billTitle, setBillTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const [paidBy, setPaidBy] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("itemized");
  const [roundingMode, setRoundingMode] = useState<RoundingMode>("exact");
  const [receiptName, setReceiptName] = useState("");
  const [receiptImageId, setReceiptImageId] = useState("");
  const [receiptStoragePath, setReceiptStoragePath] = useState("");
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [receiptOcrText, setReceiptOcrText] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [equalSubtotalInput, setEqualSubtotalInput] = useState("");
  const [taxInput, setTaxInput] = useState("");
  const [includedTaxMinor, setIncludedTaxMinor] = useState(0);
  const [serviceInput, setServiceInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [message, setMessage] = useState("Create a receipt split from this workspace.");
  const [participantError, setParticipantError] = useState("");
  const [itemError, setItemError] = useState("");

  const [participants, setParticipants] = useState<Participant[]>([]);

  const [items, setItems] = useState<BillItem[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billId = params.get("billId");
    const sourceParam = params.get("source");
    const scanParam = params.get("scan");
    const scanError = params.get("scanError");
    if (sourceParam === "manual" || sourceParam === "scan" || sourceParam === "upload") {
      setBillSource(sourceParam);
    }
    if (!billId) return;

    async function loadBill() {
      const { data, error } = await supabase
        .from("bills")
        .select("id, title, merchant_name, currency, split_mode, rounding_mode, subtotal_minor, tax_minor, service_charge_minor, discount_minor")
        .eq("id", billId)
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setActiveBillId(data.id);
      setBillTitle(data.title || "Untitled bill");
      setMerchant(data.merchant_name || "");
      setCurrency(data.currency || "MYR");
      setSplitMode(data.split_mode as SplitMode);
      setRoundingMode(data.rounding_mode as RoundingMode);
      setEqualSubtotalInput(formatAmountInput(data.subtotal_minor));
      setTaxInput(formatAmountInput(data.tax_minor));
      setServiceInput(formatAmountInput(data.service_charge_minor));
      setDiscountInput(formatAmountInput(data.discount_minor));

      const [
        { data: participantRows, error: participantLoadError },
        { data: receiptRows },
        { data: itemRows, error: itemRowsError },
      ] =
        await Promise.all([
          supabase
            .from("bill_participants")
            .select("id, display_name, settlement_status, role")
            .eq("bill_id", billId)
            .order("created_at", { ascending: true }),
          supabase
            .from("receipt_images")
            .select("id, file_name, storage_path")
            .eq("bill_id", billId)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("bill_items")
            .select("id, name, total_price_minor")
            .eq("bill_id", billId)
            .order("sort_order", { ascending: true }),
        ]);

      if (participantLoadError) {
        setMessage(participantLoadError.message);
        return;
      }

      if (itemRowsError) {
        setMessage(itemRowsError.message);
        return;
      }

      const loadedReceipt = receiptRows?.[0];
      const loadedReceiptName = loadedReceipt?.file_name || "";
      setReceiptName(loadedReceiptName);
      setReceiptImageId(loadedReceipt?.id || "");
      setReceiptStoragePath(loadedReceipt?.storage_path || "");
      setReceiptPreviewUrl("");
      setReceiptOcrText("");
      setIncludedTaxMinor(0);
      if (loadedReceipt?.storage_path) {
        const { data: signedReceipt } = await supabase.storage
          .from("receipts")
          .createSignedUrl(loadedReceipt.storage_path, 60 * 60);
        setReceiptPreviewUrl(signedReceipt?.signedUrl || "");
      }
      if (loadedReceipt?.id) {
        const cachedOcrText = window.localStorage.getItem(`jsplit-ocr-${billId}`) || "";
        if (cachedOcrText) setReceiptOcrText(cachedOcrText);

        const { data: receiptOcrRow } = await supabase
          .from("receipt_images")
          .select("ocr_text")
          .eq("id", loadedReceipt.id)
          .maybeSingle();
        if (receiptOcrRow?.ocr_text) {
          setReceiptOcrText(receiptOcrRow.ocr_text);
        }
      }
      if (!sourceParam) {
        setBillSource(data.title === "Manual bill" ? "manual" : "upload");
      }

      if (participantRows?.length) {
        const loadedParticipants = participantRows.map((participant) => ({
          id: participant.id,
          name: participant.display_name,
          status: participant.settlement_status as SettlementStatus,
        }));
        setParticipants(loadedParticipants);
        setPaidBy(
          participantRows.find((participant) => participant.role === "payer")?.display_name ||
            loadedParticipants[0]?.name ||
            "",
        );
      }

      setItems(
        (itemRows ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          amount: item.total_price_minor / 100,
          assignedTo: [],
        })),
      );

      if (scanParam === "ocr") {
        setMessage("Receipt OCR finished. Review the detected totals and items before sharing.");
      } else if (scanParam === "failed") {
        setMessage(scanError || "Receipt uploaded, but OCR failed. Enter items manually.");
      } else {
        setMessage("Draft bill loaded from Supabase.");
      }
    }

    loadBill();
  }, []);

  async function saveDraft() {
    if (!activeBillId) {
      setMessage("This prototype bill has no database draft yet.");
      return;
    }

    const { error } = await supabase
      .from("bills")
      .update({
        title: billTitle || "Untitled bill",
        merchant_name: merchant || null,
        currency,
        split_mode: splitMode,
        rounding_mode: roundingMode,
        subtotal_minor: Math.round(itemSubtotal * 100),
        tax_minor: splitMode === "equal" ? 0 : Math.round(tax * 100),
        service_charge_minor: splitMode === "equal" ? 0 : Math.round(service * 100),
        discount_minor: splitMode === "equal" ? 0 : Math.round(discount * 100),
        total_minor: Math.round(billTotal * 100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeBillId);

    setMessage(error ? error.message : "Draft saved to Supabase.");
  }

  const tax = parseAmount(taxInput);
  const service = parseAmount(serviceInput);
  const discount = parseAmount(discountInput);

  const itemizedSubtotal = useMemo(
    () => items.reduce((total, item) => total + item.amount, 0),
    [items],
  );

  const isManualBill = billSource === "manual";
  const equalTotal = parseAmount(equalSubtotalInput);
  const itemSubtotal = splitMode === "equal" ? equalTotal : itemizedSubtotal;

  const billTotal = splitMode === "equal" ? equalTotal : itemSubtotal + tax + service - discount;
  const payerId = participants.find((participant) => participant.name === paidBy)?.id ?? "";

  const splitResults = useMemo(() => {
    return participants.map((participant) => {
      const participantCount = participants.length;
      const itemShare =
        splitMode === "equal"
          ? participantCount > 0
            ? billTotal / participantCount
            : 0
          : items.reduce((total, item) => {
              if (!item.assignedTo.includes(participant.id) || item.assignedTo.length === 0) {
                return total;
              }
              return total + item.amount / item.assignedTo.length;
            }, 0);

      const ratio = itemSubtotal > 0 ? itemShare / itemSubtotal : 0;
      const taxShare = splitMode === "equal" ? 0 : tax * ratio;
      const serviceShare = splitMode === "equal" ? 0 : service * ratio;
      const discountShare = splitMode === "equal" ? 0 : discount * ratio;
      const exact = itemShare + taxShare + serviceShare - discountShare;
      const rounded = roundAmount(exact, roundingMode);

      return {
        ...participant,
        itemShare,
        taxShare,
        serviceShare,
        discountShare,
        exact,
        rounded,
      };
    });
  }, [billTotal, discount, itemSubtotal, items, participants, roundingMode, service, splitMode, tax]);

  const roundedTotal = splitResults.reduce((total, result) => total + result.rounded, 0);
  const roundingDifference = roundedTotal - billTotal;
  const unassignedItems = items.filter((item) => item.assignedTo.length === 0);
  const payableResults = splitResults.filter((result) => result.id !== payerId);
  const displayMoney = (value: number) => formatMoney(value, currency);

  function addParticipant() {
    const cleanName = participantName.trim();
    if (!cleanName) {
      setParticipantError("Enter a participant name.");
      return;
    }
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (participants.some((participant) => participant.id === id)) {
      setParticipantError(`${cleanName} is already in this bill.`);
      return;
    }
    setParticipants((current) => [...current, { id, name: cleanName, status: "unpaid" }]);
    setParticipantName("");
    setParticipantError("");
    setMessage(`${cleanName} added as a participant.`);
  }

  function addItem() {
    const cleanName = itemName.trim();
    const amount = Number(itemAmount);
    if (!cleanName) {
      setItemError("Enter an item name.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setItemError("Enter a valid item amount.");
      return;
    }
    setItems((current) => [
      ...current,
      {
        id: `item-${Date.now()}`,
        name: cleanName,
        amount,
        assignedTo: [],
      },
    ]);
    setItemName("");
    setItemAmount("");
    setItemError("");
    setMessage(`${cleanName} added. Assign it to participants before finalizing.`);
  }

  function toggleAssignment(itemId: string, participantId: string) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;
        const assignedTo = item.assignedTo.includes(participantId)
          ? item.assignedTo.filter((id) => id !== participantId)
          : [...item.assignedTo, participantId];
        return { ...item, assignedTo };
      }),
    );
  }

  function removeParticipant(participantId: string) {
    const participant = participants.find((current) => current.id === participantId);
    if (!participant || participant.id === payerId) return;

    setParticipants((current) => current.filter((item) => item.id !== participantId));
    setItems((current) =>
      current.map((item) => ({
        ...item,
        assignedTo: item.assignedTo.filter((id) => id !== participantId),
      })),
    );
    setMessage(`${participant.name} removed from this bill.`);
  }

  async function deleteStoredReceipt(storagePath: string, imageId: string) {
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("receipts")
        .remove([storagePath]);

      if (storageError) throw storageError;
    }

    if (imageId) {
      const { error: receiptError } = await supabase
        .from("receipt_images")
        .delete()
        .eq("id", imageId);

      if (receiptError) throw receiptError;
    }
  }

  async function uploadReceipt(file: File) {
    if (!activeBillId) {
      setMessage("This draft is still loading. Try again in a moment.");
      return;
    }

    const previous = {
      name: receiptName,
      imageId: receiptImageId,
      storagePath: receiptStoragePath,
      previewUrl: receiptPreviewUrl,
      ocrText: receiptOcrText,
    };
    const previewUrl = URL.createObjectURL(file);
    const storagePath = `${activeBillId}/${Date.now()}-${cleanFileName(file.name)}`;

    setReceiptName(file.name);
    setReceiptImageId("");
    setReceiptStoragePath("");
    setReceiptPreviewUrl(previewUrl);
    setReceiptOcrText("");
    setMessage(`Uploading ${file.name}...`);

    try {
      if (previous.storagePath || previous.imageId) {
        await deleteStoredReceipt(previous.storagePath, previous.imageId);
      }

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type || undefined,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: receiptRow, error: receiptError } = await supabase
        .from("receipt_images")
        .insert({
          bill_id: activeBillId,
          file_name: file.name,
          storage_path: storagePath,
          content_type: file.type,
        })
        .select("id, storage_path")
        .single();

      if (receiptError) throw receiptError;

      setReceiptImageId(receiptRow.id);
      setReceiptStoragePath(receiptRow.storage_path);
      if (!file.type.startsWith("image/")) {
        setMessage(`${file.name} uploaded. Receipt scanning currently supports image files only.`);
        return;
      }

      setMessage(`${file.name} uploaded. Scanning receipt...`);
      const parseForm = new FormData();
      parseForm.set("billId", activeBillId);
      parseForm.set("receiptImageId", receiptRow.id);
      parseForm.set("file", file);

      const parseResponse = await fetch("/api/receipts/parse", {
        method: "POST",
        body: parseForm,
      });

      const parsePayload = await parseResponse.json().catch(() => null);
      if (!parseResponse.ok) {
        setMessage(parsePayload?.error || `${file.name} uploaded, but scanning failed.`);
        return;
      }

      const parsed = parsePayload as ParsedReceiptResponse;
      setReceiptOcrText(parsed.ocrText || "");
      window.localStorage.setItem(`jsplit-ocr-${activeBillId}`, parsed.ocrText || "");
      setSplitMode("itemized");
      if (parsed.bill) {
        setCurrency(parsed.bill.currency || currency);
        setEqualSubtotalInput(formatAmountInput(parsed.bill.subtotal_minor));
        setTaxInput(formatAmountInput(parsed.bill.tax_minor));
        setServiceInput(formatAmountInput(parsed.bill.service_charge_minor));
        setDiscountInput(formatAmountInput(parsed.bill.discount_minor));
      }
      setIncludedTaxMinor(parsed.included_tax_minor ?? 0);
      setItems(
        (parsed.items ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          amount: item.total_price_minor / 100,
          assignedTo: [],
        })),
      );
      setMessage(
        parsed.provider === "tesseract+openai"
          ? `OpenAI parsed the OCR text. ${parsed.itemCount ?? 0} item(s) found. Please review before sharing.`
          : `Receipt OCR finished with local parsing. ${parsed.itemCount ?? 0} item(s) found. ${parsed.warning ? parsed.warning : "Please review before sharing."}`,
      );
    } catch (error) {
      setReceiptName(previous.name);
      setReceiptImageId(previous.imageId);
      setReceiptStoragePath(previous.storagePath);
      setReceiptPreviewUrl(previous.previewUrl);
      setReceiptOcrText(previous.ocrText);
      setMessage(error instanceof Error ? error.message : "Receipt upload failed.");
    } finally {
      if (receiptInputRef.current) {
        receiptInputRef.current.value = "";
      }
    }
  }

  async function removeReceipt() {
    const removedName = receiptName;
    const removedPreviewUrl = receiptPreviewUrl;
    const removedOcrText = receiptOcrText;
    setReceiptName("");
    setReceiptPreviewUrl("");
    setReceiptOcrText("");

    try {
      await deleteStoredReceipt(receiptStoragePath, receiptImageId);
    } catch (error) {
      setReceiptName(removedName);
      setReceiptPreviewUrl(removedPreviewUrl);
      setReceiptOcrText(removedOcrText);
      setMessage(error instanceof Error ? error.message : "Receipt removal failed.");
      return;
    }

    setReceiptImageId("");
    setReceiptStoragePath("");
    if (receiptInputRef.current) {
      receiptInputRef.current.value = "";
    }
    if (activeBillId) {
      window.localStorage.removeItem(`jsplit-ocr-${activeBillId}`);
    }
    setMessage(removedName ? `${removedName} removed.` : "Receipt removed.");
  }

  function updateStatus(participantId: string, status: SettlementStatus) {
    setParticipants((current) =>
      current.map((participant) =>
        participant.id === participantId ? { ...participant, status } : participant,
      ),
    );
    setMessage("Settlement status updated.");
  }

  return (
    <main className="app-shell">
      <AppNav active="new" subtitle="Receipt review" />

      <section className="workspace">
        <header className="topbar">
          <div>
            <Link className="back-link" href="/bills/new">
              Back
            </Link>
            <h1>{billTitle || "Untitled bill"}</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={saveDraft} {...extensionHydrationProps}>
              Save draft
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => setMessage("Share link generated for preview.")}
              {...extensionHydrationProps}
            >
              Share link
            </button>
          </div>
        </header>

        <div className="notice">{message}</div>

        <div className="workspace-grid">
          <div className="main-column">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Bill Setup</span>
                  <h2>{isManualBill ? "Bill details" : "Receipt and bill details"}</h2>
                </div>
                {!isManualBill ? (
                  <label className="file-control">
                    Upload receipt
                    <input
                      ref={receiptInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          uploadReceipt(file);
                        } else {
                          setMessage("Receipt upload cancelled.");
                        }
                      }}
                    />
                  </label>
                ) : null}
              </div>

              <div className={isManualBill ? "bill-layout manual-bill-layout" : "bill-layout"}>
                {!isManualBill ? (
                  <div className="receipt-placeholder">
                    {receiptPreviewUrl ? (
                      <img src={receiptPreviewUrl} alt={receiptName || "Uploaded receipt"} />
                    ) : null}
                    <strong>{receiptName || "Receipt image placeholder"}</strong>
                    {!receiptPreviewUrl ? (
                      <span>Place the uploaded receipt photo here for review and OCR later.</span>
                    ) : null}
                    {receiptName ? (
                      <button
                        type="button"
                        className="text-link remove-chip receipt-remove"
                        onClick={removeReceipt}
                        {...extensionHydrationProps}
                      >
                        Remove receipt
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="form-grid">
                  <label>
                    Bill title
                    <input value={billTitle} onChange={(event) => setBillTitle(event.target.value)} {...extensionHydrationProps} />
                  </label>
                  <label>
                    Merchant
                    <input value={merchant} onChange={(event) => setMerchant(event.target.value)} {...extensionHydrationProps} />
                  </label>
                  <label>
                    Currency
                    <select value={currency} onChange={(event) => setCurrency(event.target.value)} {...extensionHydrationProps}>
                      <option>MYR</option>
                      <option>USD</option>
                      <option>SGD</option>
                      <option>CHF</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                  </label>
                  <label>
                    Paid by
                    <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)} {...extensionHydrationProps}>
                      {participants.map((participant) => (
                        <option key={participant.id}>{participant.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </section>

            {!isManualBill && receiptOcrText ? (
              <section className="panel ocr-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">OCR Text</span>
                    <h2>Extracted receipt text</h2>
                  </div>
                </div>
                <pre>{receiptOcrText}</pre>
              </section>
            ) : null}

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">People</span>
                  <h2>Participants</h2>
                </div>
              </div>
              <div className="inline-form">
                <input
                  placeholder="Add participant name"
                  value={participantName}
                  aria-invalid={participantError ? "true" : "false"}
                  onChange={(event) => {
                    setParticipantName(event.target.value);
                    if (participantError) setParticipantError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addParticipant();
                    }
                  }}
                  {...extensionHydrationProps}
                />
                <button type="button" onClick={addParticipant} {...extensionHydrationProps}>
                  Add
                </button>
              </div>
              {participantError ? <p className="field-error">{participantError}</p> : null}
              <div className="people-list">
                {participants.map((participant) => (
                  <article key={participant.id}>
                    <div className="avatar">{participant.name.slice(0, 1)}</div>
                    <div>
                      <strong>{participant.name}</strong>
                      <span>{participant.status}</span>
                    </div>
                    {participant.id !== payerId ? (
                      <button
                        type="button"
                        className="text-link remove-chip"
                        aria-label={`Remove ${participant.name}`}
                        onClick={() => removeParticipant(participant.id)}
                        {...extensionHydrationProps}
                      >
                        Remove
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="panel" id="items">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Items</span>
                  <h2>{splitMode === "equal" ? "Equal split total" : isManualBill ? "Manual items" : "Receipt items"}</h2>
                </div>
                <div className="segmented">
                  <button
                    type="button"
                    className={splitMode === "equal" ? "active" : ""}
                    onClick={() => setSplitMode("equal")}
                    {...extensionHydrationProps}
                  >
                    Equal
                  </button>
                  <button
                    type="button"
                    className={splitMode === "itemized" ? "active" : ""}
                    onClick={() => setSplitMode("itemized")}
                    {...extensionHydrationProps}
                  >
                    Itemized
                  </button>
                </div>
              </div>

              {splitMode === "equal" ? (
                <label className="single-field">
                  Total amount
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={equalSubtotalInput}
                    onChange={(event) => setEqualSubtotalInput(event.target.value)}
                    {...extensionHydrationProps}
                  />
                </label>
              ) : (
                <>
                  <div className="inline-form">
                    <input
                      placeholder="Item name"
                      value={itemName}
                      aria-invalid={itemError ? "true" : "false"}
                      onChange={(event) => {
                        setItemName(event.target.value);
                        if (itemError) setItemError("");
                      }}
                      {...extensionHydrationProps}
                    />
                    <input
                      placeholder="Amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemAmount}
                      aria-invalid={itemError ? "true" : "false"}
                      onChange={(event) => {
                        setItemAmount(event.target.value);
                        if (itemError) setItemError("");
                      }}
                      {...extensionHydrationProps}
                    />
                    <button type="button" onClick={addItem} {...extensionHydrationProps}>
                      Add item
                    </button>
                  </div>
                  {itemError ? <p className="field-error">{itemError}</p> : null}

                  <div className="item-list">
                    {items.map((item) => (
                      <article className="item-row" key={item.id}>
                        <div className="item-main">
                          <strong>{item.name}</strong>
                          <span>{displayMoney(item.amount)}</span>
                        </div>
                        <div className="assignment-grid">
                          {participants.map((participant) => (
                            <label key={participant.id} className="assignment-chip">
                              <input
                                type="checkbox"
                                checked={item.assignedTo.includes(participant.id)}
                                onChange={() => toggleAssignment(item.id, participant.id)}
                                {...extensionHydrationProps}
                              />
                              {participant.name}
                            </label>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <aside className="side-column">
            <section className="panel totals-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Live Summary</span>
                  <h2>Amounts owed</h2>
                </div>
              </div>

              <div className="money-card">
                <span>{merchant}</span>
                <strong>{displayMoney(billTotal)}</strong>
              </div>

              {splitMode === "itemized" ? (
                <div className="adjustments">
                  <label>
                    Additional tax
                    <input inputMode="decimal" placeholder="0.00" value={taxInput} onChange={(event) => setTaxInput(event.target.value)} {...extensionHydrationProps} />
                  </label>
                  <label>
                    Service
                    <input inputMode="decimal" placeholder="0.00" value={serviceInput} onChange={(event) => setServiceInput(event.target.value)} {...extensionHydrationProps} />
                  </label>
                  <label>
                    Discount
                    <input inputMode="decimal" placeholder="0.00" value={discountInput} onChange={(event) => setDiscountInput(event.target.value)} {...extensionHydrationProps} />
                  </label>
                </div>
              ) : null}

              {includedTaxMinor > 0 && splitMode === "itemized" ? (
                <p className="included-tax-note">
                  Included tax shown on receipt: {displayMoney(includedTaxMinor / 100)}. It is already inside the item prices.
                </p>
              ) : null}

              <div className="rounding-box">
                <span>Rounding</span>
                <div className="segmented">
                  <button type="button" className={roundingMode === "exact" ? "active" : ""} onClick={() => setRoundingMode("exact")} {...extensionHydrationProps}>
                    Exact
                  </button>
                  <button type="button" className={roundingMode === "down" ? "active" : ""} onClick={() => setRoundingMode("down")} {...extensionHydrationProps}>
                    Down
                  </button>
                  <button type="button" className={roundingMode === "up" ? "active" : ""} onClick={() => setRoundingMode("up")} {...extensionHydrationProps}>
                    Up
                  </button>
                </div>
                <small>Difference: {displayMoney(roundingDifference)}</small>
              </div>

              {unassignedItems.length > 0 && splitMode === "itemized" ? (
                <div className="warning">
                  {unassignedItems.length} item(s) unassigned. Assign before finalizing.
                </div>
              ) : null}

              <div className="results-list">
                {payableResults.length === 0 ? (
                  <div className="empty-state">No one else owes this bill yet.</div>
                ) : null}
                {payableResults.map((result) => (
                  <article key={result.id}>
                    <div>
                      <strong>{result.name}</strong>
                      <span>
                        {splitMode === "equal"
                          ? `Share ${displayMoney(result.rounded)}`
                          : `Items ${displayMoney(result.itemShare)} - Additional tax ${displayMoney(result.taxShare)} - Service ${displayMoney(result.serviceShare)}`}
                      </span>
                    </div>
                    <b>{displayMoney(result.rounded)}</b>
                    <select
                      value={result.status}
                      onChange={(event) => updateStatus(result.id, event.target.value as SettlementStatus)}
                      {...extensionHydrationProps}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
