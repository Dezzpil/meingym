import { prisma } from "@/tools/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/tools/auth";
export default async function WeightsPage() {
  const session = await getServerSession(authOptions);
  console.log(session);
  console.log(session?.user);
  // @ts-ignore
  const userId = session?.user.id;
  const weights = await prisma.weights.findMany({ where: { userId } });
  console.log(weights);

  return (
    <form action="">
      <div className="input-group"></div>
    </form>
  );
}
