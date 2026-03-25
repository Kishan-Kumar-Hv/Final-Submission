import { pick, tDistrict } from "../i18n.js";

export default function HomePage({ setPage, lang }) {

  // ── Unsplash farm photos (free, no attribution needed for demo) ──
  const HERO_IMG    = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=80";
  const FARM_IMG1   = "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80";
  const FARM_IMG2   = "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80";
  const FARM_IMG3   = "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=800&q=80";
  const FARMER_IMG  = "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=700&q=80";
  const BODY_FONT = lang === "kn" ? "'Noto Sans Kannada', sans-serif" : "'Plus Jakarta Sans', sans-serif";
  const TITLE_FONT = lang === "kn" ? "'Noto Sans Kannada', sans-serif" : "'Playfair Display', serif";

  const heroStats = lang === "kn"
    ? [["₹0","ಕಮಿಷನ್ ಇಲ್ಲ"],["35L+","ಕರ್ನಾಟಕದ ರೈತರು"],["18+","ವ್ಯಾಪ್ತಿಯ ಜಿಲ್ಲೆಗಳು"],["24/7","ಲೈವ್ ಹರಾಜುಗಳು"]]
    : [["₹0","Commission charged"],["35L+","Karnataka farmers"],["18+","Districts covered"],["24/7","Live auctions"]];
  const trustItems = lang === "kn"
    ? [["✅","ನೋಂದಣಿ ಶುಲ್ಕ ಇಲ್ಲ"],["🔒","ಸುರಕ್ಷಿತ ಮತ್ತು ಖಾಸಗಿ ಲಿಸ್ಟಿಂಗ್‌ಗಳು"],["📞","ರೈತರ ನೇರ ಸಂಪರ್ಕ"],["📊","ಲೈವ್ ಎಪಿಎಂಸಿ ದರಗಳು"],["🚛","ಫಾರ್ಮ್ ಗೇಟ್ ಪಿಕಪ್"],["🏆","ಕರ್ನಾಟಕ ರೈತರಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ"]]
    : [["✅","Zero registration fee"],["🔒","Secure & private listings"],["📞","Direct farmer contact"],["📊","Live APMC mandi rates"],["🚛","Farm gate pickup"],["🏆","Built for Karnataka farmers"]];
  const introCards = lang === "kn"
    ? [
        {icon:"🔥",title:"ಲೈವ್ ಬಿಡ್ ಹರಾಜುಗಳು",desc:"ಖರೀದಿದಾರರು ರಿಯಲ್-ಟೈಮ್‌ನಲ್ಲಿ ಸ್ಪರ್ಧಿಸುತ್ತಾರೆ. ರೈತರಿಗೆ ಎಲ್ಲಾ ಬಿಡ್‌ಗಳು ದೊಡ್ಡದರಿಂದ ಚಿಕ್ಕದಾಗಿ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣಿಸುತ್ತವೆ."},
        {icon:"📊",title:"ಲೈವ್ ಎಪಿಎಂಸಿ ದರಗಳು",desc:"ಮೈಸೂರು, ಹುಬ್ಬಳ್ಳಿ, ಹಾಸನ ಮತ್ತು ದಾವಣಗೆರೆಯ ಮಾರುಕಟ್ಟೆ ದರಗಳು ನಿರಂತರವಾಗಿ ನವೀಕರಿಸುತ್ತವೆ, ರೈತರಿಗೆ ಸರಿಯಾದ ಬೆಲೆ ಅರಿವು ಕೊಡುತ್ತವೆ."},
        {icon:"🚛",title:"ನೇರ ಫಾರ್ಮ್ ಪಿಕಪ್",desc:"ವಿತರಣಾ ಸಹಭಾಗಿಗಳು ಫಾರ್ಮ್ ಗೇಟ್‌ಗೆ ಬರುತ್ತಾರೆ. ರೈತರಿಗೆ ಸಾರಿಗೆ ವೆಚ್ಚ ಉಳಿಯುತ್ತದೆ ಮತ್ತು ಉತ್ಪನ್ನವು ಬೇಗ ಖರೀದಿದಾರರಿಗೆ ತಲುಪುತ್ತದೆ."},
        {icon:"📸",title:"ನಿಜವಾದ ಬೆಳೆ ಫೋಟೋಗಳು",desc:"ಗರಿಷ್ಠ 4 ನಿಜವಾದ ಬೆಳೆ ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಂಬಿಕೆ ಹೆಚ್ಚಾಗಿ ಉತ್ತಮ ಬಿಡ್‌ಗಳನ್ನು ಪಡೆಯಬಹುದು."},
        {icon:"📍",title:"18+ ಕರ್ನಾಟಕ ಜಿಲ್ಲೆಗಳು",desc:"ಪಿನ್ ಕೋಡ್‌ಗಳೊಂದಿಗೆ ವಿಳಾಸ ಸೂಚನೆ. ನಿಮ್ಮ ಫಾರ್ಮ್ ಸ್ಥಳ ವಿತರಣಾ ಸಹಭಾಗಿಗೆ ಸರಿಯಾಗಿ ತಲುಪುತ್ತದೆ."},
        {icon:"💾",title:"ಎಲ್ಲ ಸಾಧನಗಳಲ್ಲಿ ಕೆಲಸ",desc:"ರೈತರು ಮೊಬೈಲ್‌ನಲ್ಲಿ ಪೋಸ್ಟ್ ಮಾಡುತ್ತಾರೆ. ಖರೀದಿದಾರರು ಲ್ಯಾಪ್‌ಟಾಪ್‌ನಲ್ಲಿ ಬಿಡ್ ಮಾಡುತ್ತಾರೆ. ಎಲ್ಲವೂ ಒಟ್ಟಿಗೆ ಸಿಂಕ್ ಆಗುತ್ತದೆ."},
      ]
    : [
        {icon:"🔥",title:"Live Bidding Auctions",desc:"Retailers compete in real-time. Farmer sees every bid ranked from highest to lowest. Accept the best — no pressure, no deadline."},
        {icon:"📊",title:"Live APMC Market Rates",desc:"Karnataka mandi prices from Mysuru, Hubli, Hassan & Davangere update every 4 seconds so farmers always know exactly what their crop is worth."},
        {icon:"🚛",title:"Direct Farm Pickup",desc:"Delivery partners go to the farm gate. Farmers save ₹2,000–5,000 per trip in transport costs. Fresh produce reaches retailers faster."},
        {icon:"📸",title:"Real Crop Photos",desc:"Upload up to 4 actual crop photos. Retailers inspect quality before bidding — builds trust, increases bid count by 3×."},
        {icon:"📍",title:"18+ Karnataka Districts",desc:"Auto-complete addresses with PIN codes for all major Karnataka districts. Delivery gets the exact GPS location of your farm."},
        {icon:"💾",title:"Works Across All Devices",desc:"Farmer posts on their phone. Retailer bids from their laptop. Delivery updates status on the road. Everything syncs in real time."},
      ];
  const howSteps = lang === "kn"
    ? [
        {n:"1",icon:"📸",color:"#e8f5eb",title:"ರೈತರು ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡುತ್ತಾರೆ",desc:"ಬೆಳೆ ಫೋಟೋ ತೆಗೆದು, ಕನಿಷ್ಠ ಬೆಲೆ ನಿಗದಿ ಮಾಡಿ, ಗ್ರಾಮ ಆಯ್ಕೆ ಮಾಡಿ. ಲಿಸ್ಟಿಂಗ್ ತಕ್ಷಣವೇ ಲೈವ್ ಆಗುತ್ತದೆ.",tag:"2 ನಿಮಿಷ ಸಾಕು",tagBg:"#e8f5eb",tagColor:"#1e6b2e"},
        {n:"2",icon:"🔥",color:"#fff4e0",title:"ಖರೀದಿದಾರರು ಲೈವ್ ಬಿಡ್ ಮಾಡುತ್ತಾರೆ",desc:"18+ ಜಿಲ್ಲೆಗಳ ಖರೀದಿದಾರರು ನಿಮ್ಮ ಲಿಸ್ಟಿಂಗ್ ನೋಡಿ ರಿಯಲ್-ಟೈಮ್‌ನಲ್ಲಿ ಸ್ಪರ್ಧಿಸುತ್ತಾರೆ. ಎಲ್ಲಾ ಬಿಡ್‌ಗಳು ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣಿಸುತ್ತವೆ.",tag:"ರಿಯಲ್-ಟೈಮ್ ಹರಾಜು",tagBg:"#fff4e0",tagColor:"#c47000"},
        {n:"3",icon:"🤝",color:"#e8f5eb",title:"ಉತ್ತಮ ಬಿಡ್ ಸ್ವೀಕರಿಸಿ",desc:"ಎಲ್ಲಾ ಬಿಡ್‌ಗಳನ್ನು ನೋಡಿ. ನಿಮಗೆ ಬೇಕಾದ ಬಿಡ್‌ನ್ನು ಯಾವುದೇ ಒತ್ತಡವಿಲ್ಲದೆ ಸ್ವೀಕರಿಸಿ. ಪಿಕಪ್ ಕಾರ್ಯ ಸ್ವಯಂ ರಚನೆಯಾಗುತ್ತದೆ.",tag:"ನಿಯಂತ್ರಣ ನಿಮ್ಮದು",tagBg:"#e8f5eb",tagColor:"#1e6b2e"},
        {n:"4",icon:"🚛",color:"#e8f0fe",title:"ಫಾರ್ಮ್ ಗೇಟ್ ಪಿಕಪ್",desc:"ವಿತರಣಾ ಸಹಭಾಗಿ ನಿಮ್ಮ ಫಾರ್ಮ್ ವಿಳಾಸಕ್ಕೆ ಬಂದು ಬೆಳೆ ತೆಗೆದುಕೊಂಡು ಖರೀದಿದಾರರಿಗೆ ತಲುಪಿಸುತ್ತಾರೆ. ರೈತರಿಗೆ ಹೊರಗೆ ಹೋಗಬೇಕಾಗಿಲ್ಲ.",tag:"ಸಾರಿಗೆ ವೆಚ್ಚ ಶೂನ್ಯ",tagBg:"#e8f0fe",tagColor:"#1565c0"},
      ]
    : [
        {n:"1",icon:"📸",color:"#e8f5eb",title:"Farmer Posts Crop",desc:"Take photos of your crop, set your minimum price, pick your village from auto-complete. The listing goes live instantly — visible to all retailers.",tag:"Takes 2 minutes",tagBg:"#e8f5eb",tagColor:"#1e6b2e"},
        {n:"2",icon:"🔥",color:"#fff4e0",title:"Retailers Bid Live",desc:"Retailers from any of 18+ districts see your listing and compete with real-time bids. You see every bid ranked highest to lowest — completely transparent.",tag:"Real-time auction",tagBg:"#fff4e0",tagColor:"#c47000"},
        {n:"3",icon:"🤝",color:"#e8f5eb",title:"Accept the Best Bid",desc:"Review all bids. Accept the one you like — there's no pressure or time limit. Deal is locked instantly. A pickup job is created automatically.",tag:"You're in control",tagBg:"#e8f5eb",tagColor:"#1e6b2e"},
        {n:"4",icon:"🚛",color:"#e8f0fe",title:"Pickup at Farm Gate",desc:"A delivery partner claims the job, drives directly to your farm address, picks up the crop, and delivers it to the retailer. You never leave the farm.",tag:"Zero transport cost",tagBg:"#e8f0fe",tagColor:"#1565c0"},
      ];
  const flowCards = lang === "kn"
    ? {
        farmer: { badge:"🧑‍🌾 ರೈತ", role:"ಹಂತ 1 — ಮಾರಾಟಗಾರ", title:"ರೈತ ಪೋಸ್ಟ್ ಮಾಡಿ ಗೆಲ್ಲುತ್ತಾರೆ", desc:"ಬೆಳೆ ಫೋಟೋಗಳು ಮತ್ತು ಕನಿಷ್ಠ ಬೆಲೆಯೊಂದಿಗೆ ಪೋಸ್ಟ್ ಮಾಡುತ್ತಾರೆ. ಮನೆಯಲ್ಲೇ ಕುಳಿತು ಖರೀದಿದಾರರ ಸ್ಪರ್ಧೆ ನೋಡುತ್ತಾರೆ. ಅತ್ಯುತ್ತಮ ಬಿಡ್ ಸ್ವೀಕರಿಸುತ್ತಾರೆ.", points:["2 ನಿಮಿಷದಲ್ಲಿ ಬೆಳೆ ಫೋಟೋ ಅಪ್‌ಲೋಡ್","ಕನಿಷ್ಠ ಬಿಡ್ ನೀವು ನಿಗದಿ ಮಾಡಿ","ಎಲ್ಲಾ ಬಿಡ್‌ಗಳು ಲೈವ್ ಆಗಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ","ನಿಮಗೆ ಇಷ್ಟವಾದ ಆಫರ್ ಯಾವಾಗ ಬೇಕಾದರೂ ಸ್ವೀಕರಿಸಿ"]},
        retailer: { badge:"🏪 ಖರೀದಿದಾರ", role:"ಹಂತ 2 — ಖರೀದಿದಾರ", title:"ಖರೀದಿದಾರರು ಬಿಡ್ ಮಾಡಿ ಖರೀದಿಸುತ್ತಾರೆ", desc:"ಕರ್ನಾಟಕದಾದ್ಯಂತದ ತಾಜಾ ಲಿಸ್ಟಿಂಗ್‌ಗಳನ್ನು ನೋಡುತ್ತಾರೆ. ಲೈವ್ ಹರಾಜಿನಲ್ಲಿ ಸ್ಪರ್ಧಿಸುತ್ತಾರೆ. ಫಾರ್ಮ್‌ನಿಂದ ನೇರವಾಗಿ ತಾಜಾ ಉತ್ಪನ್ನ ಪಡೆಯುತ್ತಾರೆ.", points:["ಒಂದು ಪರದೆಯಲ್ಲಿ 18+ ಜಿಲ್ಲೆಗಳನ್ನು ನೋಡಿ","ಎಪಿಎಂಸಿ ದರಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ","ಲೈವ್ ಸ್ಪರ್ಧೆಯಲ್ಲಿ ಉತ್ತಮ ಬೆಲೆ ಗೆಲ್ಲುತ್ತದೆ","ಫಾರ್ಮ್‌ನಿಂದ ನೇರ ಉತ್ಪನ್ನ ಪಡೆಯಿರಿ"]},
        delivery: { badge:"🚛 ವಿತರಣೆ", role:"ಹಂತ 3 — ಸೇತುವೆ", title:"ಡ್ರೈವರ್ ತೆಗೆದುಕೊಂಡು ತಲುಪಿಸುತ್ತಾರೆ", desc:"ಪಿಕಪ್ ಕಾರ್ಯವನ್ನು ಸ್ವೀಕರಿಸಿ. ಖಚಿತ ವಿಳಾಸ ಮತ್ತು PIN ಬಳಸಿ ಫಾರ್ಮ್‌ಗೆ ಹೋಗಿ. ಬೆಳೆಯನ್ನು ನೇರವಾಗಿ ಖರೀದಿದಾರರಿಗೆ ತಲುಪಿಸಿ.", points:["ನಿಮ್ಮ ಹತ್ತಿರದ ಎಲ್ಲಾ ಕಾರ್ಯಗಳನ್ನು ನೋಡಿ","ಒಂದು ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಮಾರ್ಗ ಸ್ವೀಕರಿಸಿ","ಖಚಿತ ಫಾರ್ಮ್ ವಿಳಾಸ ಮತ್ತು PIN ಪಡೆಯಿರಿ","ಸ್ಥಿತಿಯನ್ನು ಲೈವ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ"]},
        arrow1:"ಲೈವ್ ಹರಾಜು",
        arrow2:"ಕಾರ್ಯ ರಚನೆ",
        connector:"ಮೂರು ಪಾತ್ರಗಳೂ BroadcastChannel API ಮೂಲಕ ರಿಯಲ್-ಟೈಮ್‌ನಲ್ಲಿ ಸಿಂಕ್ ಆಗುತ್ತವೆ — ಒಂದು ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಮಾಡಿದ ಬಿಡ್ ಉಳಿದ ಎಲ್ಲಾ ಟ್ಯಾಬ್‌ಗಳಲ್ಲಿ ತಕ್ಷಣ ಕಾಣಿಸುತ್ತದೆ",
      }
    : {
        farmer: { badge:"🧑‍🌾 FARMER", role:"Step 1 — The Seller", title:"Farmer Posts & Wins", desc:"Posts crop with photos and minimum price. Sits at home while retailers compete. Accepts the highest bid.", points:["Upload crop photos in 2 minutes","Set minimum bid — you control the floor","See all bids ranked live","Accept the best offer, anytime"]},
        retailer: { badge:"🏪 RETAILER", role:"Step 2 — The Buyer", title:"Retailer Bids & Buys", desc:"Browses fresh listings from across Karnataka. Bids in live auctions. Gets farm-fresh produce at the best price.", points:["Browse 18+ districts from one screen","Compare bids against APMC mandi rates","Compete live — best price wins","Receive fresh produce direct from farm"]},
        delivery: { badge:"🚛 DELIVERY", role:"Step 3 — The Bridge", title:"Driver Picks Up & Delivers", desc:"Claims the pickup job. Drives to the farm with exact address and PIN code. Delivers crop directly to the retailer.", points:["See all available jobs near you","Claim a route with one click","Get exact farm address & PIN code","Update status live — everyone sees"]},
        arrow1:"Live Auction",
        arrow2:"Job Created",
        connector:"All three roles sync in real time using BroadcastChannel API — bid placed in one tab appears instantly in all others",
      };
  const whyPoints = lang === "kn"
    ? [
        {icon:"💰",title:"ನಿಮ್ಮ ಮಾರಾಟದ 100% ಹಣ ಉಳಿಸಿ",desc:"ನಾವು ಯಾವುದೇ ಕಮಿಷನ್ ವಸೂಲು ಮಾಡುವುದಿಲ್ಲ. ಖರೀದಿದಾರರು ಕೊಡುವ ಹಣದ ಪೂರ್ಣ ಮೊತ್ತವೂ ರೈತರಿಗೆ ಹೋಗುತ್ತದೆ."},
        {icon:"📍",title:"ಫಾರ್ಮ್ ಬಿಟ್ಟು ಹೊರಡುವ ಅಗತ್ಯವಿಲ್ಲ",desc:"ಬೆಳಗಿನ ಜಾವ ಮಂಡಿಗೆ ಹೋಗುವ ಅವಶ್ಯಕತೆ ಇಲ್ಲ. ಫೋನ್‌ನಿಂದ ಪೋಸ್ಟ್ ಮಾಡಿ, ಮನೆಯಿಂದಲೇ ಬಿಡ್ ಸ್ವೀಕರಿಸಿ."},
        {icon:"🔒",title:"ಪ್ರತಿ ಬಾರಿ ಸಂಪೂರ್ಣ ಪಾರದರ್ಶಕತೆ",desc:"ಎಲ್ಲಾ ಬಿಡ್‌ಗಳು ನಿಮಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುತ್ತವೆ. ಏಜೆಂಟ್ ಹೇಳುವುದನ್ನು ನಂಬಬೇಕಾದ ಅವಶ್ಯಕತೆ ಇಲ್ಲ."},
        {icon:"📞",title:"ಖರೀದಿದಾರರೊಂದಿಗೆ ನೇರ ಸಂಪರ್ಕ",desc:"ಪ್ರತಿ ಖರೀದಿದಾರರ ಫೋನ್ ಸಂಖ್ಯೆ ಕಾಣಿಸುತ್ತದೆ. ನೇರವಾಗಿ ಮಾತನಾಡಿ. ಅಡಗಿದ ಶುಲ್ಕಗಳಿಲ್ಲ."},
      ]
    : [
        {icon:"💰",title:"Keep 100% of your sale price",desc:"We charge zero commission. Ever. The price the retailer pays goes directly to you, nothing skimmed off the top."},
        {icon:"📍",title:"Never leave your farm",desc:"No more 4AM mandi trips. Post from your phone, accept bids from home, let the delivery partner come to you."},
        {icon:"🔒",title:"Full transparency, every time",desc:"Every bid is visible to you, ranked from highest to lowest. No agent telling you what the market says — you see it yourself."},
        {icon:"📞",title:"Direct contact with buyers",desc:"Every retailer's phone number is shown. Call them directly. No mysterious agents. No hidden fees. Real people, real deals."},
      ];
  const statBlocks = lang === "kn"
    ? [["35L+","ಕರ್ನಾಟಕದ ರೈತರು","ಕರ್ನಾಟಕದಲ್ಲೇ ಸಾಧ್ಯ ಬಳಕೆದಾರರು"],["₹0","ಕಮಿಷನ್ ವಸೂಲಿ","ಪ್ರಾರಂಭದಲ್ಲೂ ನಂತರವೂ ಶುಲ್ಕ ಇಲ್ಲ"],["18+","ವ್ಯಾಪ್ತಿಯ ಜಿಲ್ಲೆಗಳು","ಹಾಸನದಿಂದ ಬೀದರ್‌ವರೆಗೆ ಪ್ರಮುಖ ಜಿಲ್ಲೆಗಳು"],["4 ಸೆಕೆಂ","ದರ ನವೀಕರಣ ವೇಗ","ಲೈವ್ ಎಪಿಎಂಸಿ ದರಗಳು, ಪ್ರತಿ 4 ಸೆಕೆಂಡಿಗೆ"]]
    : [["35L+","Karnataka Farmers","Potential users in Karnataka alone"],["₹0","Commission Charged","Zero fees — launch phase and beyond"],["18+","Districts Covered","From Hassan to Bidar, all major districts"],["4 sec","Rate Update Speed","Live APMC mandi prices, every 4 seconds"]];
  const testimonials = lang === "kn"
    ? [
        {stars:"★★★★★",quote:"ಹಿಂದೆ ನಾನು ಬೆಳಗಿನ 4 ಗಂಟೆಗೆ ಮಂಡಿಗೆ ಹೋಗಿ ಏಜೆಂಟ್ ಹೇಳಿದ ದರವೇ ನಂಬಬೇಕಾಗುತ್ತಿತ್ತು. ಈಗ ಮನೆಯಿಂದಲೇ ಪೋಸ್ಟ್ ಮಾಡಿ ಒಂದೇ ಗಂಟೆಯಲ್ಲಿ 3–4 ಬಿಡ್‌ಗಳು ಬರುತ್ತವೆ. ನನ್ನ ಕೊನೆಯ ಟೊಮೆಟೊ ಬ್ಯಾಚ್‌ನಲ್ಲಿ ₹3,200 ಹೆಚ್ಚು ಸಂಪಾದಿಸಿದೆ.",name:"ರಾಜು ಹೆಗ್ಡೆ",role:"ರೈತ · ಹಾಸನ ಜಿಲ್ಲೆ",emoji:"🧑‍🌾",bg:"#e8f5eb"},
        {stars:"★★★★★",quote:"ಹಿಂದೆ ನಾನು ಮಧ್ಯವರಿಂದ ಖರೀದಿಸುತ್ತಿದ್ದೆ. ಈಗ ರೈತನ ಮುಖ, ಗ್ರಾಮ ಮತ್ತು ಫೋಟೋಗಳನ್ನೇ ನೋಡಬಹುದು. ಗುಣಮಟ್ಟ ಉತ್ತಮವಾಗಿದೆ ಮತ್ತು ನಂಬಿಕೆ ಹೆಚ್ಚಾಗಿದೆ.",name:"ಮೀನಾ ಪಾಟೀಲ್",role:"ಖರೀದಿದಾರ · ಮೈಸೂರು",emoji:"🏪",bg:"#fff4e0"},
        {stars:"★★★★★",quote:"ನಾನು ದಿನಕ್ಕೆ 3–4 ಪಿಕಪ್ ಮಾರ್ಗಗಳನ್ನು ಮಾಡುತ್ತೇನೆ. ಅಪ್ಲಿಕೇಶನ್ ಖಚಿತ ಫಾರ್ಮ್ ವಿಳಾಸ ಮತ್ತು PIN ಕೊಡುತ್ತದೆ, ಆದ್ದರಿಂದ ದಾರಿ ತಪ್ಪುವುದಿಲ್ಲ. ವಿತರಣೆಗೆ ಆದಾಯ ಚೆನ್ನಾಗಿದೆ.",name:"ಸುರೇಶ್ ಕುಮಾರ್",role:"ವಿತರಣಾ ಸಹಭಾಗಿ · ತುಮಕೂರು",emoji:"🚛",bg:"#e8f0fe"},
      ]
    : [
        {stars:"★★★★★",quote:"Earlier I had to go to the mandi at 4AM and trust whatever price the agent said. Now I post from home and get 3–4 bids within an hour. I earned ₹3,200 more on my last Tomato batch alone.",name:"Raju Hegde",role:"Farmer · Hassan district",emoji:"🧑‍🌾",bg:"#e8f5eb"},
        {stars:"★★★★★",quote:"I used to buy from commission agents who never told me where the crop actually came from. On Raitha Reach I can see the farmer's face, their village, their photos. The quality is so much better and I know it's honest.",name:"Meena Patil",role:"Retailer · Mysuru",emoji:"🏪",bg:"#fff4e0"},
        {stars:"★★★★★",quote:"I do 3–4 pickup routes a day. The app gives me the exact farm address with PIN code, so I never get lost. I earn per delivery and the work is steady. Never had this kind of income before.",name:"Suresh Kumar",role:"Delivery Partner · Tumkur",emoji:"🚛",bg:"#e8f0fe"},
      ];
  const footerDistricts = ["Hassan","Mysuru","Mandya","Shivamogga","Davangere","Hubli-Dharwad"];
  const footerTags = lang === "kn"
    ? ["React 18","IndexedDB","BroadcastChannel","ಲೈವ್ ಎಪಿಎಂಸಿ ದರಗಳು","ಕಮಿಷನ್ ಇಲ್ಲ"]
    : ["React 18","IndexedDB","BroadcastChannel","Live APMC Rates","No Commission"];

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&family=Noto+Sans+Kannada:wght@400;500;600;700;800&display=swap');
    .hp * { box-sizing: border-box; margin: 0; padding: 0; }
    .hp { font-family: ${BODY_FONT}; background: #fff; color: #1a2e1c; }

    /* NAV */
    .hp-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 5%; height: 72px;
      background: rgba(255,255,255,0.96); backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 2px 20px rgba(0,0,0,0.06);
    }
    .hp-nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .hp-nav-logo-icon { width: 40px; height: 40px; background: #1e6b2e; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .hp-nav-logo-text { font-weight: 800; font-size: 18px; color: #1a2e1c; }
    .hp-nav-logo-sub { font-size: 10px; color: #6b8f6e; font-weight: 500; letter-spacing: 0.5px; }
    .hp-nav-links { display: flex; align-items: center; gap: 6px; }
    .hp-nav-link { padding: 7px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #3d5c40; cursor: pointer; border: none; background: transparent; font-family: inherit; transition: all 0.15s; }
    .hp-nav-link:hover { background: #f0f7f1; color: #1e6b2e; }
    .hp-nav-link.active { color: #1e6b2e; background: #e8f5eb; }
    .hp-nav-right { display: flex; align-items: center; gap: 10px; }
    .hp-btn-outline { padding: 9px 20px; border-radius: 9px; border: 1.5px solid #1e6b2e; background: transparent; color: #1e6b2e; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .hp-btn-outline:hover { background: #f0f7f1; }
    .hp-btn-solid { padding: 9px 22px; border-radius: 9px; border: none; background: #1e6b2e; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s; display: flex; align-items: center; gap: 7px; }
    .hp-btn-solid:hover { background: #2d7a3a; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(30,107,46,0.28); }

    /* HERO */
    .hp-hero {
      position: relative; height: 100vh; min-height: 620px;
      display: flex; align-items: center;
      overflow: hidden;
    }
    .hp-hero-bg {
      position: absolute; inset: 0;
      background-image: url('${HERO_IMG}');
      background-size: cover; background-position: center 30%;
      transform: scale(1.04);
      transition: transform 8s ease;
    }
    .hp-hero-bg:hover { transform: scale(1); }
    .hp-hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(105deg, rgba(10,30,12,0.82) 0%, rgba(10,30,12,0.55) 55%, rgba(10,30,12,0.15) 100%);
    }
    .hp-hero-content {
      position: relative; z-index: 2;
      padding: 0 5%; max-width: 720px;
    }
    .hp-hero-badge {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25);
      padding: 6px 16px; border-radius: 30px;
      font-size: 12px; font-weight: 700; color: #a5f3c0;
      letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 22px;
    }
    .hp-hero-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; animation: hpPulse 1.5s infinite; }
    .hp-hero-title {
      font-family: ${TITLE_FONT};
      font-size: clamp(2.8rem, 6vw, 5rem);
      font-weight: 800; color: #fff; line-height: 1.08;
      margin-bottom: 18px; letter-spacing: -0.5px;
    }
    .hp-hero-title span { color: #4ade80; }
    .hp-hero-sub {
      font-size: clamp(1rem, 1.8vw, 1.15rem); color: rgba(255,255,255,0.82);
      line-height: 1.75; max-width: 520px; margin-bottom: 36px;
    }
    .hp-hero-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 52px; }
    .hp-cta-primary {
      padding: 14px 32px; border-radius: 10px; border: none;
      background: #1e6b2e; color: #fff; font-size: 15px; font-weight: 800;
      cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 9px;
      transition: all 0.18s; box-shadow: 0 6px 24px rgba(30,107,46,0.4);
    }
    .hp-cta-primary:hover { background: #2d7a3a; transform: translateY(-2px); box-shadow: 0 10px 32px rgba(30,107,46,0.45); }
    .hp-cta-secondary {
      padding: 14px 28px; border-radius: 10px;
      border: 1.5px solid rgba(255,255,255,0.4);
      background: rgba(255,255,255,0.1); color: #fff;
      font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit;
      backdrop-filter: blur(6px); transition: all 0.18s;
    }
    .hp-cta-secondary:hover { background: rgba(255,255,255,0.18); }
    .hp-hero-stats {
      display: flex; gap: 0; border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 28px; flex-wrap: wrap;
    }
    .hp-hero-stat { text-align: left; padding-right: 36px; margin-right: 36px; border-right: 1px solid rgba(255,255,255,0.15); }
    .hp-hero-stat:last-child { border-right: none; }
    .hp-hero-stat-n { font-family: ${TITLE_FONT}; font-size: 2.2rem; font-weight: 700; color: #fff; line-height: 1; }
    .hp-hero-stat-l { font-size: 11px; color: rgba(255,255,255,0.62); text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }

    /* TRUST BAR */
    .hp-trust {
      background: #fff; border-bottom: 1px solid #edf2ee;
      padding: 18px 5%;
      display: flex; align-items: center; justify-content: center; gap: 48px;
      flex-wrap: wrap;
    }
    .hp-trust-item { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #3d5c40; }
    .hp-trust-icon { font-size: 16px; }

    /* SECTIONS COMMON */
    .hp-section { padding: 80px 5%; }
    .hp-section-label { font-size: 12px; font-weight: 800; color: #1e6b2e; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .hp-section-label::before { content: ''; width: 24px; height: 2px; background: #1e6b2e; border-radius: 2px; }
    .hp-section-title { font-family: ${TITLE_FONT}; font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 800; color: #1a2e1c; line-height: 1.18; margin-bottom: 14px; }
    .hp-section-sub { font-size: 15px; color: #6b8f6e; line-height: 1.75; max-width: 560px; }

    /* INTRO 3-CARDS */
    .hp-intro { background: #f7faf7; }
    .hp-intro-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 52px; }
    .hp-intro-card {
      background: #fff; border-radius: 18px; padding: 28px 24px;
      border: 1px solid #e8f0e9;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05);
      transition: all 0.22s; cursor: default;
    }
    .hp-intro-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.09); border-color: #c8e6cc; }
    .hp-intro-icon { width: 54px; height: 54px; background: #e8f5eb; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 18px; }
    .hp-intro-title { font-size: 16px; font-weight: 800; color: #1a2e1c; margin-bottom: 8px; }
    .hp-intro-desc { font-size: 13px; color: #6b8f6e; line-height: 1.7; }

    /* HOW IT WORKS */
    .hp-how { background: #fff; }
    .hp-how-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 56px; flex-wrap: wrap; gap: 20px; }
    .hp-how-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; position: relative; }
    .hp-how-steps::before {
      content: ''; position: absolute;
      top: 52px; left: calc(16.67% + 26px); right: calc(16.67% + 26px);
      height: 2px; background: repeating-linear-gradient(90deg, #c8e6cc 0px, #c8e6cc 8px, transparent 8px, transparent 16px);
      z-index: 0;
    }
    .hp-how-step { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 24px; position: relative; z-index: 1; }
    .hp-how-num-wrap { position: relative; margin-bottom: 24px; }
    .hp-how-num {
      width: 56px; height: 56px; border-radius: 50%;
      background: #1e6b2e; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 18px; font-family: ${TITLE_FONT};
      box-shadow: 0 6px 24px rgba(30,107,46,0.32);
      position: relative; z-index: 1;
    }
    .hp-how-num-ring {
      position: absolute; inset: -6px; border-radius: 50%;
      border: 2px solid #c8e6cc;
    }
    .hp-how-icon-box {
      width: 72px; height: 72px; border-radius: 20px; margin: 0 auto 18px;
      display: flex; align-items: center; justify-content: center; font-size: 34px;
    }
    .hp-how-step-title { font-size: 16px; font-weight: 800; color: #1a2e1c; margin-bottom: 10px; }
    .hp-how-step-desc { font-size: 13px; color: #6b8f6e; line-height: 1.72; }
    .hp-how-step-tag { display: inline-block; margin-top: 14px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }

    /* FLOW SECTION — Farmer → Retailer → Delivery */
    .hp-flow { background: #f7faf7; }
    .hp-flow-header { text-align: center; margin-bottom: 56px; }
    .hp-flow-header .hp-section-label { justify-content: center; }
    .hp-flow-header .hp-section-label::before { display: none; }
    .hp-flow-grid { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; align-items: center; gap: 0; }
    .hp-flow-card {
      background: #fff; border-radius: 20px; overflow: hidden;
      border: 1px solid #e8f0e9; box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      transition: all 0.22s;
    }
    .hp-flow-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.1); }
    .hp-flow-card-img { height: 200px; overflow: hidden; position: relative; }
    .hp-flow-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .hp-flow-card:hover .hp-flow-card-img img { transform: scale(1.06); }
    .hp-flow-card-badge {
      position: absolute; top: 12px; left: 12px;
      background: #1e6b2e; color: #fff; padding: 4px 12px;
      border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;
    }
    .hp-flow-card-body { padding: 22px 20px 24px; }
    .hp-flow-card-icon { font-size: 28px; margin-bottom: 10px; }
    .hp-flow-card-title { font-size: 17px; font-weight: 800; color: #1a2e1c; margin-bottom: 8px; }
    .hp-flow-card-role { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
    .hp-flow-card-desc { font-size: 13px; color: #6b8f6e; line-height: 1.7; margin-bottom: 16px; }
    .hp-flow-card-points { display: flex; flex-direction: column; gap: 7px; }
    .hp-flow-card-point { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: #3d5c40; }
    .hp-flow-card-check { width: 17px; height: 17px; border-radius: 50%; background: #e8f5eb; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #1e6b2e; font-weight: 800; flex-shrink: 0; margin-top: 1px; }
    .hp-flow-arrow { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 12px; }
    .hp-flow-arrow-line { width: 2px; height: 60px; background: linear-gradient(to bottom, #c8e6cc, #1e6b2e); border-radius: 2px; }
    .hp-flow-arrow-icon { width: 36px; height: 36px; border-radius: 50%; background: #1e6b2e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 4px 14px rgba(30,107,46,0.3); }
    .hp-flow-arrow-label { font-size: 10px; font-weight: 700; color: #6b8f6e; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; width: 56px; }

    /* WHY SECTION */
    .hp-why { background: #fff; }
    .hp-why-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
    .hp-why-img-wrap { position: relative; border-radius: 24px; overflow: hidden; }
    .hp-why-img { width: 100%; height: 480px; object-fit: cover; display: block; border-radius: 24px; }
    .hp-why-img-badge {
      position: absolute; bottom: 24px; left: 24px; right: 24px;
      background: rgba(255,255,255,0.95); border-radius: 14px; padding: 16px 20px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12); backdrop-filter: blur(8px);
    }
    .hp-why-img-badge-icon { font-size: 28px; flex-shrink: 0; }
    .hp-why-img-badge-text strong { font-size: 15px; font-weight: 800; color: #1a2e1c; display: block; }
    .hp-why-img-badge-text span { font-size: 12px; color: #6b8f6e; }
    .hp-why-points { display: flex; flex-direction: column; gap: 20px; margin-top: 32px; }
    .hp-why-point { display: flex; gap: 16px; align-items: flex-start; }
    .hp-why-point-icon { width: 46px; height: 46px; border-radius: 13px; background: #e8f5eb; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .hp-why-point-title { font-size: 14px; font-weight: 800; color: #1a2e1c; margin-bottom: 4px; }
    .hp-why-point-desc { font-size: 13px; color: #6b8f6e; line-height: 1.65; }

    /* STATS SECTION */
    .hp-stats { background: #1a2e1c; padding: 72px 5%; }
    .hp-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; text-align: center; }
    .hp-stats-item { padding: 0 24px; border-right: 1px solid rgba(255,255,255,0.1); }
    .hp-stats-item:last-child { border-right: none; }
    .hp-stats-n { font-family: ${TITLE_FONT}; font-size: 3rem; font-weight: 700; color: #4ade80; line-height: 1; margin-bottom: 8px; }
    .hp-stats-l { font-size: 13px; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; }
    .hp-stats-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 5px; }

    /* TESTIMONIALS */
    .hp-testi { background: #f7faf7; }
    .hp-testi-header { text-align: center; margin-bottom: 48px; }
    .hp-testi-header .hp-section-label { justify-content: center; }
    .hp-testi-header .hp-section-label::before { display: none; }
    .hp-testi-header .hp-section-sub { margin: 0 auto; }
    .hp-testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .hp-testi-card {
      background: #fff; border-radius: 18px; padding: 28px 24px;
      border: 1px solid #e8f0e9; box-shadow: 0 2px 16px rgba(0,0,0,0.04);
      transition: all 0.22s;
    }
    .hp-testi-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,0.08); }
    .hp-testi-stars { color: #f59e0b; font-size: 14px; letter-spacing: 2px; margin-bottom: 14px; }
    .hp-testi-quote { font-size: 14px; color: #3d5c40; line-height: 1.75; margin-bottom: 20px; font-style: italic; }
    .hp-testi-person { display: flex; align-items: center; gap: 12px; }
    .hp-testi-avatar { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .hp-testi-name { font-size: 13px; font-weight: 800; color: #1a2e1c; }
    .hp-testi-role { font-size: 11px; color: #6b8f6e; margin-top: 2px; }

    /* CTA SECTION */
    .hp-cta-section {
      background: linear-gradient(135deg, #1a4d24 0%, #2d7a3a 60%, #38a047 100%);
      padding: 88px 5%; text-align: center; position: relative; overflow: hidden;
    }
    .hp-cta-section::before {
      content: ''; position: absolute; top: -80px; right: -80px;
      width: 360px; height: 360px; border-radius: 50%;
      background: rgba(255,255,255,0.04); pointer-events: none;
    }
    .hp-cta-section::after {
      content: ''; position: absolute; bottom: -60px; left: -40px;
      width: 280px; height: 280px; border-radius: 50%;
      background: rgba(255,255,255,0.03); pointer-events: none;
    }
    .hp-cta-emoji { font-size: 52px; margin-bottom: 18px; }
    .hp-cta-title {
      font-family: ${TITLE_FONT};
      font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 800; color: #fff;
      margin-bottom: 14px; line-height: 1.18;
    }
    .hp-cta-sub { font-size: 15px; color: rgba(255,255,255,0.8); max-width: 520px; margin: 0 auto 34px; line-height: 1.75; }
    .hp-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
    .hp-cta-btn1 {
      padding: 14px 34px; border-radius: 10px; border: none;
      background: #fff; color: #1e6b2e; font-size: 15px; font-weight: 800;
      cursor: pointer; font-family: inherit; transition: all 0.18s;
      box-shadow: 0 6px 24px rgba(0,0,0,0.18);
    }
    .hp-cta-btn1:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(0,0,0,0.22); }
    .hp-cta-btn2 {
      padding: 14px 30px; border-radius: 10px;
      border: 1.5px solid rgba(255,255,255,0.45);
      background: rgba(255,255,255,0.1); color: #fff;
      font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit;
      backdrop-filter: blur(6px); transition: all 0.18s;
    }
    .hp-cta-btn2:hover { background: rgba(255,255,255,0.2); }

    /* FOOTER */
    .hp-footer { background: #0f2413; padding: 48px 5% 28px; }
    .hp-footer-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 32px; margin-bottom: 36px; }
    .hp-footer-brand { max-width: 280px; }
    .hp-footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .hp-footer-logo-icon { width: 36px; height: 36px; background: #1e6b2e; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 17px; }
    .hp-footer-logo-text { font-weight: 800; font-size: 16px; color: #fff; }
    .hp-footer-desc { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.7; }
    .hp-footer-col-title { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
    .hp-footer-link { display: block; font-size: 13px; color: rgba(255,255,255,0.65); margin-bottom: 9px; cursor: pointer; transition: color 0.15s; }
    .hp-footer-link:hover { color: #4ade80; }
    .hp-footer-bottom { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .hp-footer-copy { font-size: 12px; color: rgba(255,255,255,0.3); }
    .hp-footer-tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .hp-footer-tag { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.08); }

    @keyframes hpPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }

    @media (max-width: 900px) {
      .hp-how-steps { grid-template-columns: 1fr; }
      .hp-how-steps::before { display: none; }
      .hp-flow-grid { grid-template-columns: 1fr; }
      .hp-flow-arrow { flex-direction: row; padding: 12px 0; }
      .hp-flow-arrow-line { width: 60px; height: 2px; }
      .hp-why-inner { grid-template-columns: 1fr; }
      .hp-stats-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
      .hp-stats-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 24px; }
      .hp-testi-grid { grid-template-columns: 1fr; }
      .hp-nav-links { display: none; }
    }
  `;

  return (
    <div className="hp">
      <style>{CSS}</style>

      {/* ── NAVBAR ── */}
      <nav className="hp-nav">
        <div className="hp-nav-logo" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <div className="hp-nav-logo-icon">🌿</div>
          <div>
            <div className="hp-nav-logo-text">Raitha Reach</div>
            <div className="hp-nav-logo-sub">{pick(lang, "FARM DIRECT AUCTION", "ಕೃಷಿ ನೇರ ಹರಾಜು")}</div>
          </div>
        </div>
        <div className="hp-nav-links">
          <button className="hp-nav-link active">{pick(lang, "Home", "ಮುಖಪುಟ")}</button>
          <button className="hp-nav-link" onClick={() => setPage("about")}>{pick(lang, "How It Works", "ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ")}</button>
          <button className="hp-nav-link" onClick={() => setPage("about")}>{pick(lang, "Features", "ವೈಶಿಷ್ಟ್ಯಗಳು")}</button>
          <button className="hp-nav-link" onClick={() => setPage("about")}>{pick(lang, "About", "ಬಗ್ಗೆ")}</button>
        </div>
        <div className="hp-nav-right">
          <button className="hp-btn-outline" onClick={() => setPage("auth")}>{pick(lang, "Login", "ಲಾಗಿನ್")}</button>
          <button className="hp-btn-solid" onClick={() => setPage("auth")}>
            {pick(lang, "Get Started →", "ಪ್ರಾರಂಭಿಸಿ →")}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hp-hero">
        <div className="hp-hero-bg" />
        <div className="hp-hero-overlay" />
        <div className="hp-hero-content">
          <div className="hp-hero-badge">
            <div className="hp-hero-badge-dot" />
            {pick(lang, "Karnataka Farm-Direct Platform · Live Now", "ಕರ್ನಾಟಕ ರೈತ ನೇರ ವೇದಿಕೆ · ಈಗ ಲೈವ್")}
          </div>
          <h1 className="hp-hero-title">
            {pick(lang, "Farm Fresh.", "ತಾಜಾ ಬೆಳೆ.")}<br />
            <span>{pick(lang, "Fair Price.", "ನ್ಯಾಯ ಬೆಲೆ.")}</span><br />
            {pick(lang, "No Middlemen.", "ಮಧ್ಯವರಿಲ್ಲ.")}
          </h1>
          <p className="hp-hero-sub">
            {pick(lang, "Raitha Reach connects Karnataka farmers directly with retailers through live auctions. Post your crop, receive competitive bids, get picked up at your farm gate.", "ರೈತ ರೀಚ್ ಕರ್ನಾಟಕದ ರೈತರನ್ನು ಲೈವ್ ಹರಾಜುಗಳ ಮೂಲಕ ಖರೀದಿದಾರರೊಂದಿಗೆ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸುತ್ತದೆ. ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ, ಸ್ಪರ್ಧಾತ್ಮಕ ಬಿಡ್ ಪಡೆಯಿರಿ, ಫಾರ್ಮ್ ಗೇಟ್‌ನಲ್ಲೇ ಪಿಕಪ್ ಪಡೆಯಿರಿ.")}
          </p>
          <div className="hp-hero-cta">
            <button className="hp-cta-primary" onClick={() => setPage("auth")}>
              {pick(lang, "🚀 Start Selling Free", "🚀 ಉಚಿತವಾಗಿ ಮಾರಾಟ ಆರಂಭಿಸಿ")}
            </button>
            <button className="hp-cta-secondary" onClick={() => setPage("about")}>
              {pick(lang, "Watch How It Works →", "ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ನೋಡಿ →")}
            </button>
          </div>
          <div className="hp-hero-stats">
            {heroStats.map(([n,l]) => (
              <div key={l} className="hp-hero-stat">
                <div className="hp-hero-stat-n">{n}</div>
                <div className="hp-hero-stat-l">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="hp-trust">
        {trustItems.map(([icon,text]) => (
          <div key={text} className="hp-trust-item">
            <span className="hp-trust-icon">{icon}</span>{text}
          </div>
        ))}
      </div>

      {/* ── INTRO 3 CARDS ── */}
      <section className="hp-section hp-intro">
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div className="hp-section-label">{pick(lang, "Why Raitha Reach", "ಯಾಕೆ ರೈತ ರೀಚ್")}</div>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
            <h2 className="hp-section-title">{pick(lang, <>Built for Karnataka's<br />farming community</>, <>ಕರ್ನಾಟಕದ ರೈತ<br />ಸಮುದಾಯಕ್ಕಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ</>)}</h2>
            <p className="hp-section-sub" style={{marginBottom:4}}>{pick(lang, "Every feature designed around what farmers, retailers and delivery partners actually need — not what looks good on paper.", "ಪ್ರತಿ ವೈಶಿಷ್ಟ್ಯವೂ ರೈತರು, ಖರೀದಿದಾರರು ಮತ್ತು ವಿತರಣಾ ಸಹಭಾಗಿಗಳಿಗೆ ನಿಜವಾಗಿಯೂ ಬೇಕಾಗಿರುವುದರ ಆಧಾರದಲ್ಲಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.")}</p>
          </div>
          <div className="hp-intro-grid">
            {introCards.map(f => (
              <div key={f.title} className="hp-intro-card">
                <div className="hp-intro-icon">{f.icon}</div>
                <div className="hp-intro-title">{f.title}</div>
                <div className="hp-intro-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="hp-section hp-how">
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div className="hp-how-header">
            <div>
              <div className="hp-section-label">{pick(lang, "Simple Process", "ಸರಳ ಪ್ರಕ್ರಿಯೆ")}</div>
              <h2 className="hp-section-title">{pick(lang, "How It Works", "ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ")}</h2>
              <p className="hp-section-sub">{pick(lang, "From harvest to payment in 4 simple steps. No mandi trip. No middleman. No confusion.", "ಕೊಯ್ಲಿನಿಂದ ಪಾವತಿವರೆಗೆ 4 ಸರಳ ಹಂತಗಳು. ಮಂಡಿ ಪ್ರವಾಸ ಇಲ್ಲ. ಮಧ್ಯವರಿಲ್ಲ. ಗೊಂದಲವಿಲ್ಲ.")}</p>
            </div>
            <button className="hp-btn-solid" onClick={() => setPage("auth")} style={{flexShrink:0}}>
              {pick(lang, "Try It Now →", "ಈಗ ಪ್ರಯತ್ನಿಸಿ →")}
            </button>
          </div>
          <div className="hp-how-steps">
            {howSteps.map((s,i) => (
              <div key={s.n} className="hp-how-step">
                <div className="hp-how-num-wrap">
                  <div className="hp-how-num-ring" />
                  <div className="hp-how-num">{s.n}</div>
                </div>
                <div className="hp-how-icon-box" style={{background:s.color}}>{s.icon}</div>
                <div className="hp-how-step-title">{s.title}</div>
                <div className="hp-how-step-desc">{s.desc}</div>
                <div className="hp-how-step-tag" style={{background:s.tagBg,color:s.tagColor}}>{s.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLOW: FARMER → RETAILER → DELIVERY ── */}
      <section className="hp-section hp-flow">
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div className="hp-flow-header">
            <div className="hp-section-label">{pick(lang, "The Full Journey", "ಸಂಪೂರ್ಣ ಪ್ರಯಾಣ")}</div>
            <h2 className="hp-section-title">{pick(lang, <>Farmer bids to Retailer.<br />Delivery picks it up.</>, <>ರೈತರಿಂದ ಖರೀದಿದಾರರಿಗೆ.<br />ವಿತರಣೆಯೂ ಒಂದೇ ವೇದಿಕೆಯಲ್ಲಿ.</>)}</h2>
            <p className="hp-section-sub" style={{margin:"0 auto"}}>{pick(lang, "Three roles. One seamless platform. Everything connected in real time.", "ಮೂರು ಪಾತ್ರಗಳು. ಒಂದು ನಿರಂತರ ವೇದಿಕೆ. ಎಲ್ಲವೂ ರಿಯಲ್-ಟೈಮ್‌ನಲ್ಲಿ ಸಂಪರ್ಕಿತವಾಗಿದೆ.")}</p>
          </div>
          <div className="hp-flow-grid">

            {/* FARMER CARD */}
            <div className="hp-flow-card">
              <div className="hp-flow-card-img">
                <img src={FARM_IMG1} alt={pick(lang, "Farmer", "ರೈತ")} loading="lazy" />
                <div className="hp-flow-card-badge">{flowCards.farmer.badge}</div>
              </div>
              <div className="hp-flow-card-body">
                <div className="hp-flow-card-icon">🧑‍🌾</div>
                <div className="hp-flow-card-role" style={{color:"#1e6b2e"}}>{flowCards.farmer.role}</div>
                <div className="hp-flow-card-title">{flowCards.farmer.title}</div>
                <div className="hp-flow-card-desc">{flowCards.farmer.desc}</div>
                <div className="hp-flow-card-points">
                  {flowCards.farmer.points.map(p => (
                    <div key={p} className="hp-flow-card-point">
                      <div className="hp-flow-card-check">✓</div>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ARROW 1 */}
            <div className="hp-flow-arrow">
              <div className="hp-flow-arrow-line" />
              <div className="hp-flow-arrow-icon">→</div>
              <div className="hp-flow-arrow-label">{flowCards.arrow1}</div>
              <div className="hp-flow-arrow-line" />
            </div>

            {/* RETAILER CARD */}
            <div className="hp-flow-card">
              <div className="hp-flow-card-img">
                <img src={FARM_IMG2} alt={pick(lang, "Retailer", "ಖರೀದಿದಾರ")} loading="lazy" />
                <div className="hp-flow-card-badge" style={{background:"#c47000"}}>{flowCards.retailer.badge}</div>
              </div>
              <div className="hp-flow-card-body">
                <div className="hp-flow-card-icon">🏪</div>
                <div className="hp-flow-card-role" style={{color:"#c47000"}}>{flowCards.retailer.role}</div>
                <div className="hp-flow-card-title">{flowCards.retailer.title}</div>
                <div className="hp-flow-card-desc">{flowCards.retailer.desc}</div>
                <div className="hp-flow-card-points">
                  {flowCards.retailer.points.map(p => (
                    <div key={p} className="hp-flow-card-point">
                      <div className="hp-flow-card-check" style={{background:"#fff4e0",color:"#c47000"}}>✓</div>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ARROW 2 */}
            <div className="hp-flow-arrow">
              <div className="hp-flow-arrow-line" />
              <div className="hp-flow-arrow-icon">→</div>
              <div className="hp-flow-arrow-label">{flowCards.arrow2}</div>
              <div className="hp-flow-arrow-line" />
            </div>

            {/* DELIVERY CARD */}
            <div className="hp-flow-card">
              <div className="hp-flow-card-img">
                <img src={FARM_IMG3} alt={pick(lang, "Delivery", "ವಿತರಣೆ")} loading="lazy" />
                <div className="hp-flow-card-badge" style={{background:"#1565c0"}}>{flowCards.delivery.badge}</div>
              </div>
              <div className="hp-flow-card-body">
                <div className="hp-flow-card-icon">🚛</div>
                <div className="hp-flow-card-role" style={{color:"#1565c0"}}>{flowCards.delivery.role}</div>
                <div className="hp-flow-card-title">{flowCards.delivery.title}</div>
                <div className="hp-flow-card-desc">{flowCards.delivery.desc}</div>
                <div className="hp-flow-card-points">
                  {flowCards.delivery.points.map(p => (
                    <div key={p} className="hp-flow-card-point">
                      <div className="hp-flow-card-check" style={{background:"#e8f0fe",color:"#1565c0"}}>✓</div>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom connector */}
          <div style={{textAlign:"center",marginTop:40,padding:"18px 24px",background:"#fff",borderRadius:14,border:"1px solid #e8f0e9",display:"inline-flex",alignItems:"center",gap:10,boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
            <span style={{fontSize:18}}>⚡</span>
            <span style={{fontSize:13,color:"#3d5c40",fontWeight:600}}>{flowCards.connector}</span>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ── */}
      <section className="hp-section hp-why">
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div className="hp-why-inner">
            <div className="hp-why-img-wrap">
              <img src={FARMER_IMG} alt={pick(lang, "Karnataka Farmer", "ಕರ್ನಾಟಕ ರೈತ")} className="hp-why-img" loading="lazy" />
              <div className="hp-why-img-badge">
                <div className="hp-why-img-badge-icon">🌾</div>
                <div className="hp-why-img-badge-text">
                  <strong>{pick(lang, "₹0 Commission Forever", "₹0 ಶಾಶ್ವತ ಕಮಿಷನ್ ಇಲ್ಲ")}</strong>
                  <span>{pick(lang, "Farmers keep 100% of their sale price", "ರೈತರು ತಮ್ಮ ಮಾರಾಟದ 100% ಹಣವನ್ನು ಉಳಿಸಿಕೊಳ್ಳುತ್ತಾರೆ")}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="hp-section-label">{pick(lang, "Our Commitment", "ನಮ್ಮ ಬದ್ಧತೆ")}</div>
              <h2 className="hp-section-title">{pick(lang, <>Why farmers trust<br />Raitha Reach</>, <>ಯಾಕೆ ರೈತರು<br />ರೈತ ರೀಚ್ ನಂಬುತ್ತಾರೆ</>)}</h2>
              <p className="hp-section-sub">{pick(lang, "We built this platform with one goal — help Karnataka farmers earn what they deserve, without giving up a single rupee to a middleman.", "ಈ ವೇದಿಕೆಯನ್ನು ನಾವು ಒಂದೇ ಗುರಿಯಿಂದ ನಿರ್ಮಿಸಿದ್ದೇವೆ — ಕರ್ನಾಟಕದ ರೈತರು ಮಧ್ಯವರಿಗೊಂದು ರೂಪಾಯಿಯನ್ನೂ ಕಳೆದುಕೊಳ್ಳದೆ ತಕ್ಕ ಆದಾಯ ಪಡೆಯಲು ಸಹಾಯ ಮಾಡುವುದು.")}</p>
              <div className="hp-why-points">
                {whyPoints.map(p => (
                  <div key={p.title} className="hp-why-point">
                    <div className="hp-why-point-icon">{p.icon}</div>
                    <div>
                      <div className="hp-why-point-title">{p.title}</div>
                      <div className="hp-why-point-desc">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="hp-stats">
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div className="hp-stats-grid">
            {statBlocks.map(([n,l,s]) => (
              <div key={l} className="hp-stats-item">
                <div className="hp-stats-n">{n}</div>
                <div className="hp-stats-l">{l}</div>
                <div className="hp-stats-sub">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <section className="hp-section hp-testi">
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div className="hp-testi-header">
            <div className="hp-section-label">{pick(lang, "User Stories", "ಬಳಕೆದಾರರ ಕಥೆಗಳು")}</div>
            <h2 className="hp-section-title">{pick(lang, "What Karnataka farmers say", "ಕರ್ನಾಟಕದ ರೈತರು ಏನು ಹೇಳುತ್ತಾರೆ")}</h2>
            <p className="hp-section-sub">{pick(lang, "Real stories from farmers, retailers and delivery partners across Karnataka.", "ಕರ್ನಾಟಕದಾದ್ಯಂತದ ರೈತರು, ಖರೀದಿದಾರರು ಮತ್ತು ವಿತರಣಾ ಸಹಭಾಗಿಗಳ ನಿಜವಾದ ಕಥೆಗಳು.")}</p>
          </div>
          <div className="hp-testi-grid">
            {testimonials.map(t => (
              <div key={t.name} className="hp-testi-card">
                <div className="hp-testi-stars">{t.stars}</div>
                <div className="hp-testi-quote">"{t.quote}"</div>
                <div className="hp-testi-person">
                  <div className="hp-testi-avatar" style={{background:t.bg}}>{t.emoji}</div>
                  <div>
                    <div className="hp-testi-name">{t.name}</div>
                    <div className="hp-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="hp-cta-section">
        <div className="hp-cta-emoji">🌾</div>
        <h2 className="hp-cta-title">{pick(lang, <>Ready to sell your crop<br />at the right price?</>, <>ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ಸರಿಯಾದ<br />ದರದಲ್ಲಿ ಮಾರಾಟ ಮಾಡಲು ಸಿದ್ಧವೇ?</>)}</h2>
        <p className="hp-cta-sub">{pick(lang, "Join farmers across Karnataka who are getting fair prices directly from buyers — no middlemen, no commission, no mandi trip.", "ಖರೀದಿದಾರರಿಂದಲೇ ನ್ಯಾಯ ಬೆಲೆ ಪಡೆಯುತ್ತಿರುವ ಕರ್ನಾಟಕದ ರೈತರ ಜೊತೆ ಸೇರಿ — ಮಧ್ಯವರಿಲ್ಲ, ಕಮಿಷನ್ ಇಲ್ಲ, ಮಂಡಿ ಪ್ರಯಾಣ ಇಲ್ಲ.")}</p>
        <div className="hp-cta-btns">
          <button className="hp-cta-btn1" onClick={() => setPage("auth")}>{pick(lang, "🚀 Register Free — It Takes 1 Minute", "🚀 ಉಚಿತ ನೋಂದಣಿ — 1 ನಿಮಿಷ ಸಾಕು")}</button>
          <button className="hp-cta-btn2" onClick={() => setPage("about")}>{pick(lang, "See All Features →", "ಎಲ್ಲ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ನೋಡಿ →")}</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="hp-footer">
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div className="hp-footer-top">
            <div className="hp-footer-brand">
              <div className="hp-footer-logo">
                <div className="hp-footer-logo-icon">🌿</div>
                <div className="hp-footer-logo-text">Raitha Reach</div>
              </div>
              <div className="hp-footer-desc">{pick(lang, "Karnataka's farm-direct auction platform. Connecting farmers, retailers and delivery partners — removing every middleman in between.", "ಕರ್ನಾಟಕದ ಕೃಷಿ ನೇರ ಹರಾಜು ವೇದಿಕೆ. ರೈತರು, ಖರೀದಿದಾರರು ಮತ್ತು ವಿತರಣಾ ಸಹಭಾಗಿಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ ಮಧ್ಯವರಿಯನ್ನು ತೆಗೆದುಹಾಕುತ್ತದೆ.")}</div>
            </div>
            <div>
              <div className="hp-footer-col-title">{pick(lang, "Platform", "ವೇದಿಕೆ")}</div>
              {(lang === "kn" ? ["ರೈತರಿಗೆ","ಖರೀದಿದಾರರಿಗೆ","ವಿತರಣಾ ಸಹಭಾಗಿಗಳಿಗೆ","ಎಪಿಎಂಸಿ ದರಗಳು","ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ"] : ["For Farmers","For Retailers","For Delivery Partners","APMC Market Rates","How It Works"]).map(l => <div key={l} className="hp-footer-link" onClick={() => setPage("auth")}>{l}</div>)}
            </div>
            <div>
              <div className="hp-footer-col-title">{pick(lang, "Karnataka Districts", "ಕರ್ನಾಟಕ ಜಿಲ್ಲೆಗಳು")}</div>
              {footerDistricts.map(l => <div key={l} className="hp-footer-link">{lang === "kn" ? tDistrict(l.split("-")[0], lang) + (l.includes("-") ? `-${tDistrict(l.split("-")[1], lang)}` : "") : l}</div>)}
            </div>
            <div>
              <div className="hp-footer-col-title">{pick(lang, "Support", "ಬೆಂಬಲ")}</div>
              {(lang === "kn" ? ["ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್: 1800-180-1551","ಕರ್ನಾಟಕ ಎಪಿಎಂಸಿ: 080-2334-7000","ಪಿಎಂ-ಕಿಸಾನ್: 155261"] : ["Kisan Call Centre: 1800-180-1551","Karnataka APMC: 080-2334-7000","PM-KISAN: 155261"]).map(l => <div key={l} className="hp-footer-link">{l}</div>)}
            </div>
          </div>
          <div className="hp-footer-bottom">
            <div className="hp-footer-copy">{pick(lang, "© 2026 Raitha Reach · Built for Hackathon 2026 · Karnataka AgriTech · 100+ Teams", "© 2026 ರೈತ ರೀಚ್ · ಹ್ಯಾಕಥಾನ್ 2026 ಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ · ಕರ್ನಾಟಕ ಅಗ್ರಿಟೆಕ್ · 100+ ತಂಡಗಳು")}</div>
            <div className="hp-footer-tags">
              {footerTags.map(t => <span key={t} className="hp-footer-tag">{t}</span>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
