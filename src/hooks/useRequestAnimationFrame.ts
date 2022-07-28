import { useEffect, useRef } from "react";

export const useAnimationFrame = (callback = () => {}) => {
  const reqIdRef = useRef<number>(-1);
  const loop = () => {
    reqIdRef.current = requestAnimationFrame(loop);
    callback();
  };

  useEffect(() => {
    reqIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqIdRef.current);
  }, []);
};
