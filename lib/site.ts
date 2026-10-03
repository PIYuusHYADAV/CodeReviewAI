/* Used by the "View the code" links in the Security & fault tolerance view of /how-it-works. */
export const site = {
  repoUrl: "https://github.com/PIYuusHYADAV/CodeReviewAI",
};

/* Pin to a commit SHA once the repo is pushed: run `git rev-parse HEAD` and paste it here.
   Line ranges were taken from the code as uploaded, so re-check them whenever those files change. */
export const CODE_REF = "main";
export const codeLink = (path: string, lines?: [number, number]) =>
  `${site.repoUrl}/blob/${CODE_REF}/${path}${lines ? `#L${lines[0]}-L${lines[1]}` : ""}`;
