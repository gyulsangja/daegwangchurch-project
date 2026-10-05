"use client";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from 'next/navigation';

export function AdminFeedback() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname(); const search = useSearchParams();
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("saved") !== "1") return;
    document.dispatchEvent(new Event('admin:saved'));
    url.searchParams.delete("saved");
    const timer = window.setTimeout(() => { setOpen(true); window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`); }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);
  return <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}><Alert severity="success" variant="filled" onClose={() => setOpen(false)}>저장했습니다.</Alert></Snackbar>;
}
