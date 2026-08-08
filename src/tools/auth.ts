import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { prisma } from "@/tools/db";
// import GitHubProvider from "next-auth/providers/github";
// import GoogleProvider from "next-auth/providers/google";
import VkProvider from "next-auth/providers/vk";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/tools/password";
import { redirect } from "next/navigation";
import { ActionRequire, ActionRig, User, UserInfo } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const ENABLE_OAUTH = false;

export async function setupNewUser(
  userId: string,
  tx?: PrismaTransactionClient,
) {
  const client = tx || prisma;
  await client.userInfo.create({
    data: { userId },
  });

  await client.equipment.create({
    data: {
      userId,
      name: "Тренажерный зал",
      isDefault: true,
      Rigs: {
        createMany: {
          data: [
            { type: ActionRig.BARBELL, minWeight: 10, step: 5, maxWeight: 200 },
            { type: ActionRig.BLOCKS, minWeight: 5, step: 1, maxWeight: 200 },
            { type: ActionRig.DUMBBELL, minWeight: 5, step: 2.5, maxWeight: 50 },
            { type: ActionRig.KETTLEBELL, minWeight: 6, step: 2, maxWeight: 30 },
          ],
        },
      },
      Requires: {
        createMany: {
          data: [
            { type: ActionRequire.BENCH },
            { type: ActionRequire.UPBAR },
            { type: ActionRequire.SIMULATOR },
          ],
        },
      },
    },
  });
}

// You'll need to import and pass this
// to `NextAuth` in `app/api/auth/[...nextauth]/route.ts`
export const authOptions = {
  // adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 },
  providers: [
    ...(ENABLE_OAUTH
      ? [
          // GitHubProvider({
          //   clientId: process.env.GITHUB_APP_ID as string,
          //   clientSecret: process.env.GITHUB_SECRET as string,
          // }),
          // GoogleProvider({
          //   clientId: process.env.GOOGLE_CLIENT_ID as string,
          //   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          //   allowDangerousEmailAccountLinking: true,
          // }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;
        const isValid = await verifyPassword(
          credentials.password,
          user.password,
        );
        if (!isValid) return null;
        // Return user WITHOUT password field
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub as string },
        });
        if (user) {
          const { password, ...safeUser } = user;
          // @ts-ignore
          session.user = safeUser;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  events: {
    createUser: async ({ user }) => {
      if (user.email) {
        const existed = await prisma.user.findFirst({
          where: { email: user.email },
        });
        if (existed) return;
      }
      await setupNewUser(user.id);
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

export const getCurrentUser = cache(async (): Promise<User | never> => {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/404`);
  // @ts-ignore
  return session?.user as User;
});

export async function getCurrentUserId(): Promise<string | never> {
  return (await getCurrentUser()).id;
}

export const findUserInfo = cache(async (userId: string): Promise<UserInfo> => {
  const info = await prisma.userInfo.findFirst({ where: { userId } });
  if (!info)
    return prisma.userInfo.create({
      data: { userId },
    });
  return info;
});
