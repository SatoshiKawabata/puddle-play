import { useEffect, useRef } from "react";
import { PuddlePlay } from "../../webgl/PuddlePlay";
import "./PuddlePlayContainer.css";

interface Props {
  centerValue: number;
  color: THREE.ColorRepresentation;
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

  return <div ref={container} className="three-container" />;
}

export default PuddlePlayContainer;
