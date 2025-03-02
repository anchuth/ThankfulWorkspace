import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Thanks, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";

export function ApprovalList() {
  const { data: approvals } = useQuery<Thanks[]>({
    queryKey: ["/api/approvals"],
  });

  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  if (!approvals?.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No pending approvals
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((thanks) => {
        const fromUser = users?.find((u) => u.id === thanks.fromId);
        const toUser = users?.find((u) => u.id === thanks.toId);

        return (
          <Card key={thanks.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {fromUser?.name} → {toUser?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{thanks.message}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {formatDistance(new Date(thanks.createdAt), new Date(), {
                    addSuffix: true,
                  })}
                </p>
                <ApprovalActions thanksId={thanks.id} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ApprovalActions({ thanksId }: { thanksId: number }) {
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async (action: "approve" | "reject") => {
      const res = await apiRequest(
        "POST",
        `/api/thanks/${thanksId}/${action}`,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Updated",
        description: "The thanks has been processed",
      });
    },
  });

  return (
    <div className="space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => updateMutation.mutate("approve")}
        disabled={updateMutation.isPending}
      >
        <Check className="h-4 w-4 mr-1" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => updateMutation.mutate("reject")}
        disabled={updateMutation.isPending}
      >
        <X className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  );
}
