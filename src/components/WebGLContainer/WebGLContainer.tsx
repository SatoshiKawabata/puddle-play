import { useEffect, useRef } from "react";
import "./WebGLContainer.css";
import { Puddle } from "../../webgl/Puddle";

function WEbGLContainer() {
  const threeContainer = useRef<HTMLDivElement>(null);
  const puddleRef = useRef<Puddle | null>(null);

  useEffect(() => {
    if (!threeContainer.current) {
      return;
    }
    puddleRef.current = new Puddle(threeContainer.current);
  }, [threeContainer.current]);

  return <div ref={threeContainer} className="three-container" />;
}

export default WEbGLContainer;
