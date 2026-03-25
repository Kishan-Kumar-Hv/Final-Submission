let _c = 5000;
export const uid = () => `id${++_c}${Math.random().toString(36).slice(2,5)}`;
export const fmtP = n => `₹${Number(n)%1 ? Number(n).toFixed(1) : Number(n)}`;
export function timeAgo(ts,lang="en"){const d=Math.floor((Date.now()-ts)/1000);if(d<60)return lang==="kn"?`${d} ಸೆಕೆಂಡುಗಳ ಹಿಂದೆ`:`${d}s ago`;if(d<3600)return lang==="kn"?`${Math.floor(d/60)} ನಿಮಿಷಗಳ ಹಿಂದೆ`:`${Math.floor(d/60)}m ago`;if(d<86400)return lang==="kn"?`${Math.floor(d/3600)} ಗಂಟೆಗಳ ಹಿಂದೆ`:`${Math.floor(d/3600)}h ago`;return lang==="kn"?`${Math.floor(d/86400)} ದಿನಗಳ ಹಿಂದೆ`:`${Math.floor(d/86400)}d ago`;}
