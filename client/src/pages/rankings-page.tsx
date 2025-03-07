import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Medal, Crown, Loader2 } from "lucide-react";
import { useState } from "react";

type Period = "week" | "month" | "quarter" | "year";

export default function RankingsPage() {
  const [period, setPeriod] = useState<Period>("month");

  const { data: rankings, isLoading: rankingsLoading } = useQuery<{userId: number, points: number}[]>({
    queryKey: [`/api/rankings/${period}`],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = rankingsLoading || usersLoading;

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(50%_100%_at_50%_0%,var(--primary-50)_0,transparent_50%)]" />
          </div>
          <div className="relative p-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Bảng xếp hạng
            </h1>
            <p className="text-muted-foreground text-lg">
              Vinh danh những người nhận được nhiều lời cảm ơn và đóng góp tích cực
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="quarter">Quý này</SelectItem>
              <SelectItem value="year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rankings List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {rankings?.map((ranking, index) => {
              const user = users?.find(u => u.id === ranking.userId);
              if (!user) return null;

              let medal = null;
              if (index === 0) {
                medal = <Crown className="w-6 h-6 text-yellow-500" />;
              } else if (index === 1) {
                medal = <Medal className="w-6 h-6 text-gray-400" />;
              } else if (index === 2) {
                medal = <Medal className="w-6 h-6 text-amber-600" />;
              }

              return (
                <Card key={ranking.userId} className="group transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="relative flex items-center justify-center w-12 h-12">
                        <div className="absolute inset-0 bg-primary/10 rounded-full" />
                        <div className="relative group-hover:scale-110 transition-transform">
                          {medal || (
                            <span className="text-primary font-bold text-xl">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{user.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {user.title || user.department || "Chưa cập nhật"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">
                            {ranking.points} điểm
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {(!rankings || rankings.length === 0) && (
              <Card className="p-8 text-center">
                <CardContent>
                  <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <CardTitle className="mb-2">Chưa có dữ liệu xếp hạng</CardTitle>
                  <CardDescription>
                    Hãy gửi lời cảm ơn để bắt đầu ghi nhận thành tích
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}