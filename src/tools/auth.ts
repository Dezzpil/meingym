import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/tools/db";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { redirect } from "next/navigation";
import { UserInfo } from "@prisma/client";

// You'll need to import and pass this
// to `NextAuth` in `app/api/auth/[...nextauth]/route.ts`
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_APP_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      // session.userId = user.id;
      session.user = user;
      return Promise.resolve(session);
    },
  },
  events: {
    createUser: async ({ user }) => {
      console.log("New user created:", user.email);
      // Implement your custom logic here
      // For example, sending a welcome email or integrating with third-party services
      await prisma.userInfo.create({
        data: { userId: user.id },
      });
    },
    // You can define handlers for other events as well
  },
} satisfies AuthOptions;

// Use it in server contexts
export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authOptions);
}

export async function getCurrentUserId(): Promise<string | never> {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/404`);
  // @ts-ignore
  return session?.user.id;
}

export async function findUserInfo(userId: string): Promise<UserInfo> {
  const info = await prisma.userInfo.findFirst({ where: { userId } });
  if (!info)
    return prisma.userInfo.create({
      data: { userId },
    });
  return info;
}
