import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Thanks, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { LogIn, MessageSquare, Trophy } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const { data: recentThanks } = useQuery<Thanks[]>({
    queryKey: ["/api/thanks/recent"],
    enabled: !!user,
  });

  const { data: rankings } = useQuery<{userId: number, points: number}[]>({
    queryKey: ["/api/rankings/month"],
    enabled: !!user,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero section - visible to all */}
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">Recognition Portal</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Celebrate achievements and build a culture of appreciation
          </p>
          {!user ? (
            <Link href="/auth">
              <Button size="lg" className="gap-2">
                <LogIn className="w-4 h-4" />
                Đăng nhập để bắt đầu
              </Button>
            </Link>
          ) : (
            <Link href="/thanks">
              <Button size="lg" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Gửi lời cảm ơn
              </Button>
            </Link>
          )}
        </section>

        {user && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Recent Thanks */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Lời cảm ơn gần đây</CardTitle>
                  <CardDescription>
                    5 lời cảm ơn mới nhất trong hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentThanks?.slice(0, 5).map((thanks) => {
                      const fromUser = users?.find(u => u.id === thanks.fromId);
                      const toUser = users?.find(u => u.id === thanks.toId);
                      return (
                        <div key={thanks.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">
                              {fromUser?.name} → {toUser?.name}
                            </p>
                            <Badge variant={thanks.status === "approved" ? "default" : "secondary"}>
                              {thanks.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{thanks.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistance(new Date(thanks.createdAt), new Date(), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      );
                    })}
                    {(!recentThanks || recentThanks.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">
                        Chưa có lời cảm ơn nào
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Top Rankings */}
            <section>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <div>
                      <CardTitle>Bảng xếp hạng tháng</CardTitle>
                      <CardDescription>
                        Top 5 người nhận được nhiều lời cảm ơn nhất
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rankings?.slice(0, 5).map((ranking, index) => {
                      const user = users?.find(u => u.id === ranking.userId);
                      return (
                        <div key={ranking.userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-muted-foreground">
                              #{index + 1}
                            </span>
                            <span className="font-medium">{user?.name}</span>
                          </div>
                          <Badge variant="secondary" className="font-mono">
                            {ranking.points} pts
                          </Badge>
                        </div>
                      );
                    })}
                    {(!rankings || rankings.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">
                        Chưa có dữ liệu xếp hạng
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}

        {/* Feature cards for non-logged in users */}
        {!user && (
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              title="Gửi lời cảm ơn"
              description="Gửi lời cảm ơn đến đồng nghiệp để ghi nhận những đóng góp của họ"
            />
            <FeatureCard
              title="Bảng xếp hạng"
              description="Theo dõi và vinh danh những người nhận được nhiều lời cảm ơn nhất"
            />
            <FeatureCard
              title="Quản lý hiệu quả"
              description="Quản lý và theo dõi hoạt động của nhân viên một cách minh bạch"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}