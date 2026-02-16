export function calculateEarnings(jobs) {
  return jobs
    .filter((job) => job.status === 'delivered')
    .reduce((sum, job) => sum + Math.max(0, job.payout), 0);
}
