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
import { Crown, Medal, Trophy } from "lucide-react";
import { motion } from "framer-motion";

type RankingEntry = {
  userId: number;
  points: number;
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 0:
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 1:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 2:
      return <Medal className="h-4 w-4 text-amber-600" />;
    default:
      return null;
  }
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
            const rankIcon = getRankIcon(index);

            return (
              <motion.tr
                key={entry.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {rankIcon}
                    #{index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{user?.name}</span>
                    {index === 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Top Performer
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                    {entry.points} pts
                  </span>
                </TableCell>
              </motion.tr>
            );
          })}
          {(!rankings || rankings.length === 0) && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                No rankings available for this period
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}