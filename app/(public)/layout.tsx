import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/shared/whatsapp-button";
import { ChatWidget } from "@/components/chat/chat-widget";
import { getSettings } from "@/lib/data";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <WhatsAppFloat
        number={settings.whatsapp}
        message={settings.whatsapp_default_message}
      />
      <ChatWidget settings={settings} />
    </div>
  );
}
