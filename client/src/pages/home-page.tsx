import { Layout } from "@/components/layout";
import { SendThanks } from "@/components/send-thanks";
import { useQuery } from "@tanstack/react-query";
import { Thanks, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { ApprovalList } from "@/components/approval-list";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const { data: stats } = useQuery<{ received: Thanks[]; sent: Thanks[] }>({
    queryKey: [`/api/stats/${user?.id}`],
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
          {!user && (
            <Link href="/auth">
              <Button size="lg" className="gap-2">
                <LogIn className="w-4 h-4" />
                Đăng nhập để bắt đầu
              </Button>
            </Link>
          )}
        </section>

        {user ? (
          <>
            <SendThanks />

            {user?.role === "manager" && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Pending Approvals</h2>
                <ApprovalList />
              </section>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Received Thanks</h2>
                <div className="space-y-4">
                  {stats?.received.map((thanks) => (
                    <ThanksCard key={thanks.id} thanks={thanks} type="received" />
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Sent Thanks</h2>
                <div className="space-y-4">
                  {stats?.sent.map((thanks) => (
                    <ThanksCard key={thanks.id} thanks={thanks} type="sent" />
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
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

function ThanksCard({ thanks, type }: { thanks: Thanks; type: "sent" | "received" }) {
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const fromUser = users?.find((u) => u.id === thanks.fromId);
  const toUser = users?.find((u) => u.id === thanks.toId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {type === "received" ? `From ${fromUser?.name}` : `To ${toUser?.name}`}
        </CardTitle>
        <Badge variant={thanks.status === "approved" ? "default" : "secondary"}>
          {thanks.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{thanks.message}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistance(new Date(thanks.createdAt), new Date(), {
            addSuffix: true,
          })}
        </p>
      </CardContent>
    </Card>
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