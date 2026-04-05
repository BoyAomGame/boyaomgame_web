import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="max-w-sm w-full text-center space-y-10">
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-on-surface to-on-surface-variant/50">
            UserLooker
          </h1>
          <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
            Sign in with your Discord account to access precision analytics for
            Discord and Roblox ecosystems.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("discord");
          }}
        >
          <button
            type="submit"
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#5865F2]/20"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_circle
            </span>
            Sign in with Discord
          </button>
        </form>

        <p className="text-[10px] text-outline uppercase tracking-widest">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
