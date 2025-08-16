
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile Header Skeleton */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
      
      {/* Daily Streak Skeleton */}
      <Card>
        <CardHeader>
            <Skeleton className="h-6 w-28 mb-2" />
        </CardHeader>
        <CardContent>
            <div className="flex items-end justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <Card>
        <CardHeader>
            <Skeleton className="h-6 w-28 mb-2" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2 p-2 rounded-lg">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-8 w-16" />
            </div>
            <div className="space-y-2 p-2 rounded-lg">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-8 w-16" />
            </div>
             <div className="space-y-2 p-2 rounded-lg">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-8 w-16" />
            </div>
             <div className="space-y-2 p-2 rounded-lg">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-8 w-16" />
            </div>
        </CardContent>
      </Card>
      
       {/* Referral Card Skeleton */}
      <Card>
        <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
             <Skeleton className="h-10 w-full" />
             <div className="flex justify-around mt-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
             </div>
        </CardContent>
      </Card>

    </div>
  );
}
