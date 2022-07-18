import { useEffect, useState } from "react";
import PuddlePlayContainer from "../PuddlePlay/PuddlePlayContainer";
import "./App.css";

function App() {
  const [color, setColor] = useState("#00fbff");
  const [isShowUI, setIsShowUI] = useState(false);

  useEffect(() => {
    // get color from storage
    const colorStr = localStorage.getItem("color");
    if (colorStr) {
      setColor(colorStr);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keyup", (e) => {
      if (e.key === "g") {
        setIsShowUI(!isShowUI);
      }
    });
  }, [isShowUI]);

  return (
    <>
      <PuddlePlayContainer color={color} centerValue={1} />
      {isShowUI && (
        <div className="ui-container">
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              // save color
              localStorage.setItem("color", e.target.value);
            }}
          />
        </div>
      )}
    </>
  );
}

export default App;
