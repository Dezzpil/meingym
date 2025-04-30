import { NextRequest, NextResponse } from "next/server";
import { scoresQueue, periodsQueue } from "@/jobs";

export async function GET(request: NextRequest) {
  try {
    // Get queue statistics
    const [scoresJobCounts, periodsJobCounts] = await Promise.all([
      scoresQueue.getJobCounts(),
      periodsQueue.getJobCounts()
    ]);

    // Get active jobs
    const [activeScoresJobs, activePeriodsJobs] = await Promise.all([
      scoresQueue.getActive(),
      periodsQueue.getActive()
    ]);

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
          counts: scoresJobCounts,
          active: formatJobs(activeScoresJobs),
        },
        periods: {
          counts: periodsJobCounts,
          active: formatJobs(activePeriodsJobs),
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
