import { useState, useEffect } from "react";
import { CROPS_DATA } from "../data/constants.js";
export function useMarketRates(){
  const [rates,setRates]=useState(()=>CROPS_DATA.map(c=>({...c,price:c.bp*(0.9+Math.random()*.22),prev:c.bp,hist:Array.from({length:10},()=>c.bp*(0.78+Math.random()*.44))})));
  useEffect(()=>{const iv=setInterval(()=>setRates(r=>r.map(c=>{const d=(Math.random()-.47)*c.bp*.05;const np=Math.max(c.bp*.52,c.price+d);return{...c,prev:c.price,price:np,hist:[...c.hist.slice(1),np]}})),3800);return()=>clearInterval(iv);},[]);
  return rates;
}
