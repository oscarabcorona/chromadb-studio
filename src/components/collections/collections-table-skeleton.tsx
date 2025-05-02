import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export function CollectionsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-32 bg-muted rounded-md animate-pulse"></div>
          <div className="h-4 w-64 mt-2 bg-muted rounded-md animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-muted rounded-md animate-pulse"></div>
          <div className="h-10 w-32 bg-muted rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="h-0.5 bg-muted animate-pulse"></div>

      <div className="h-10 w-72 bg-muted rounded-md animate-pulse"></div>

      <Card>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="h-4 w-32 bg-muted rounded-md animate-pulse"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-24 bg-muted rounded-md animate-pulse"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-24 bg-muted rounded-md animate-pulse"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-16 bg-muted rounded-md animate-pulse"></div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-48 bg-muted rounded-md animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-12 bg-muted rounded-md animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-muted rounded-md animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-24 bg-muted rounded-md animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
