import { Github } from "./github-icon";
import { site } from "../lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
        <p>Built by <a className="text-ink hover:text-brand" href="https://github.com/PIYuusHYADAV" target="_blank" rel="noopener noreferrer">Piyush Yadav</a></p>
        <nav className="flex flex-wrap items-center justify-center gap-5" aria-label="Project links">
          <a className="inline-flex items-center gap-2 hover:text-ink" href={site.repoUrl} target="_blank" rel="noopener noreferrer"><Github size={16} /> Source code</a>
          <a className="hover:text-ink" href="https://github.com/apps/aicodereview001">Install the app</a>
        </nav>
      </div>
    </footer>
  );
}
