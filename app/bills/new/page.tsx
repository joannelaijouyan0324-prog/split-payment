"use client";

import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { createBillDraft } from "@/lib/bill-drafts";
import { getLocalUser } from "@/lib/local-user";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NewBillStartPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [fileName, setFileName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!getLocalUser()) {
      router.replace("/login?next=/bills/new");
    }
  }, [router]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function openCamera() {
    const owner = getLocalUser();
    if (!owner) {
      router.push("/login?next=/bills/new");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not available in this browser. Use Upload File instead.");
      return;
    }

    setError("");
    setIsCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1600 },
          height: { ideal: 2200 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (caughtError) {
      setIsCameraOpen(false);
      setError(caughtError instanceof Error ? caughtError.message : "Could not open camera.");
    }
  }

  async function scanCameraReceipt() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setError("Camera is still starting. Try again in a moment.");
      return;
    }

    setError("");
    setIsScanning(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not capture camera frame.");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Could not create receipt photo.");

      const file = new File([blob], `scanned-receipt-${Date.now()}.jpg`, { type: "image/jpeg" });
      const bill = await createBillDraft({
        owner: getLocalUser()!,
        source: "scan",
        receiptFile: file,
      });

      if (bill.parseStatus !== "ocr") {
        setError(bill.parseError || "Scan failed. Please scan again.");
        return;
      }

      if (bill.ocrText) {
        window.localStorage.setItem(`jsplit-ocr-${bill.id}`, bill.ocrText);
      }

      stopCamera();
      router.push(`/bills/new/review?billId=${bill.id}&source=scan&scan=ocr`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Scan failed. Please scan again.");
    } finally {
      setIsScanning(false);
    }
  }

  async function startBill(source: "scan" | "upload" | "manual") {
    const owner = getLocalUser();
    if (!owner) {
      router.push("/login?next=/bills/new");
      return;
    }

    if (source === "upload" && !receiptFile) {
      setError("Choose a receipt image or PDF first.");
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const bill = await createBillDraft({
        owner,
        source,
        receiptFile: source === "upload" ? receiptFile : null,
      });
      if (bill.ocrText) {
        window.localStorage.setItem(`jsplit-ocr-${bill.id}`, bill.ocrText);
      }
      const parseParam =
        bill.parseStatus === "ocr"
          ? "&scan=ocr"
          : bill.parseStatus === "failed"
            ? `&scan=failed&scanError=${encodeURIComponent(bill.parseError ?? "Receipt OCR failed.")}`
            : "";
      router.push(`/bills/new/review?billId=${bill.id}&source=${source}${parseParam}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create this bill.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="app-shell">
      <AppNav active="new" subtitle="Start a new split" />

      <section className="workspace capture-workspace">
        <header className="capture-topbar">
          <Link className="back-link" href="/">
            Back
          </Link>
          <h1>New Bill</h1>
        </header>

        <section className="capture-card">
          {isCameraOpen ? (
            <div className="camera-scanner">
              <div className="camera-frame">
                <video ref={videoRef} playsInline muted />
                <div className="scan-guide" aria-hidden="true" />
              </div>
              <div className="camera-actions">
                <button type="button" onClick={() => {
                  stopCamera();
                  setIsCameraOpen(false);
                  setError("");
                }} disabled={isScanning}>
                  Cancel
                </button>
                <button className="primary" type="button" onClick={scanCameraReceipt} disabled={isScanning}>
                  {isScanning ? "Scanning..." : "Scan"}
                </button>
              </div>
            </div>
          ) : (
            <div className="capture-actions">
              <button
                className="capture-action primary-capture"
                disabled={isCreating}
                type="button"
                onClick={openCamera}
              >
                <span>Scan Receipt</span>
                <small>Open camera, then OCR and Gemini scan immediately.</small>
              </button>

              <label className="capture-action">
                <span>Upload File</span>
                <small>{fileName || "Choose an image or PDF receipt."}</small>
                <input
                  className="hidden-file-input"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setReceiptFile(nextFile);
                    setFileName(nextFile?.name ?? "");
                    if (error) setError("");
                  }}
                />
              </label>

              <button
                className="capture-action"
                disabled={isCreating}
                type="button"
                onClick={() => startBill("manual")}
              >
                <span>Enter Manually</span>
                <small>Create items yourself if there is no receipt image.</small>
              </button>
            </div>
          )}

          {error ? <p className="field-error capture-error">{error}</p> : null}

          {fileName ? (
            <button
              className="link-button primary-link continue-link"
              disabled={isCreating}
              type="button"
              onClick={() => startBill("upload")}
            >
              {isCreating ? "Creating..." : "Continue to receipt review"}
            </button>
          ) : null}
        </section>
      </section>
    </main>
  );
}
