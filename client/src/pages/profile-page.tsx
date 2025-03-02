import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Thanks } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: stats } = useQuery<{ received: Thanks[]; sent: Thanks[] }>({
    queryKey: [`/api/stats/${user!.id}`],
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-start gap-4">
          <UserCircle className="h-16 w-16 text-primary" />
          <div>
            <h1 className="text-3xl font-bold mb-2">{user?.name}</h1>
            <p className="text-muted-foreground">
              {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
            </p>
            <p className="text-muted-foreground">
              Mã số nhân viên: {user?.username}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Lời cảm ơn đã nhận</h2>
            <div className="space-y-4">
              {stats?.received.map((thanks) => (
                <ThanksCard key={thanks.id} thanks={thanks} />
              ))}
              {(!stats?.received || stats.received.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Chưa có lời cảm ơn nào
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Lời cảm ơn đã gửi</h2>
            <div className="space-y-4">
              {stats?.sent.map((thanks) => (
                <ThanksCard key={thanks.id} thanks={thanks} />
              ))}
              {(!stats?.sent || stats.sent.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Chưa gửi lời cảm ơn nào
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

function ThanksCard({ thanks }: { thanks: Thanks }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {formatDistance(new Date(thanks.createdAt), new Date(), {
            addSuffix: true,
          })}
        </CardTitle>
        <Badge variant={thanks.status === "approved" ? "default" : "secondary"}>
          {thanks.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{thanks.message}</p>
      </CardContent>
    </Card>
  );
}
