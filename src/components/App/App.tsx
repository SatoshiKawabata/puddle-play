import { useEffect, useState } from "react";
import PuddlePlayContainer from "../PuddlePlay/PuddlePlayContainer";
import "./App.css";

function App() {
  const [color, setColor] = useState("#00fbff");
  const [isShowUI, setIsShowUI] = useState(false);
  const [centerValue, setCenterValue] = useState(0);

  useEffect(() => {
    // get color from storage
    const colorStr = localStorage.getItem("color");
    if (colorStr) {
      setColor(colorStr);
    }

    // set wave value
    setInterval(() => {
      const t = Date.now() / 500;
      const v = Math.sin(t) + 1 + Math.random();
      console.log(v);
      setCenterValue(v);
    }, 100);
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
      <PuddlePlayContainer color={color} centerValue={centerValue} />
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
