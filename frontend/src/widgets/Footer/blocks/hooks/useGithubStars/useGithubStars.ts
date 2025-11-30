import { useEffect, useState } from "react";
import { getGithubStars } from "../../../../../entities";

export function useGithubStars() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    getGithubStars().then((value) => {
      if (mounted) setStars(value);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { stars };
}
