import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Thanks, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { LogIn, MessageSquare, Trophy, Award, Users, ChartBar, Star, Heart, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { vi } from "date-fns/locale";
import { useState } from "react";

function formatUserName(user?: User) {
  if (!user) return "N/A";
  return `${user.name}`;
}

function truncateMessage(message: string, maxLength: number = 100) {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + "...";
}

function ThanksCard({ thanks, users }: { thanks: Thanks; users?: User[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fromUser = users?.find(u => u.id === thanks.fromId);
  const toUser = users?.find(u => u.id === thanks.toId);

  const isLongMessage = thanks.message.length > 150;
  const displayMessage = isExpanded ? thanks.message : 
    isLongMessage ? `${thanks.message.slice(0, 150)}...` : thanks.message;

  return (
    <div className="rounded-xl bg-muted/50 p-4 transition-all hover:scale-[1.02] hover:bg-muted/70 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-primary" />
            <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {formatUserName(fromUser)} → {formatUserName(toUser)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistance(new Date(thanks.createdAt), new Date(), {
                addSuffix: true,
                locale: vi,
              })}
            </p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className="text-xs bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          Đã duyệt
        </Badge>
      </div>

      <div className="prose prose-sm max-w-none text-muted-foreground">
        <p className={`transition-all duration-300 ${isExpanded ? 'line-clamp-none' : 'line-clamp-3'}`}>
          {displayMessage}
        </p>
      </div>

      {isLongMessage && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-primary/80 hover:text-primary transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Thu gọn
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Xem thêm
            </>
          )}
        </Button>
      )}
    </div>
  );
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
      <div className="relative min-h-screen">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-t from-primary/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative space-y-16 pb-16">
          {/* Hero Section */}
          <section className="relative py-32 overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
              <div className="absolute inset-0 bg-[radial-gradient(50%_100%_at_50%_0%,var(--primary-50)_0,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(50%_100%_at_50%_100%,var(--primary-50)_0,transparent_50%)]" />
            </div>

            <div className="container mx-auto relative">
              <div className="max-w-2xl mx-auto text-center">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 animate-ping opacity-20">
                    <Award className="h-20 w-20 text-primary" />
                  </div>
                  <Award className="h-20 w-20 text-primary relative animate-bounce" />
                </div>

                <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Recognition Portal
                </h1>

                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Xây dựng văn hóa công ty thông qua việc ghi nhận và đánh giá đóng góp của mọi người
                </p>

                {!user ? (
                  <Link href="/auth">
                    <Button size="lg" className="group gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                      <LogIn className="w-5 h-5" />
                      <span>Đăng nhập để bắt đầu</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex gap-4 justify-center">
                    <Link href="/thanks">
                      <Button size="lg" className="group gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                        <MessageSquare className="w-5 h-5" />
                        <span>Gửi lời cảm ơn</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Link href="/rankings">
                      <Button size="lg" variant="outline" className="group gap-2 hover:bg-primary/5">
                        <Trophy className="w-5 h-5" />
                        <span>Xem bảng xếp hạng</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>

          {user && (
            <div className="container mx-auto">
              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-3 mb-16">
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
                  <Card className="h-full overflow-hidden group">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Heart className="w-5 h-5 text-primary animate-pulse" />
                          <div className="absolute -inset-0.5 bg-primary/20 rounded-full blur animate-pulse" />
                        </div>
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
                          return (
                            <ThanksCard key={thanks.id} thanks={thanks} users={users} />
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
                  <Card className="h-full overflow-hidden group">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Trophy className="w-5 h-5 text-yellow-500 animate-pulse" />
                          <div className="absolute -inset-0.5 bg-yellow-500/20 rounded-full blur animate-pulse" />
                        </div>
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
                          const rankedUser = users?.find(u => u.id === ranking.userId);
                          return (
                            <div key={ranking.userId} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 transition-all hover:scale-[1.02] hover:bg-muted/70">
                              <div className="flex items-center gap-4">
                                <div className="relative flex items-center justify-center w-8 h-8">
                                  <div className="absolute inset-0 bg-primary/10 rounded-full" />
                                  <span className="relative text-primary font-bold">#{index + 1}</span>
                                </div>
                                <div>
                                  <p className="font-medium">{rankedUser?.name}</p>
                                  <p className="text-sm text-muted-foreground">{rankedUser?.title}</p>
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
    <Card className="group overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="relative">
          <Icon className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
          <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
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
    <Card className="group overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
      <div className="absolute top-4 right-4 transition-transform group-hover:scale-110">
        <div className="relative">
          <Icon className="w-6 h-6 text-primary" />
          <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
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