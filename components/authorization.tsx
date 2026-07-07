"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import AllRepo from "./listAllRepo";
export default function Authorization() {
  const { data: session } = useSession();
  console.log(session?.accessToken);

  if (session) {
    return (
      <div>
        <p>Logged in as {session.user?.name}</p>
        <button onClick={() => signOut()}>Sign out</button>
        <AllRepo />
      </div>
    );
  }

  return (
    <div>
      <h1>CodeReview AI</h1>
      <button onClick={() => signIn("github")}>Connect GitHub</button>
    </div>
  );
}
