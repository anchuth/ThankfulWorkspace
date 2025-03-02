import { Layout } from "@/components/layout";
import { Rankings } from "@/components/rankings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Thanks } from "@shared/schema";
import { Award, Send, ThumbsUp } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useQuery<{ received: Thanks[]; sent: Thanks[] }>({
    queryKey: [`/api/stats/${user!.id}`],
  });

  const receivedCount = stats?.received.length ?? 0;
  const sentCount = stats?.sent.length ?? 0;
  const approvedCount = stats?.received.filter(
    (t) => t.status === "approved"
  ).length ?? 0;

  return (
    <Layout>
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Received"
            value={receivedCount}
            description="Thanks received"
            icon={<ThumbsUp className="h-4 w-4" />}
          />
          <StatsCard
            title="Sent"
            value={sentCount}
            description="Thanks sent"
            icon={<Send className="h-4 w-4" />}
          />
          <StatsCard
            title="Approved"
            value={approvedCount}
            description="Thanks approved"
            icon={<Award className="h-4 w-4" />}
          />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Rankings</h2>
          <Tabs defaultValue="week">
            <TabsList>
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="quarter">Quarterly</TabsTrigger>
              <TabsTrigger value="year">Yearly</TabsTrigger>
            </TabsList>
            <TabsContent value="week">
              <Rankings period="week" />
            </TabsContent>
            <TabsContent value="month">
              <Rankings period="month" />
            </TabsContent>
            <TabsContent value="quarter">
              <Rankings period="quarter" />
            </TabsContent>
            <TabsContent value="year">
              <Rankings period="year" />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Layout>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
