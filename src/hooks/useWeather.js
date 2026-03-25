import { useState, useEffect } from "react";
const WX={Hassan:{icon:"⛅",temp:24,desc:"Partly cloudy",humidity:72,wind:"12 km/h"},Mysuru:{icon:"☀️",temp:28,desc:"Clear sky",humidity:58,wind:"8 km/h"},Mandya:{icon:"🌤️",temp:26,desc:"Mild overcast",humidity:68,wind:"10 km/h"},"Bengaluru Rural":{icon:"🌦️",temp:22,desc:"Light showers",humidity:82,wind:"15 km/h"},Tumakuru:{icon:"☀️",temp:30,desc:"Sunny & hot",humidity:52,wind:"6 km/h"},Shivamogga:{icon:"🌧️",temp:21,desc:"Heavy showers",humidity:88,wind:"18 km/h"}};
export function useWeather(district){
  const [wx,setWx]=useState(null);
  useEffect(()=>{const base=WX[district]||{icon:"🌤️",temp:25,desc:"Partly cloudy",humidity:65,wind:"10 km/h"};setWx(base);const iv=setInterval(()=>setWx(w=>w?{...w,temp:parseFloat((w.temp+(Math.random()>.5?.2:-.2)).toFixed(1))}:w),15000);return()=>clearInterval(iv);},[district]);
  return wx;
}
