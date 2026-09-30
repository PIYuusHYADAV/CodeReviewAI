import { checkRateLimit } from "./rateLimit";
import { RateLimitResult } from "./type";
export async function manualReviewRateLimit(
  repo: string,
  prNumber: number,
): Promise<RateLimitResult> {
  return checkRateLimit(`review:${repo}--${prNumber}`, 1, 60);
}
export async function pullRequestRateLimit(
  repo: string,
  prNumber: number,
): Promise<RateLimitResult> {
  return checkRateLimit(`pr:${repo}--${prNumber}`, 3, 60);
}
export async function prRepoRateLimit(repo: string): Promise<RateLimitResult> {
  return checkRateLimit(`repo:${repo}`, 20, 60);
}
