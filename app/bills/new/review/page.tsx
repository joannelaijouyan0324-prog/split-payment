"use client";

import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

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

const moneyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function roundAmount(value: number, mode: RoundingMode) {
  if (mode === "down") return Math.floor(value);
  if (mode === "up") return Math.ceil(value);
  return Math.round(value * 100) / 100;
}

export default function NewBillPage() {
  const [activeBillId, setActiveBillId] = useState("");
  const [billTitle, setBillTitle] = useState("Sushi dinner");
  const [merchant, setMerchant] = useState("Jalan Bistro");
  const [currency, setCurrency] = useState("MYR");
  const [paidBy, setPaidBy] = useState("Alex");
  const [splitMode, setSplitMode] = useState<SplitMode>("itemized");
  const [roundingMode, setRoundingMode] = useState<RoundingMode>("exact");
  const [receiptName, setReceiptName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [tax, setTax] = useState(8.4);
  const [service, setService] = useState(12.8);
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState("Create a receipt split from this workspace.");
  const [participantError, setParticipantError] = useState("");
  const [itemError, setItemError] = useState("");

  const [participants, setParticipants] = useState<Participant[]>([
    { id: "alex", name: "Alex", status: "paid" },
    { id: "ben", name: "Ben", status: "pending" },
    { id: "chloe", name: "Chloe", status: "unpaid" },
    { id: "daniel", name: "Daniel", status: "unpaid" },
  ]);

  const [items, setItems] = useState<BillItem[]>([
    { id: "item-1", name: "Chicken chop", amount: 18.9, assignedTo: ["ben", "chloe"] },
    { id: "item-2", name: "Iced lemon tea", amount: 4.5, assignedTo: ["alex"] },
    { id: "item-3", name: "Pizza large", amount: 40, assignedTo: ["alex", "ben", "chloe", "daniel"] },
    { id: "item-4", name: "Mushroom soup", amount: 12, assignedTo: ["daniel"] },
  ]);

  useEffect(() => {
    const billId = new URLSearchParams(window.location.search).get("billId");
    if (!billId) return;

    async function loadBill() {
      const { data, error } = await supabase
        .from("bills")
        .select(
          `
          id,
          title,
          merchant_name,
          currency,
          split_mode,
          rounding_mode,
          bill_participants(id, display_name, settlement_status, role),
          receipt_images(file_name)
        `,
        )
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
      setReceiptName(data.receipt_images?.[0]?.file_name || "");

      if (data.bill_participants?.length) {
        const loadedParticipants = data.bill_participants.map((participant) => ({
          id: participant.id,
          name: participant.display_name,
          status: participant.settlement_status as SettlementStatus,
        }));
        setParticipants(loadedParticipants);
        setPaidBy(
          data.bill_participants.find((participant) => participant.role === "payer")?.display_name ||
            loadedParticipants[0]?.name ||
            "",
        );
      }

      setItems([]);
      setMessage("Draft bill loaded from Supabase.");
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
        tax_minor: Math.round(tax * 100),
        service_charge_minor: Math.round(service * 100),
        discount_minor: Math.round(discount * 100),
        total_minor: Math.round(billTotal * 100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeBillId);

    setMessage(error ? error.message : "Draft saved to Supabase.");
  }

  const itemSubtotal = useMemo(
    () => items.reduce((total, item) => total + item.amount, 0),
    [items],
  );

  const billTotal = itemSubtotal + tax + service - discount;

  const splitResults = useMemo(() => {
    return participants.map((participant) => {
      const itemShare =
        splitMode === "equal"
          ? participants.length > 0
            ? itemSubtotal / participants.length
            : 0
          : items.reduce((total, item) => {
              if (!item.assignedTo.includes(participant.id) || item.assignedTo.length === 0) {
                return total;
              }
              return total + item.amount / item.assignedTo.length;
            }, 0);

      const ratio = itemSubtotal > 0 ? itemShare / itemSubtotal : 0;
      const taxShare = tax * ratio;
      const serviceShare = service * ratio;
      const discountShare = discount * ratio;
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
  }, [discount, itemSubtotal, items, participants, roundingMode, service, splitMode, tax]);

  const roundedTotal = splitResults.reduce((total, result) => total + result.rounded, 0);
  const roundingDifference = roundedTotal - billTotal;
  const unassignedItems = items.filter((item) => item.assignedTo.length === 0);

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
            <button type="button" onClick={saveDraft}>
              Save draft
            </button>
            <button type="button" className="primary" onClick={() => setMessage("Share link generated for preview.")}>
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
                  <h2>Receipt and bill details</h2>
                </div>
                <label className="file-control">
                  Upload receipt
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]?.name ?? "";
                      setReceiptName(file);
                      setMessage(file ? `Receipt uploaded: ${file}` : "Receipt upload cancelled.");
                    }}
                  />
                </label>
              </div>

              <div className="bill-layout">
                <div className="receipt-placeholder">
                  <strong>{receiptName || "Receipt image placeholder"}</strong>
                  <span>Place the uploaded receipt photo here for review and OCR later.</span>
                </div>

                <div className="form-grid">
                  <label>
                    Bill title
                    <input value={billTitle} onChange={(event) => setBillTitle(event.target.value)} />
                  </label>
                  <label>
                    Merchant
                    <input value={merchant} onChange={(event) => setMerchant(event.target.value)} />
                  </label>
                  <label>
                    Currency
                    <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                      <option>MYR</option>
                      <option>USD</option>
                      <option>SGD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                  </label>
                  <label>
                    Paid by
                    <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
                      {participants.map((participant) => (
                        <option key={participant.id}>{participant.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </section>

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
                />
                <button type="button" onClick={addParticipant}>
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
                  </article>
                ))}
              </div>
            </section>

            <section className="panel" id="items">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Items</span>
                  <h2>Receipt items</h2>
                </div>
                <div className="segmented">
                  <button
                    type="button"
                    className={splitMode === "equal" ? "active" : ""}
                    onClick={() => setSplitMode("equal")}
                  >
                    Equal
                  </button>
                  <button
                    type="button"
                    className={splitMode === "itemized" ? "active" : ""}
                    onClick={() => setSplitMode("itemized")}
                  >
                    Itemized
                  </button>
                </div>
              </div>

              <div className="inline-form">
                <input
                  placeholder="Item name"
                  value={itemName}
                  aria-invalid={itemError ? "true" : "false"}
                  onChange={(event) => {
                    setItemName(event.target.value);
                    if (itemError) setItemError("");
                  }}
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
                />
                <button type="button" onClick={addItem}>
                  Add item
                </button>
              </div>
              {itemError ? <p className="field-error">{itemError}</p> : null}

              <div className="item-list">
                {items.map((item) => (
                  <article className="item-row" key={item.id}>
                    <div className="item-main">
                      <strong>{item.name}</strong>
                      <span>{formatMoney(item.amount)}</span>
                    </div>
                    <div className="assignment-grid">
                      {participants.map((participant) => (
                        <label key={participant.id} className="assignment-chip">
                          <input
                            type="checkbox"
                            checked={item.assignedTo.includes(participant.id)}
                            disabled={splitMode === "equal"}
                            onChange={() => toggleAssignment(item.id, participant.id)}
                          />
                          {participant.name}
                        </label>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
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
                <strong>{formatMoney(billTotal)}</strong>
              </div>

              <div className="adjustments">
                <label>
                  Tax
                  <input type="number" step="0.01" value={tax} onChange={(event) => setTax(Number(event.target.value))} />
                </label>
                <label>
                  Service
                  <input type="number" step="0.01" value={service} onChange={(event) => setService(Number(event.target.value))} />
                </label>
                <label>
                  Discount
                  <input type="number" step="0.01" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
                </label>
              </div>

              <div className="rounding-box">
                <span>Rounding</span>
                <div className="segmented">
                  <button type="button" className={roundingMode === "exact" ? "active" : ""} onClick={() => setRoundingMode("exact")}>
                    Exact
                  </button>
                  <button type="button" className={roundingMode === "down" ? "active" : ""} onClick={() => setRoundingMode("down")}>
                    Down
                  </button>
                  <button type="button" className={roundingMode === "up" ? "active" : ""} onClick={() => setRoundingMode("up")}>
                    Up
                  </button>
                </div>
                <small>Difference: {formatMoney(roundingDifference)}</small>
              </div>

              {unassignedItems.length > 0 && splitMode === "itemized" ? (
                <div className="warning">
                  {unassignedItems.length} item(s) unassigned. Assign before finalizing.
                </div>
              ) : null}

              <div className="results-list">
                {splitResults.map((result) => (
                  <article key={result.id}>
                    <div>
                      <strong>{result.name}</strong>
                      <span>
                        Items {formatMoney(result.itemShare)} - Tax {formatMoney(result.taxShare)} - Service {formatMoney(result.serviceShare)}
                      </span>
                    </div>
                    <b>{formatMoney(result.rounded)}</b>
                    <select
                      value={result.status}
                      onChange={(event) => updateStatus(result.id, event.target.value as SettlementStatus)}
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
