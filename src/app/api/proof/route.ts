import { errorResponse } from "@/lib/access";
import { memoryStats } from "@/lib/memory";
import { getLatestCheckpoint } from "@/lib/tatum";

export async function GET() {
  try {
    const [memory, checkpoint] = await Promise.all([memoryStats(), getLatestCheckpoint()]);
    return Response.json({ memory, tatum: { network: "sui:mainnet", latestCheckpoint: checkpoint } });
  } catch (e) {
    return errorResponse(e);
  }
}
