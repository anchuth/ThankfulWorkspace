import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Thanks, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { LogIn, MessageSquare, Trophy, Award, Users, ChartBar, Star, Heart } from "lucide-react";
import { Link } from "wouter";

function formatUserName(user?: User) {
  if (!user) return "N/A";
  return `${user.name}`;
}

function truncateMessage(message: string, maxLength: number = 100) {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + "...";
}

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
      <div className="space-y-12">
        {/* Enhanced Hero section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(40%_80%_at_50%_50%,var(--primary-50)_0,transparent_100%)] -z-10" />
          <div className="container mx-auto text-center relative">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 animate-ping opacity-20">
                  <Award className="h-16 w-16 text-primary" />
                </div>
                <Award className="h-16 w-16 text-primary relative" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Recognition Portal
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Xây dựng văn hóa công ty thông qua việc ghi nhận và đánh giá đóng góp của mọi người
            </p>
            {!user ? (
              <Link href="/auth">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <LogIn className="w-4 h-4" />
                  Đăng nhập để bắt đầu
                </Button>
              </Link>
            ) : (
              <div className="flex gap-4 justify-center">
                <Link href="/thanks">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                    <MessageSquare className="w-4 h-4" />
                    Gửi lời cảm ơn
                  </Button>
                </Link>
                <Link href="/rankings">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Trophy className="w-4 h-4" />
                    Xem bảng xếp hạng
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {user && (
          <div className="container mx-auto">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3 mb-12">
              <StatsCard 
                icon={MessageSquare} 
                title="Lời cảm ơn"
                value={recentThanks?.length || 0}
                description="Tổng số lời cảm ơn gần đây"
              />
              <StatsCard 
                icon={Users} 
                title="Thành viên"
                value={users?.length || 0}
                description="Số lượng thành viên trong hệ thống"
              />
              <StatsCard 
                icon={Star} 
                title="Điểm cao nhất"
                value={rankings?.[0]?.points || 0}
                description="Điểm cao nhất tháng này"
              />
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Recent Thanks */}
              <section>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle>Lời cảm ơn gần đây</CardTitle>
                        <CardDescription>
                          5 lời cảm ơn mới nhất trong hệ thống
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentThanks?.slice(0, 5).map((thanks) => {
                        const fromUser = users?.find(u => u.id === thanks.fromId);
                        const toUser = users?.find(u => u.id === thanks.toId);
                        return (
                          <div key={thanks.id} className="rounded-lg bg-muted/50 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <p className="text-sm font-medium">
                                  {formatUserName(fromUser)} → {formatUserName(toUser)}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {formatDistance(new Date(thanks.createdAt), new Date(), {
                                  addSuffix: true,
                                })}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {truncateMessage(thanks.message)}
                            </p>
                          </div>
                        );
                      })}
                      {(!recentThanks || recentThanks.length === 0) && (
                        <EmptyState 
                          icon={MessageSquare}
                          message="Chưa có lời cảm ơn nào"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Rankings */}
              <section>
                <Card className="h-full">
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
                          <div key={ranking.userId} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                <span className="text-primary font-bold">#{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{user?.name}</p>
                                <p className="text-sm text-muted-foreground">{user?.title}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="font-mono">
                              {ranking.points} pts
                            </Badge>
                          </div>
                        );
                      })}
                      {(!rankings || rankings.length === 0) && (
                        <EmptyState 
                          icon={Trophy}
                          message="Chưa có dữ liệu xếp hạng"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        )}

        {/* Feature cards for non-logged in users */}
        {!user && (
          <div className="container mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={MessageSquare}
                title="Gửi lời cảm ơn"
                description="Gửi lời cảm ơn đến đồng nghiệp để ghi nhận những đóng góp của họ"
              />
              <FeatureCard
                icon={ChartBar}
                title="Bảng xếp hạng"
                description="Theo dõi và vinh danh những người nhận được nhiều lời cảm ơn nhất"
              />
              <FeatureCard
                icon={Users}
                title="Quản lý hiệu quả"
                description="Quản lý và theo dõi hoạt động của nhân viên một cách minh bạch"
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatsCard({ 
  icon: Icon, 
  title,
  value,
  description
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string; 
  description: string;
}) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="absolute top-4 right-4 transition-transform group-hover:scale-110">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  message
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="text-center py-8">
      <Icon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}