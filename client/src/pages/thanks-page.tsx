import { Layout } from "@/components/layout";
import { SendThanks } from "@/components/send-thanks";

export default function ThanksPage() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gửi lời cảm ơn</h1>
          <p className="text-muted-foreground">
            Hãy gửi lời cảm ơn đến đồng nghiệp để ghi nhận những đóng góp của họ
          </p>
        </div>

        <SendThanks />
      </div>
    </Layout>
  );
}
