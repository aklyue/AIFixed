import { useEffect, useRef, useState } from "react";
import { Location } from "react-router-dom";

export const useTabsChange = (location: Location<any>) => {
  const action = location.state?.action;

  const [tab, setTab] = useState(
    action === "register" ? 1 : action === "login" ? 0 : 1
  );
  const [height, setHeight] = useState<number | "auto">("auto");
  const hiddenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hiddenRef.current) {
      const nextContent = hiddenRef.current.children[tab] as HTMLElement;
      setHeight(nextContent.getBoundingClientRect().height);
    }
  }, []);

  const handleTabChange = (newTab: number) => {
    if (!hiddenRef.current) {
      setTab(newTab);
      return;
    }

    const nextContent = hiddenRef.current.children[newTab] as HTMLElement;
    const newHeight = nextContent.getBoundingClientRect().height;

    setHeight(newHeight);

    setTimeout(() => setTab(newTab), 0);
  };

  return {
    tab,
    handleTabChange,
    height,
    hiddenRef,
  };
};
