import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { GitHubRepo } from "../lib/type";
async function fetchInfo(token: string | undefined) {
  if (token === undefined) throw new Error("Token not fetched");
  const response = await fetch("https://api.github.com/user/repos", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const repos = await response.json();

  return repos;
}

export default function AllRepo() {
  const [repoCollection, setrepoCollection] = useState<GitHubRepo[]>([]);
  const { data: session } = useSession();
  useEffect(() => {
    async function allreposlist() {
      if (!session?.accessToken) return;

      const responses = await fetchInfo(session.accessToken);
      setrepoCollection(responses);
    }
    allreposlist();
  }, [session]);

  return (
    <div>
      <h2>Your Repositories</h2>

      {repoCollection.map((repo) => (
        <div key={repo.id}>
          <h3>{repo.name}</h3>
          <p>{repo.full_name}</p>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
            View Repository
          </a>
          <p>{repo.private ? "Private" : "Public"}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}
