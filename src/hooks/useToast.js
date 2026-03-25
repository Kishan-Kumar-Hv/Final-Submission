import { useState, useCallback } from "react";
export function useToast(){
  const [toasts,setToasts]=useState([]);
  const toast=useCallback(({msg,icon="✅",type=""})=>{
    const id=Math.random().toString(36).slice(2);
    const remove=()=>setToasts(t=>t.filter(x=>x.id!==id));
    setToasts(t=>[...t,{id,msg,icon,type,onClose:remove}]);
    setTimeout(remove,4000);
  },[]);
  return {toasts,toast};
}
