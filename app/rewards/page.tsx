
"use client";

import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

const Alert = dynamic(() => import("@/components/ui/alert").then(mod => mod.Alert), {
  ssr: false,
  loading: () => <div className="p-4"><div className="w-full h-10 rounded-lg bg-muted animate-pulse"></div></div>,
});

export default function RewardsPage() {
  return (
    <div className="p-4">
      <Card>
        <CardContent>
          <Alert>Your reward points are updated!</Alert>
        </CardContent>
      </Card>
    </div>
  );
}
