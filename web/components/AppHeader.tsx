"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function AppHeader() {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => api.getCurrentUser(),
    retry: false,
  });

  const { data: serverInfo } = useQuery({
    queryKey: ["server-info"],
    queryFn: () => api.getServerInfo(),
    retry: false,
  });

  const serverTitle =
    serverInfo && typeof serverInfo === "object" && "server_title" in serverInfo
      ? String((serverInfo as { server_title?: string }).server_title)
      : "JiraTUI Web";

  return (
    <header className="shrink-0 border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-3 py-1.5">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">{serverTitle}</h1>
          <p className="truncate text-[11px] text-zinc-500">HeroUI web · Python BFF</p>
        </div>
        {user ? (
          <div className="shrink-0 text-right text-xs leading-tight">
            <div className="font-medium">{user.display_name}</div>
            {user.email ? <div className="text-zinc-500">{user.email}</div> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
