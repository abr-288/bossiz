import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FlightCardSkeleton() {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 md:w-40">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex-1 flex items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 md:w-32">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

export function HotelCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="w-full min-h-[300px] rounded-none" />
        <CardContent className="md:col-span-2 p-6 space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-12 rounded-md" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <div className="flex justify-between items-end pt-4">
            <Skeleton className="h-4 w-28" />
            <div className="space-y-2 text-right">
              <Skeleton className="h-7 w-24 ml-auto" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function CarCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="w-full h-44 rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
