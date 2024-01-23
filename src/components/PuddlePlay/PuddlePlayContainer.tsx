import { useEffect, useRef } from "react";
import { PuddlePlay } from "../../webgl/PuddlePlay";
import "./PuddlePlayContainer.css";
import { useHotkeys } from "react-hotkeys-hook";

interface Props {
  centerValue: number;
  color: THREE.ColorRepresentation;
  damp: number;
}
function PuddlePlayContainer(p: Props) {
  const container = useRef<HTMLDivElement>(null);
  const puddlePlayRef = useRef<PuddlePlay | null>(null);

  useEffect(() => {
    if (!container.current || puddlePlayRef.current) {
      return;
    }
    puddlePlayRef.current = new PuddlePlay(container.current);
  }, [container.current]);

  useEffect(() => {
    if (!puddlePlayRef.current) {
      return;
    }
    puddlePlayRef.current.setCenterValue(p.centerValue);
  }, [p.centerValue]);

  useEffect(() => {
    if (!puddlePlayRef.current) {
      return;
    }
    puddlePlayRef.current.setColor(p.color);
  }, [p.color]);

  useEffect(() => {
    if (!puddlePlayRef.current) {
      return;
    }
    puddlePlayRef.current.setDamp(p.damp);
  }, [p.damp]);

  useHotkeys("c", () => {
    puddlePlayRef.current?.setCenter();
  });

  useHotkeys("shift+c", () => {
    puddlePlayRef.current?.resetCenter();
  });

  return <div ref={container} className="three-container" />;
}

export default PuddlePlayContainer;
