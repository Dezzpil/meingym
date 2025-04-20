import { NextRequest, NextResponse } from "next/server";
import { scoresQueue } from "@/jobs";

export async function GET(request: NextRequest) {
  try {
    // Get queue statistics
    const [actionsJobCounts] = await Promise.all([scoresQueue.getJobCounts()]);

    // Get active jobs
    const [activeScoresJobs] = await Promise.all([scoresQueue.getActive()]);

    // Format active jobs to include only essential information
    const formatJobs = (jobs: any[]) =>
      jobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress(),
        timestamp: job.timestamp,
        attemptsMade: job.attemptsMade,
        stacktrace: job.stacktrace,
        returnvalue: job.returnvalue,
      }));

    return NextResponse.json({
      queues: {
        scores: {
          counts: actionsJobCounts,
          active: formatJobs(activeScoresJobs),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 },
    );
  }
}
