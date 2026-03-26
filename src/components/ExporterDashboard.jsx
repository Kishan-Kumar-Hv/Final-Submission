import { useState } from "react";

import Sidebar from "./Sidebar.jsx";
import { Empty, StatCard } from "./UI.jsx";
import { EXPORT_MARKETS, getExportMarketGroup, inferCropMeta } from "../data/constants.js";
import { fmtP, uid } from "../utils/helpers.js";
import { pick, tCrop } from "../i18n.js";

function badgeStyle(background, color, border) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: 999,
    background,
    color,
    border,
    fontSize: 11,
    fontWeight: 800,
  };
}

export default function ExporterDashboard({
  user,
  exportListings,
  exportRequests,
  onPostExportListing,
  onPlaceExportBid,
  onAcceptExportBid,
  onPostExportRequest,
  onAcceptExportRequest,
  toast,
  addActivity,
  lang,
}) {
  const isIndiaDesk = user.exportAccess === "india";
  const accessibleMarkets = Array.isArray(user.marketAccess) && user.marketAccess.length
    ? user.marketAccess
    : (user.country ? [user.country] : EXPORT_MARKETS);

  const [view, setView] = useState(isIndiaDesk ? "supply" : "market");
  const [listingDraft, setListingDraft] = useState({
    cropName: "",
    targetMarket: EXPORT_MARKETS[0],
    quantity: "",
    askingPrice: "",
    quality: "",
    packaging: "",
    notes: "",
  });
  const [requestDraft, setRequestDraft] = useState({
    cropName: "",
    targetMarket: accessibleMarkets[0] || EXPORT_MARKETS[0],
    quantity: "",
    targetPrice: "",
    quality: "",
    notes: "",
  });
  const [bidDrafts, setBidDrafts] = useState({});
  const [responseDrafts, setResponseDrafts] = useState({});

  const listingOrder = { open: 0, accepted: 1 };
  const requestOrder = { open: 0, accepted: 1 };

  const myListings = [...exportListings.filter((item) => item.sellerId === user.id)]
    .sort((a, b) => {
      const rankDiff = (listingOrder[a.status] ?? 9) - (listingOrder[b.status] ?? 9);
      if (rankDiff !== 0) return rankDiff;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  const visibleListings = [...exportListings.filter((item) => item.status === "open" && accessibleMarkets.includes(item.targetMarket))]
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const openForeignRequests = [...exportRequests.filter((item) => item.status === "open")]
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const myRequests = [...exportRequests.filter((item) => item.buyerId === user.id)]
    .sort((a, b) => {
      const rankDiff = (requestOrder[a.status] ?? 9) - (requestOrder[b.status] ?? 9);
      if (rankDiff !== 0) return rankDiff;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });

  const myAcceptedListingDeals = myListings.filter((item) => item.status === "accepted");
  const myAcceptedRequestDeals = exportRequests.filter((item) => item.acceptedResponse?.sellerId === user.id);
  const visibleAcceptedDeals = exportListings.filter((item) => item.acceptedBid?.buyerId === user.id);
  const requestAcceptedDeals = myRequests.filter((item) => item.status === "accepted");
  const acceptedDealCount = isIndiaDesk
    ? myAcceptedListingDeals.length + myAcceptedRequestDeals.length
    : visibleAcceptedDeals.length + requestAcceptedDeals.length;
  const liveBidCount = myListings.reduce((sum, item) => sum + (item.bids?.length || 0), 0);
  const openListingCount = myListings.filter((item) => item.status === "open").length;
  const openRequestCount = myRequests.filter((item) => item.status === "open").length;
  const responseableRequestCount = openForeignRequests.length;

  const navItems = isIndiaDesk
    ? [
        { k: "supply", i: "🌍", l: pick(lang, "Export Supply", "ರಫ್ತು ಪೂರೈಕೆ"), b: openListingCount || null },
        { k: "requests", i: "🧾", l: pick(lang, "Foreign Requests", "ವಿದೇಶಿ ಬೇಡಿಕೆಗಳು"), b: responseableRequestCount || null },
        { k: "deals", i: "🤝", l: pick(lang, "Accepted Deals", "ಅಂಗೀಕೃತ ಒಪ್ಪಂದಗಳು"), b: acceptedDealCount || null },
      ]
    : [
        { k: "market", i: "📦", l: pick(lang, "India Supply Board", "ಭಾರತ ಪೂರೈಕೆ ಫಲಕ") },
        { k: "needs", i: "🧾", l: pick(lang, "Request Crops", "ಬೆಳೆ ಬೇಡಿಕೆ"), b: openRequestCount || null },
        { k: "deals", i: "🤝", l: pick(lang, "My Deals", "ನನ್ನ ಒಪ್ಪಂದಗಳು"), b: acceptedDealCount || null },
      ];

  function updateListingDraft(patch) {
    setListingDraft((current) => ({ ...current, ...patch }));
  }

  function updateRequestDraft(patch) {
    setRequestDraft((current) => ({ ...current, ...patch }));
  }

  function updateBidDraft(listingId, patch) {
    setBidDrafts((current) => ({
      ...current,
      [listingId]: {
        ...(current[listingId] || {}),
        ...patch,
      },
    }));
  }

  function updateResponseDraft(requestId, patch) {
    setResponseDrafts((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] || {}),
        ...patch,
      },
    }));
  }

  function getBidDraft(listing) {
    const existingBid = (listing.bids || []).find((bid) => bid.buyerId === user.id);
    const draft = bidDrafts[listing.id] || {};
    return {
      amount: draft.amount ?? String(existingBid?.amount ?? listing.askingPrice ?? ""),
      quantity: draft.quantity ?? String(existingBid?.quantity ?? listing.quantity ?? ""),
      notes: draft.notes ?? String(existingBid?.notes ?? ""),
    };
  }

  function getResponseDraft(request) {
    const draft = responseDrafts[request.id] || {};
    return {
      amount: draft.amount ?? String(request.targetPrice ?? ""),
      quantity: draft.quantity ?? String(request.quantity ?? ""),
      notes: draft.notes ?? "",
    };
  }

  function handlePostListing() {
    const cropName = listingDraft.cropName.trim();
    const quantity = Number(listingDraft.quantity);
    const askingPrice = Number(listingDraft.askingPrice);
    const quality = listingDraft.quality.trim();
    const packaging = listingDraft.packaging.trim();
    const notes = listingDraft.notes.trim();

    if (!cropName) {
      toast({ msg: pick(lang, "Enter the crop name for the export lot.", "ರಫ್ತು ಲಾಟ್‌ಗಾಗಿ ಬೆಳೆ ಹೆಸರನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ msg: pick(lang, "Enter a valid export quantity in kg.", "ಮಾನ್ಯ ರಫ್ತು ಪ್ರಮಾಣವನ್ನು ಕೆಜಿಯಲ್ಲಿ ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      toast({ msg: pick(lang, "Enter a valid export asking price per kg.", "ಪ್ರತಿ ಕೆಜಿಗೆ ಮಾನ್ಯ ರಫ್ತು ಕೇಳುವ ಬೆಲೆಯನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }

    const meta = inferCropMeta(cropName) || {};
    const normalizedCropName = meta.c || cropName;

    onPostExportListing({
      id: uid(),
      kind: "listing",
      cropName: normalizedCropName,
      emoji: meta.e || "🌾",
      category: meta.cat || "",
      targetMarket: listingDraft.targetMarket,
      marketGroup: getExportMarketGroup(listingDraft.targetMarket),
      quantity,
      askingPrice,
      quality,
      packaging,
      notes,
      sellerId: user.id,
      sellerName: user.name,
      sellerCompany: user.companyName || user.name,
      sellerPhone: user.phone,
      clientId: user.clientId,
      sellerCountry: user.country || "India",
      status: "open",
      bids: [],
      createdAt: Date.now(),
    });

    setListingDraft({
      cropName: "",
      targetMarket: listingDraft.targetMarket,
      quantity: "",
      askingPrice: "",
      quality: "",
      packaging: "",
      notes: "",
    });

    toast({
      msg: pick(lang, `✅ Export listing opened for ${normalizedCropName} in ${listingDraft.targetMarket}.`, `✅ ${listingDraft.targetMarket}ಗೆ ${normalizedCropName} ರಫ್ತು ಲಿಸ್ಟಿಂಗ್ ತೆರೆಯಲಾಗಿದೆ.`),
      icon: "🌍",
      type: "gold",
    });
    addActivity({
      icon: "🌍",
      text: pick(
        lang,
        `You opened an export lot for ${normalizedCropName} to ${listingDraft.targetMarket}.`,
        `ನೀವು ${listingDraft.targetMarket}ಗೆ ${normalizedCropName} ರಫ್ತು ಲಾಟ್ ತೆರೆಯಿದ್ದೀರಿ.`
      ),
      ts: Date.now(),
    });
  }

  function handlePlaceBid(listing) {
    const draft = getBidDraft(listing);
    const amount = Number(draft.amount);
    const quantity = Number(draft.quantity);
    const notes = String(draft.notes || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ msg: pick(lang, "Enter a valid bid price per kg.", "ಪ್ರತಿ ಕೆಜಿಗೆ ಮಾನ್ಯ ಬಿಡ್ ಬೆಲೆಯನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ msg: pick(lang, "Enter a valid bid quantity in kg.", "ಮಾನ್ಯ ಬಿಡ್ ಪ್ರಮಾಣವನ್ನು ಕೆಜಿಯಲ್ಲಿ ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (quantity > Number(listing.quantity || 0)) {
      toast({ msg: pick(lang, `Bid quantity cannot exceed ${listing.quantity}kg.`, `ಬಿಡ್ ಪ್ರಮಾಣ ${listing.quantity}ಕೆಜಿಗಿಂತ ಹೆಚ್ಚಾಗಬಾರದು.`), icon: "⚠️" });
      return;
    }

    const existingBid = (listing.bids || []).find((bid) => bid.buyerId === user.id);
    onPlaceExportBid(listing.id, {
      id: existingBid?.id || uid(),
      buyerId: user.id,
      buyerName: user.name,
      buyerCompany: user.companyName || user.name,
      buyerPhone: user.phone,
      clientId: user.clientId,
      country: user.country,
      amount,
      quantity,
      notes,
      createdAt: Date.now(),
    });

    toast({
      msg: pick(lang, `✅ Export bid sent for ${tCrop(listing.cropName, lang)} at ${fmtP(amount)}/kg.`, `✅ ${tCrop(listing.cropName, lang)}ಗಾಗಿ ${fmtP(amount)}/ಕೆಜಿ ರಫ್ತು ಬಿಡ್ ಕಳುಹಿಸಲಾಗಿದೆ.`),
      icon: "💰",
      type: "gold",
    });
    addActivity({
      icon: "💰",
      text: pick(
        lang,
        `You bid ${fmtP(amount)}/kg for ${quantity}kg of ${tCrop(listing.cropName, lang)}.`,
        `ನೀವು ${tCrop(listing.cropName, lang)}ಗಾಗಿ ${quantity}ಕೆಜಿಗೆ ${fmtP(amount)}/ಕೆಜಿ ಬಿಡ್ ಮಾಡಿದ್ದೀರಿ.`
      ),
      ts: Date.now(),
    });
  }

  function handleAcceptBid(listing, bid) {
    onAcceptExportBid(listing.id, bid.id);
    toast({
      msg: pick(lang, `✅ Accepted ${bid.buyerCompany || bid.buyerName}'s bid for ${tCrop(listing.cropName, lang)}.`, `✅ ${tCrop(listing.cropName, lang)}ಗಾಗಿ ${bid.buyerCompany || bid.buyerName} ಅವರ ಬಿಡ್ ಅಂಗೀಕರಿಸಲಾಗಿದೆ.`),
      icon: "✅",
      type: "gold",
    });
    addActivity({
      icon: "✅",
      text: pick(
        lang,
        `You accepted a foreign bid on ${tCrop(listing.cropName, lang)} for ${listing.targetMarket}.`,
        `ನೀವು ${listing.targetMarket}ಗೆ ${tCrop(listing.cropName, lang)}ಗಾಗಿ ವಿದೇಶಿ ಬಿಡ್ ಅಂಗೀಕರಿಸಿದ್ದೀರಿ.`
      ),
      ts: Date.now(),
    });
  }

  function handlePostRequest() {
    const cropName = requestDraft.cropName.trim();
    const quantity = Number(requestDraft.quantity);
    const targetPrice = Number(requestDraft.targetPrice);
    const quality = requestDraft.quality.trim();
    const notes = requestDraft.notes.trim();

    if (!cropName) {
      toast({ msg: pick(lang, "Enter the crop you want sourced from India.", "ಭಾರತದಿಂದ ಪಡೆಯಬೇಕಾದ ಬೆಳೆಯನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ msg: pick(lang, "Enter a valid requested quantity in kg.", "ಕೋರಿದ ಪ್ರಮಾಣವನ್ನು ಮಾನ್ಯ ಕೆಜಿಯಲ್ಲಿ ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      toast({ msg: pick(lang, "Enter a valid target price per kg.", "ಪ್ರತಿ ಕೆಜಿಗೆ ಮಾನ್ಯ ಗುರಿ ಬೆಲೆಯನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }

    const meta = inferCropMeta(cropName) || {};
    const normalizedCropName = meta.c || cropName;

    onPostExportRequest({
      id: uid(),
      kind: "request",
      cropName: normalizedCropName,
      emoji: meta.e || "🌾",
      category: meta.cat || "",
      targetMarket: requestDraft.targetMarket,
      marketGroup: getExportMarketGroup(requestDraft.targetMarket),
      quantity,
      targetPrice,
      quality,
      notes,
      buyerId: user.id,
      buyerName: user.name,
      buyerCompany: user.companyName || user.name,
      buyerPhone: user.phone,
      clientId: user.clientId,
      country: user.country,
      status: "open",
      createdAt: Date.now(),
    });

    setRequestDraft({
      cropName: "",
      targetMarket: requestDraft.targetMarket,
      quantity: "",
      targetPrice: "",
      quality: "",
      notes: "",
    });

    toast({
      msg: pick(lang, `✅ Crop request posted for ${normalizedCropName}.`, `✅ ${normalizedCropName}ಗಾಗಿ ಬೆಳೆ ಬೇಡಿಕೆ ಪೋಸ್ಟ್ ಮಾಡಲಾಗಿದೆ.`),
      icon: "🧾",
      type: "gold",
    });
    addActivity({
      icon: "🧾",
      text: pick(
        lang,
        `You requested ${normalizedCropName} from the India export desk.`,
        `ನೀವು ಭಾರತ ರಫ್ತು ಡೆಸ್ಕ್‌ನಿಂದ ${normalizedCropName} ಬೇಡಿಕೆ ಹಾಕಿದ್ದೀರಿ.`
      ),
      ts: Date.now(),
    });
  }

  function handleAcceptRequest(request) {
    const draft = getResponseDraft(request);
    const amount = Number(draft.amount);
    const quantity = Number(draft.quantity);
    const notes = String(draft.notes || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ msg: pick(lang, "Enter a valid quote per kg before accepting the request.", "ಬೇಡಿಕೆಯನ್ನು ಅಂಗೀಕರಿಸುವ ಮೊದಲು ಪ್ರತಿ ಕೆಜಿಗೆ ಮಾನ್ಯ ದರವನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ msg: pick(lang, "Enter a valid supply quantity in kg.", "ಪೂರೈಕೆ ಪ್ರಮಾಣವನ್ನು ಮಾನ್ಯ ಕೆಜಿಯಲ್ಲಿ ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }

    onAcceptExportRequest(request.id, {
      sellerId: user.id,
      sellerName: user.name,
      sellerCompany: user.companyName || user.name,
      sellerPhone: user.phone,
      clientId: user.clientId,
      amount,
      quantity,
      notes,
    });

    toast({
      msg: pick(lang, `✅ Accepted ${request.buyerCompany || request.buyerName}'s request for ${tCrop(request.cropName, lang)}.`, `✅ ${tCrop(request.cropName, lang)}ಗಾಗಿ ${request.buyerCompany || request.buyerName} ಅವರ ಬೇಡಿಕೆ ಅಂಗೀಕರಿಸಲಾಗಿದೆ.`),
      icon: "✅",
      type: "gold",
    });
    addActivity({
      icon: "✅",
      text: pick(
        lang,
        `You accepted a foreign demand request for ${tCrop(request.cropName, lang)}.`,
        `ನೀವು ${tCrop(request.cropName, lang)}ಗಾಗಿ ವಿದೇಶಿ ಬೇಡಿಕೆಯನ್ನು ಅಂಗೀಕರಿಸಿದ್ದೀರಿ.`
      ),
      ts: Date.now(),
    });
  }

  const dealItems = isIndiaDesk
    ? [
        ...myAcceptedListingDeals.map((item) => ({
          id: `${item.id}-listing`,
          icon: "🌍",
          title: `${tCrop(item.cropName, lang)} · ${item.targetMarket}`,
          sub: pick(lang, `Accepted ${item.acceptedBid?.buyerCompany || item.acceptedBid?.buyerName} at ${fmtP(item.acceptedBid?.amount || 0)}/kg`, `${item.acceptedBid?.buyerCompany || item.acceptedBid?.buyerName} ಅವರನ್ನು ${fmtP(item.acceptedBid?.amount || 0)}/ಕೆಜಿ ದರಕ್ಕೆ ಅಂಗೀಕರಿಸಲಾಗಿದೆ`),
        })),
        ...myAcceptedRequestDeals.map((item) => ({
          id: `${item.id}-request`,
          icon: "🧾",
          title: `${tCrop(item.cropName, lang)} · ${item.targetMarket}`,
          sub: pick(lang, `Quoted ${fmtP(item.acceptedResponse?.amount || 0)}/kg to ${item.buyerCompany || item.buyerName}`, `${item.buyerCompany || item.buyerName} ಅವರಿಗೆ ${fmtP(item.acceptedResponse?.amount || 0)}/ಕೆಜಿ ದರ ಕಳುಹಿಸಲಾಗಿದೆ`),
        })),
      ]
    : [
        ...visibleAcceptedDeals.map((item) => ({
          id: `${item.id}-listing`,
          icon: "📦",
          title: `${tCrop(item.cropName, lang)} · ${item.targetMarket}`,
          sub: pick(lang, `Bid accepted by ${item.sellerCompany || item.sellerName}`, `${item.sellerCompany || item.sellerName} ಅವರು ಬಿಡ್ ಅಂಗೀಕರಿಸಿದ್ದಾರೆ`),
        })),
        ...requestAcceptedDeals.map((item) => ({
          id: `${item.id}-request`,
          icon: "🧾",
          title: `${tCrop(item.cropName, lang)} · ${item.targetMarket}`,
          sub: pick(lang, `Request accepted by ${item.acceptedResponse?.sellerCompany || item.acceptedResponse?.sellerName} at ${fmtP(item.acceptedResponse?.amount || 0)}/kg`, `${item.acceptedResponse?.sellerCompany || item.acceptedResponse?.sellerName} ಅವರು ${fmtP(item.acceptedResponse?.amount || 0)}/ಕೆಜಿ ದರಕ್ಕೆ ಬೇಡಿಕೆ ಅಂಗೀಕರಿಸಿದ್ದಾರೆ`),
        })),
      ];

  return (
    <div className="rr-dashboard-shell" style={{ display: "flex", minHeight: "calc(100vh - 100px)" }}>
      <Sidebar user={user} view={view} setView={setView} navItems={navItems} lang={lang} />

      <main className="rr-dashboard-main" style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "calc(100vh - 100px)", background: "linear-gradient(180deg,#f5f3ff 0%, #fcfcff 35%, #ffffff 100%)" }}>
        <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%, #4338ca 48%, #6366f1 100%)", borderRadius: 24, padding: "24px 26px", color: "#fff", boxShadow: "0 18px 40px rgba(67,56,202,.18)", marginBottom: 22 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 999, padding: "6px 12px", fontSize: 11, fontWeight: 800, letterSpacing: .55 }}>
            🌍 {pick(lang, "Separate Exporting Interface", "ಪ್ರತ್ಯೇಕ ರಫ್ತು ಇಂಟರ್ಫೇಸ್")}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, marginTop: 16, lineHeight: 1.08 }}>
            {isIndiaDesk
              ? pick(lang, "India Export Supply For Gulf Nations & Singapore", "ಗಲ್ಫ್ ರಾಷ್ಟ್ರಗಳು ಮತ್ತು ಸಿಂಗಾಪುರ್‌ಗೆ ಭಾರತ ರಫ್ತು ಪೂರೈಕೆ")
              : pick(lang, "Foreign Demand Desk For Indian Crops", "ಭಾರತೀಯ ಬೆಳೆಗಳಿಗೆ ವಿದೇಶಿ ಬೇಡಿಕೆ ಡೆಸ್ಕ್")}
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,.86)", maxWidth: 760, marginTop: 10 }}>
            {isIndiaDesk
              ? pick(lang, "This portal is kept separate from farmer, wholesaler, and delivery operations. Open export lots for Gulf buyers and Singapore importers, or answer incoming crop requests from those markets.", "ಈ ಪೋರ್ಟಲ್ ರೈತ, ಸಗಟು ಮತ್ತು ವಿತರಣಾ ಕಾರ್ಯಾಚರಣೆಗಳಿಂದ ಪ್ರತ್ಯೇಕವಾಗಿದೆ. ಗಲ್ಫ್ ಮತ್ತು ಸಿಂಗಾಪುರ್ ಖರೀದಿದಾರರಿಗಾಗಿ ರಫ್ತು ಲಾಟ್ ತೆರೆಯಿರಿ ಅಥವಾ ಆ ಮಾರುಕಟ್ಟೆಗಳಿಂದ ಬರುವ ಬೆಳೆ ಬೇಡಿಕೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.")
              : pick(lang, "This exporting desk is independent from the domestic marketplace. Browse Indian supply opened for your market, place live bids, or post fresh demand requests for crops your buyers need next.", "ಈ ರಫ್ತು ಡೆಸ್ಕ್ ದೇಶೀಯ ಮಾರುಕಟ್ಟೆಯಿಂದ ಸ್ವತಂತ್ರವಾಗಿದೆ. ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆಗೆ ತೆರೆಯಲಾದ ಭಾರತೀಯ ಪೂರೈಕೆಯನ್ನು ನೋಡಿ, ಲೈವ್ ಬಿಡ್ ಮಾಡಿ ಅಥವಾ ನಿಮ್ಮ ಖರೀದಿದಾರರಿಗೆ ಬೇಕಾದ ಬೆಳೆಗಳಿಗೆ ಹೊಸ ಬೇಡಿಕೆ ಹಾಕಿ.")}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            {(isIndiaDesk ? EXPORT_MARKETS : accessibleMarkets).map((market) => (
              <span key={market} style={badgeStyle("rgba(255,255,255,.14)", "#fff", "1px solid rgba(255,255,255,.2)")}>
                {market} · {getExportMarketGroup(market)}
              </span>
            ))}
          </div>
        </div>

        {isIndiaDesk && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
            <StatCard icon="🌍" label={pick(lang, "Open Lots", "ತೆರೆದ ಲಾಟ್‌ಗಳು")} value={openListingCount} color="#4338ca" />
            <StatCard icon="💰" label={pick(lang, "Foreign Bids", "ವಿದೇಶಿ ಬಿಡ್‌ಗಳು")} value={liveBidCount} color="#c084fc" />
            <StatCard icon="🧾" label={pick(lang, "Open Requests", "ತೆರೆದ ಬೇಡಿಕೆಗಳು")} value={responseableRequestCount} color="#2563eb" />
            <StatCard icon="🤝" label={pick(lang, "Accepted Deals", "ಅಂಗೀಕೃತ ಒಪ್ಪಂದಗಳು")} value={acceptedDealCount} color="#16a34a" />
          </div>
        )}

        {!isIndiaDesk && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
            <StatCard icon="📦" label={pick(lang, "Visible Lots", "ಗೋಚರ ಲಾಟ್‌ಗಳು")} value={visibleListings.length} color="#4338ca" />
            <StatCard icon="🧾" label={pick(lang, "Open Requests", "ತೆರೆದ ಬೇಡಿಕೆಗಳು")} value={openRequestCount} color="#2563eb" />
            <StatCard icon="🤝" label={pick(lang, "Accepted Deals", "ಅಂಗೀಕೃತ ಒಪ್ಪಂದಗಳು")} value={acceptedDealCount} color="#16a34a" />
            <StatCard icon="🌍" label={pick(lang, "Your Markets", "ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆಗಳು")} value={accessibleMarkets.length} color="#c084fc" />
          </div>
        )}

        {isIndiaDesk && view === "supply" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 380px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
            <div style={{ background: "#fff", border: "1px solid #ddd6fe", borderRadius: 20, padding: 18, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: .55 }}>
                {pick(lang, "India Supply Desk", "ಭಾರತ ಪೂರೈಕೆ ಡೆಸ್ಕ್")}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 850, color: "var(--text)", marginTop: 8 }}>
                🌍 {pick(lang, "Open Export Crop Lot", "ರಫ್ತು ಬೆಳೆ ಲಾಟ್ ತೆರೆಯಿರಿ")}
              </h2>
              <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 10, lineHeight: 1.7 }}>
                {pick(lang, "Post a fresh crop lot only for export demand. This stays outside the farmer, wholesaler, and delivery boards.", "ರಫ್ತು ಬೇಡಿಕೆಗೆ ಮಾತ್ರ ಹೊಸ ಬೆಳೆ ಲಾಟ್ ಪೋಸ್ಟ್ ಮಾಡಿ. ಇದು ರೈತ, ಸಗಟು ಮತ್ತು ವಿತರಣಾ ಫಲಕಗಳ ಹೊರಗೆ ಪ್ರತ್ಯೇಕವಾಗಿರುತ್ತದೆ.")}
              </p>

              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <input
                  value={listingDraft.cropName}
                  onChange={(event) => updateListingDraft({ cropName: event.target.value })}
                  placeholder={pick(lang, "Crop name", "ಬೆಳೆ ಹೆಸರು")}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                />
                <select
                  value={listingDraft.targetMarket}
                  onChange={(event) => updateListingDraft({ targetMarket: event.target.value })}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                >
                  {EXPORT_MARKETS.map((market) => (
                    <option key={market} value={market}>{market}</option>
                  ))}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <input
                    type="number"
                    value={listingDraft.quantity}
                    onChange={(event) => updateListingDraft({ quantity: event.target.value })}
                    placeholder={pick(lang, "Qty (kg)", "ಪ್ರಮಾಣ (ಕೆಜಿ)")}
                    style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={listingDraft.askingPrice}
                    onChange={(event) => updateListingDraft({ askingPrice: event.target.value })}
                    placeholder={pick(lang, "Ask (₹/kg)", "ದರ (₹/ಕೆಜಿ)")}
                    style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
                <input
                  value={listingDraft.quality}
                  onChange={(event) => updateListingDraft({ quality: event.target.value })}
                  placeholder={pick(lang, "Quality / grade", "ಗುಣಮಟ್ಟ / ಗ್ರೇಡ್")}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                />
                <input
                  value={listingDraft.packaging}
                  onChange={(event) => updateListingDraft({ packaging: event.target.value })}
                  placeholder={pick(lang, "Packing style", "ಪ್ಯಾಕಿಂಗ್ ಶೈಲಿ")}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                />
                <textarea
                  rows={4}
                  value={listingDraft.notes}
                  onChange={(event) => updateListingDraft({ notes: event.target.value })}
                  placeholder={pick(lang, "Shipment notes, quality promise, loading window...", "ಶಿಪ್‌ಮೆಂಟ್ ಸೂಚನೆಗಳು, ಗುಣಮಟ್ಟ ಭರವಸೆ, ಲೋಡಿಂಗ್ ಸಮಯ...")}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }}
                />
                <button onClick={handlePostListing} style={{ background: "linear-gradient(135deg,#312e81,#4f46e5)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  🌍 {pick(lang, "Open Export Listing", "ರಫ್ತು ಲಿಸ್ಟಿಂಗ್ ತೆರೆಯಿರಿ")}
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: .55 }}>
                    {pick(lang, "Export Board", "ರಫ್ತು ಫಲಕ")}
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 850, color: "var(--text)", marginTop: 6 }}>
                    {pick(lang, "Your Lots & Foreign Bids", "ನಿಮ್ಮ ಲಾಟ್‌ಗಳು ಮತ್ತು ವಿದೇಶಿ ಬಿಡ್‌ಗಳು")}
                  </h2>
                </div>
                <div style={badgeStyle("#eef2ff", "#4338ca", "1px solid #c7d2fe")}>
                  💰 {pick(lang, `${liveBidCount} bid${liveBidCount === 1 ? "" : "s"}`, `${liveBidCount} ಬಿಡ್‌ಗಳು`)}
                </div>
              </div>

              {myListings.length === 0 ? (
                <Empty icon="🌍" title={pick(lang, "No export lots yet", "ಇನ್ನೂ ಯಾವುದೇ ರಫ್ತು ಲಾಟ್‌ಗಳಿಲ್ಲ")} sub={pick(lang, "Open a lot for Gulf or Singapore demand from the form on the left.", "ಎಡಬದಿಯ ಫಾರ್ಮ್‌ನಿಂದ ಗಲ್ಫ್ ಅಥವಾ ಸಿಂಗಾಪುರ್ ಬೇಡಿಕೆಗೆ ಲಾಟ್ ತೆರೆಯಿರಿ.")} />
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {myListings.map((listing) => (
                    <div key={listing.id} style={{ background: "#fff", border: "1px solid #ddd6fe", borderRadius: 18, padding: 18, boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 19, fontWeight: 850, color: "var(--text)" }}>{listing.emoji || "🌾"} {tCrop(listing.cropName, lang)}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{listing.targetMarket} · {getExportMarketGroup(listing.targetMarket)} · {listing.quantity}kg</div>
                        </div>
                        <div style={listing.status === "accepted" ? badgeStyle("#ecfdf5", "#15803d", "1px solid #86efac") : badgeStyle("#eef2ff", "#4338ca", "1px solid #c7d2fe")}>
                          {listing.status === "accepted" ? pick(lang, "Accepted", "ಅಂಗೀಕರಿಸಲಾಗಿದೆ") : pick(lang, "Open", "ತೆರೆದಿದೆ")}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 14 }}>
                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Ask Price", "ಕೇಳುವ ಬೆಲೆ")}</div>
                          <div style={{ fontSize: 15, fontWeight: 850, color: "#312e81", marginTop: 5 }}>{fmtP(listing.askingPrice)}/kg</div>
                        </div>
                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Quality", "ಗುಣಮಟ್ಟ")}</div>
                          <div style={{ fontSize: 15, fontWeight: 850, color: "var(--text)", marginTop: 5 }}>{listing.quality || pick(lang, "Standard", "ಪ್ರಮಾಣಿತ")}</div>
                        </div>
                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Packing", "ಪ್ಯಾಕಿಂಗ್")}</div>
                          <div style={{ fontSize: 15, fontWeight: 850, color: "var(--text)", marginTop: 5 }}>{listing.packaging || pick(lang, "To be confirmed", "ನಂತರ ದೃಢೀಕರಣ")}</div>
                        </div>
                      </div>

                      {listing.notes && (
                        <div style={{ marginTop: 12, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "var(--text2)", lineHeight: 1.65 }}>
                          📝 {listing.notes}
                        </div>
                      )}

                      {listing.status === "accepted" && listing.acceptedBid && (
                        <div style={{ marginTop: 12, background: "#ecfdf5", border: "1px solid #86efac", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
                          ✅ {pick(lang, `${listing.acceptedBid.buyerCompany || listing.acceptedBid.buyerName} accepted at ${fmtP(listing.acceptedBid.amount)}/kg for ${listing.acceptedBid.quantity}kg.`, `${listing.acceptedBid.buyerCompany || listing.acceptedBid.buyerName} ಅವರು ${fmtP(listing.acceptedBid.amount)}/ಕೆಜಿ ದರಕ್ಕೆ ${listing.acceptedBid.quantity}ಕೆಜಿಗೆ ಅಂಗೀಕರಿಸಿದ್ದಾರೆ.`)}
                        </div>
                      )}

                      {listing.status === "open" && (
                        <div style={{ marginTop: 14, borderTop: "1px solid #ede9fe", paddingTop: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#4338ca", marginBottom: 10 }}>
                            {pick(lang, "Incoming foreign bids", "ಒಳಬರುವ ವಿದೇಶಿ ಬಿಡ್‌ಗಳು")}
                          </div>
                          {(listing.bids || []).length === 0 ? (
                            <div style={{ fontSize: 12, color: "var(--text3)" }}>
                              {pick(lang, "No bids yet. Gulf and Singapore desks will see this immediately.", "ಇನ್ನೂ ಯಾವುದೇ ಬಿಡ್‌ಗಳಿಲ್ಲ. ಗಲ್ಫ್ ಮತ್ತು ಸಿಂಗಾಪುರ್ ಡೆಸ್ಕ್‌ಗಳು ಇದನ್ನು ತಕ್ಷಣ ನೋಡುತ್ತಾರೆ.")}
                            </div>
                          ) : (
                            <div style={{ display: "grid", gap: 10 }}>
                              {(listing.bids || [])
                                .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
                                .map((bid) => (
                                  <div key={bid.id} style={{ border: "1px solid #d9d6fe", borderRadius: 14, padding: "12px 14px", background: "#fafbff" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{bid.buyerCompany || bid.buyerName} · {bid.country}</div>
                                        <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 3 }}>🪪 {bid.clientId}</div>
                                      </div>
                                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <span style={badgeStyle("#eef2ff", "#4338ca", "1px solid #c7d2fe")}>{fmtP(bid.amount)}/kg</span>
                                        <span style={badgeStyle("#fff7ed", "#c2410c", "1px solid #fed7aa")}>{bid.quantity}kg</span>
                                      </div>
                                    </div>
                                    {bid.notes && <div style={{ marginTop: 8, fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>📝 {bid.notes}</div>}
                                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                                      <button onClick={() => handleAcceptBid(listing, bid)} style={{ background: "linear-gradient(135deg,#312e81,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                                        ✅ {pick(lang, "Accept Bid", "ಬಿಡ್ ಅಂಗೀಕರಿಸಿ")}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isIndiaDesk && view === "requests" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: .55 }}>
                {pick(lang, "Demand Requests", "ಬೇಡಿಕೆ ವಿನಂತಿಗಳು")}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 850, color: "var(--text)", marginTop: 6 }}>
                {pick(lang, "Foreign Buyers Asking For Crops", "ವಿದೇಶಿ ಖರೀದಿದಾರರ ಬೆಳೆ ಬೇಡಿಕೆಗಳು")}
              </h2>
            </div>

            {openForeignRequests.length === 0 ? (
              <Empty icon="🧾" title={pick(lang, "No foreign requests open", "ತೆರೆದ ವಿದೇಶಿ ಬೇಡಿಕೆಗಳಿಲ್ಲ")} sub={pick(lang, "When Gulf or Singapore desks request crops, they will appear here.", "ಗಲ್ಫ್ ಅಥವಾ ಸಿಂಗಾಪುರ್ ಡೆಸ್ಕ್‌ಗಳು ಬೆಳೆ ಬೇಡಿಕೆ ಹಾಕಿದಾಗ ಅವು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.")} />
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {openForeignRequests.map((request) => {
                  const responseDraft = getResponseDraft(request);
                  return (
                    <div key={request.id} style={{ background: "#fff", border: "1px solid #ddd6fe", borderRadius: 18, padding: 18, boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 19, fontWeight: 850, color: "var(--text)" }}>{request.emoji || "🌾"} {tCrop(request.cropName, lang)}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{request.buyerCompany || request.buyerName} · {request.targetMarket} · {request.quantity}kg</div>
                        </div>
                        <div style={badgeStyle("#eff6ff", "#1d4ed8", "1px solid #bfdbfe")}>
                          {fmtP(request.targetPrice)}/kg
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Market Group", "ಮಾರುಕಟ್ಟೆ ಗುಂಪು")}</div>
                          <div style={{ fontSize: 15, fontWeight: 850, color: "var(--text)", marginTop: 5 }}>{getExportMarketGroup(request.targetMarket)}</div>
                        </div>
                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Quality Need", "ಗುಣಮಟ್ಟ ಅಗತ್ಯ")}</div>
                          <div style={{ fontSize: 15, fontWeight: 850, color: "var(--text)", marginTop: 5 }}>{request.quality || pick(lang, "Open spec", "ಮುಕ್ತ ವಿವರಣೆ")}</div>
                        </div>
                      </div>

                      {request.notes && (
                        <div style={{ marginTop: 12, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "var(--text2)", lineHeight: 1.65 }}>
                          📝 {request.notes}
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 14 }}>
                        <input
                          type="number"
                          step="0.5"
                          value={responseDraft.amount}
                          onChange={(event) => updateResponseDraft(request.id, { amount: event.target.value })}
                          placeholder={pick(lang, "Quote (₹/kg)", "ದರ (₹/ಕೆಜಿ)")}
                          style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                        />
                        <input
                          type="number"
                          value={responseDraft.quantity}
                          onChange={(event) => updateResponseDraft(request.id, { quantity: event.target.value })}
                          placeholder={pick(lang, "Supply qty (kg)", "ಪೂರೈಕೆ ಪ್ರಮಾಣ (ಕೆಜಿ)")}
                          style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={responseDraft.notes}
                        onChange={(event) => updateResponseDraft(request.id, { notes: event.target.value })}
                        placeholder={pick(lang, "Answer with loading plan, grade, or lead time...", "ಲೋಡಿಂಗ್ ಯೋಜನೆ, ಗ್ರೇಡ್ ಅಥವಾ ಸಮಯದೊಂದಿಗೆ ಉತ್ತರಿಸಿ...")}
                        style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", marginTop: 10 }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                        <button onClick={() => handleAcceptRequest(request)} style={{ background: "linear-gradient(135deg,#312e81,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                          ✅ {pick(lang, "Accept & Quote", "ಅಂಗೀಕರಿಸಿ ಮತ್ತು ದರ ನೀಡಿ")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isIndiaDesk && view === "market" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: .55 }}>
                {pick(lang, "India Supply Board", "ಭಾರತ ಪೂರೈಕೆ ಫಲಕ")}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 850, color: "var(--text)", marginTop: 6 }}>
                {pick(lang, "Bid On Export Lots Opened From India", "ಭಾರತದಿಂದ ತೆರೆಯಲಾದ ರಫ್ತು ಲಾಟ್‌ಗಳ ಮೇಲೆ ಬಿಡ್ ಮಾಡಿ")}
              </h2>
            </div>

            {visibleListings.length === 0 ? (
              <Empty icon="📦" title={pick(lang, "No export lots in your market", "ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ರಫ್ತು ಲಾಟ್‌ಗಳಿಲ್ಲ")} sub={pick(lang, "When India export desks open lots for your market, they will show here.", "ಭಾರತ ರಫ್ತು ಡೆಸ್ಕ್‌ಗಳು ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆಗೆ ಲಾಟ್ ತೆರೆಯುವಾಗ ಅವು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.")} />
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {visibleListings.map((listing) => {
                  const draft = getBidDraft(listing);
                  const myBid = (listing.bids || []).find((bid) => bid.buyerId === user.id);
                  return (
                    <div key={listing.id} style={{ background: "#fff", border: "1px solid #ddd6fe", borderRadius: 18, padding: 18, boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 19, fontWeight: 850, color: "var(--text)" }}>{listing.emoji || "🌾"} {tCrop(listing.cropName, lang)}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{listing.sellerCompany || listing.sellerName} · {listing.targetMarket} · {listing.quantity}kg</div>
                        </div>
                        <div style={badgeStyle("#eef2ff", "#4338ca", "1px solid #c7d2fe")}>
                          {fmtP(listing.askingPrice)}/kg
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Quality", "ಗುಣಮಟ್ಟ")}</div>
                          <div style={{ fontSize: 15, fontWeight: 850, color: "var(--text)", marginTop: 5 }}>{listing.quality || pick(lang, "Standard", "ಪ್ರಮಾಣಿತ")}</div>
                        </div>
                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Packing", "ಪ್ಯಾಕಿಂಗ್")}</div>
                          <div style={{ fontSize: 15, fontWeight: 850, color: "var(--text)", marginTop: 5 }}>{listing.packaging || pick(lang, "To be confirmed", "ನಂತರ ದೃಢೀಕರಣ")}</div>
                        </div>
                      </div>

                      {listing.notes && (
                        <div style={{ marginTop: 12, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "var(--text2)", lineHeight: 1.65 }}>
                          📝 {listing.notes}
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginTop: 14 }}>
                        <input
                          type="number"
                          step="0.5"
                          value={draft.amount}
                          onChange={(event) => updateBidDraft(listing.id, { amount: event.target.value })}
                          placeholder={pick(lang, "Bid (₹/kg)", "ಬಿಡ್ (₹/ಕೆಜಿ)")}
                          style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                        />
                        <input
                          type="number"
                          value={draft.quantity}
                          onChange={(event) => updateBidDraft(listing.id, { quantity: event.target.value })}
                          placeholder={pick(lang, "Qty (kg)", "ಪ್ರಮಾಣ (ಕೆಜಿ)")}
                          style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={draft.notes}
                        onChange={(event) => updateBidDraft(listing.id, { notes: event.target.value })}
                        placeholder={pick(lang, "Bid notes, arrival plan, or quality expectations...", "ಬಿಡ್ ಸೂಚನೆಗಳು, ಆಗಮನ ಯೋಜನೆ ಅಥವಾ ಗುಣಮಟ್ಟ ನಿರೀಕ್ಷೆಗಳು...")}
                        style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", marginTop: 10 }}
                      />

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>
                          {myBid
                            ? pick(lang, `Your live bid: ${fmtP(myBid.amount)}/kg for ${myBid.quantity}kg`, `ನಿಮ್ಮ ಲೈವ್ ಬಿಡ್: ${fmtP(myBid.amount)}/ಕೆಜಿ ದರಕ್ಕೆ ${myBid.quantity}ಕೆಜಿ`)
                            : pick(lang, "This board is only for export bids, separate from domestic wholesale.", "ಈ ಫಲಕವು ದೇಶೀಯ ಸಗಟಿನಿಂದ ಪ್ರತ್ಯೇಕವಾದ ರಫ್ತು ಬಿಡ್‌ಗಳಿಗೆ ಮಾತ್ರವಾಗಿದೆ.")}
                        </div>
                        <button onClick={() => handlePlaceBid(listing)} style={{ background: "linear-gradient(135deg,#312e81,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                          💰 {myBid ? pick(lang, "Update Bid", "ಬಿಡ್ ನವೀಕರಿಸಿ") : pick(lang, "Place Bid", "ಬಿಡ್ ಮಾಡಿ")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isIndiaDesk && view === "needs" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 380px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
            <div style={{ background: "#fff", border: "1px solid #ddd6fe", borderRadius: 20, padding: 18, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: .55 }}>
                {pick(lang, "Foreign Demand Desk", "ವಿದೇಶಿ ಬೇಡಿಕೆ ಡೆಸ್ಕ್")}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 850, color: "var(--text)", marginTop: 8 }}>
                🧾 {pick(lang, "Request A Crop From India", "ಭಾರತದಿಂದ ಬೆಳೆ ಬೇಡಿಕೆ ಹಾಕಿ")}
              </h2>
              <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 10, lineHeight: 1.7 }}>
                {pick(lang, "Post exactly what your market needs next. India export desks will answer with quantity and quote.", "ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆಗೆ ಮುಂದಿನದಾಗಿ ಬೇಕಾದುದನ್ನು ನಿಖರವಾಗಿ ಪೋಸ್ಟ್ ಮಾಡಿ. ಭಾರತ ರಫ್ತು ಡೆಸ್ಕ್‌ಗಳು ಪ್ರಮಾಣ ಮತ್ತು ದರದೊಂದಿಗೆ ಉತ್ತರಿಸುತ್ತವೆ.")}
              </p>

              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <input
                  value={requestDraft.cropName}
                  onChange={(event) => updateRequestDraft({ cropName: event.target.value })}
                  placeholder={pick(lang, "Crop name", "ಬೆಳೆ ಹೆಸರು")}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                />
                <select
                  value={requestDraft.targetMarket}
                  onChange={(event) => updateRequestDraft({ targetMarket: event.target.value })}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                >
                  {accessibleMarkets.map((market) => (
                    <option key={market} value={market}>{market}</option>
                  ))}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <input
                    type="number"
                    value={requestDraft.quantity}
                    onChange={(event) => updateRequestDraft({ quantity: event.target.value })}
                    placeholder={pick(lang, "Qty (kg)", "ಪ್ರಮಾಣ (ಕೆಜಿ)")}
                    style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={requestDraft.targetPrice}
                    onChange={(event) => updateRequestDraft({ targetPrice: event.target.value })}
                    placeholder={pick(lang, "Target (₹/kg)", "ಗುರಿ (₹/ಕೆಜಿ)")}
                    style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
                <input
                  value={requestDraft.quality}
                  onChange={(event) => updateRequestDraft({ quality: event.target.value })}
                  placeholder={pick(lang, "Preferred quality / grade", "ಬಯಸಿದ ಗುಣಮಟ್ಟ / ಗ್ರೇಡ್")}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                />
                <textarea
                  rows={4}
                  value={requestDraft.notes}
                  onChange={(event) => updateRequestDraft({ notes: event.target.value })}
                  placeholder={pick(lang, "Buyer notes, packing, shelf-life, or port timing...", "ಖರೀದಿದಾರರ ಸೂಚನೆಗಳು, ಪ್ಯಾಕಿಂಗ್, ಶೆಲ್ಫ್-ಲೈಫ್ ಅಥವಾ ಪೋರ್ಟ್ ಸಮಯ...")}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1.5px solid #d8d4fe", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }}
                />
                <button onClick={handlePostRequest} style={{ background: "linear-gradient(135deg,#312e81,#4f46e5)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  🧾 {pick(lang, "Post Crop Request", "ಬೆಳೆ ಬೇಡಿಕೆ ಪೋಸ್ಟ್ ಮಾಡಿ")}
                </button>
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: .55 }}>
                  {pick(lang, "Your Requests", "ನಿಮ್ಮ ಬೇಡಿಕೆಗಳು")}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 850, color: "var(--text)", marginTop: 6 }}>
                  {pick(lang, "Requests Sent To India Export Desks", "ಭಾರತ ರಫ್ತು ಡೆಸ್ಕ್‌ಗಳಿಗೆ ಕಳುಹಿಸಿದ ಬೇಡಿಕೆಗಳು")}
                </h2>
              </div>

              {myRequests.length === 0 ? (
                <Empty icon="🧾" title={pick(lang, "No crop requests yet", "ಇನ್ನೂ ಬೆಳೆ ಬೇಡಿಕೆಗಳಿಲ್ಲ")} sub={pick(lang, "Post a request from the form on the left.", "ಎಡಬದಿಯ ಫಾರ್ಮ್‌ನಿಂದ ಬೇಡಿಕೆ ಪೋಸ್ಟ್ ಮಾಡಿ.")} />
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {myRequests.map((request) => (
                    <div key={request.id} style={{ background: "#fff", border: "1px solid #ddd6fe", borderRadius: 18, padding: 18, boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 19, fontWeight: 850, color: "var(--text)" }}>{request.emoji || "🌾"} {tCrop(request.cropName, lang)}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{request.targetMarket} · {request.quantity}kg</div>
                        </div>
                        <div style={request.status === "accepted" ? badgeStyle("#ecfdf5", "#15803d", "1px solid #86efac") : badgeStyle("#eff6ff", "#1d4ed8", "1px solid #bfdbfe")}>
                          {request.status === "accepted" ? pick(lang, "Answered", "ಉತ್ತರಿಸಲಾಗಿದೆ") : pick(lang, "Open", "ತೆರೆದಿದೆ")}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Target Price", "ಗುರಿ ಬೆಲೆ")}</div>
                          <div style={{ fontSize: 15, fontWeight: 850, color: "var(--text)", marginTop: 5 }}>{fmtP(request.targetPrice)}/kg</div>
                        </div>
                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Quality", "ಗುಣಮಟ್ಟ")}</div>
                          <div style={{ fontSize: 15, fontWeight: 850, color: "var(--text)", marginTop: 5 }}>{request.quality || pick(lang, "Open spec", "ಮುಕ್ತ ವಿವರಣೆ")}</div>
                        </div>
                      </div>

                      {request.notes && (
                        <div style={{ marginTop: 12, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "var(--text2)", lineHeight: 1.65 }}>
                          📝 {request.notes}
                        </div>
                      )}

                      {request.status === "accepted" && request.acceptedResponse && (
                        <div style={{ marginTop: 12, background: "#ecfdf5", border: "1px solid #86efac", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
                          ✅ {pick(lang, `${request.acceptedResponse.sellerCompany || request.acceptedResponse.sellerName} quoted ${fmtP(request.acceptedResponse.amount)}/kg for ${request.acceptedResponse.quantity}kg.`, `${request.acceptedResponse.sellerCompany || request.acceptedResponse.sellerName} ಅವರು ${request.acceptedResponse.quantity}ಕೆಜಿಗೆ ${fmtP(request.acceptedResponse.amount)}/ಕೆಜಿ ದರ ನೀಡಿದ್ದಾರೆ.`)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === "deals" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: .55 }}>
                {pick(lang, "Accepted Deals", "ಅಂಗೀಕೃತ ಒಪ್ಪಂದಗಳು")}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 850, color: "var(--text)", marginTop: 6 }}>
                {pick(lang, "Completed Matches Inside Exporting", "ರಫ್ತು ಪೋರ್ಟಲ್‌ನೊಳಗಿನ ಪೂರ್ಣಗೊಂಡ ಹೊಂದಾಣಿಕೆಗಳು")}
              </h2>
            </div>

            {dealItems.length === 0 ? (
              <Empty icon="🤝" title={pick(lang, "No accepted export deals yet", "ಇನ್ನೂ ಅಂಗೀಕೃತ ರಫ್ತು ಒಪ್ಪಂದಗಳಿಲ್ಲ")} sub={pick(lang, "Accepted bids and answered crop requests will show here.", "ಅಂಗೀಕರಿಸಿದ ಬಿಡ್‌ಗಳು ಮತ್ತು ಉತ್ತರಿಸಿದ ಬೆಳೆ ಬೇಡಿಕೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.")} />
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {dealItems.map((item) => (
                  <div key={item.id} style={{ background: "#fff", border: "1px solid #ddd6fe", borderRadius: 16, padding: "14px 16px", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "#eef2ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 850, color: "var(--text)" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 5, lineHeight: 1.6 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
