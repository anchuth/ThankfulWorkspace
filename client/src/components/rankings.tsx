import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Crown } from "lucide-react";

type RankingEntry = {
  userId: number;
  points: number;
};

export function Rankings({ period }: { period: "week" | "month" | "quarter" | "year" }) {
  const { data: rankings } = useQuery<RankingEntry[]>({
    queryKey: [`/api/rankings/${period}`],
  });

  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Rank</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings?.map((entry, index) => {
            const user = users?.find((u) => u.id === entry.userId);
            return (
              <TableRow key={entry.userId}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    #{index + 1}
                  </div>
                </TableCell>
                <TableCell>{user?.name}</TableCell>
                <TableCell className="text-right">{entry.points}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
