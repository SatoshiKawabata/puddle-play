import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "../../adapter/useLocalStorage";
import { AudioPeak } from "../../audio/AudioPeak";
import { useAnimationFrame } from "../../hooks/useRequestAnimationFrame";
import PuddlePlayContainer from "../PuddlePlay/PuddlePlayContainer";
import "./App.css";
import { useHotkeys } from "react-hotkeys-hook";
import { hexToHsv, hsvToHex } from "../../utils/colorUtilts";

function App() {
  const [isShowUI, setIsShowUI] = useState(false);
  const [centerValue, setCenterValue] = useState(0);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<
    MediaDeviceInfo["deviceId"] | null
  >(null);
  const peakRef = useRef<AudioPeak>();
  const peakTimerIdRef = useRef<number>();
  const [timeDomainData, setTimeDomainData] = useState<Uint8Array | null>(null);
  const { getColor, getDamp, saveColor, saveDamp } = useLocalStorage();
  const [color, setColor] = useState(getColor());
  const [damp, setDamp] = useState(getDamp());

  useEffect(() => {
    (async () => {
      // get devices
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceInfos.filter((di) => di.kind === "audioinput");
      console.log(audioInputs);
      setAudioInputs(audioInputs);
      // saved device
      const storedDeviceId = localStorage.getItem("selectedDeviceId");
      const memoriedDevice = audioInputs.find(
        (ai) => ai.deviceId === storedDeviceId
      );
      if (memoriedDevice) {
        setSelectedDeviceId(memoriedDevice.deviceId);
      } else {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    })();
  }, []);

  // ショートカットキー
  useHotkeys("h", () => {
    // 色相を変化させる
    const [h, s, v] = hexToHsv(color);
    let newH = h + 0.01;
    if (newH > 1) {
      newH = 0;
    }
    const hex = hsvToHex(newH, s, v);
    setColor(hex);
  });

  useHotkeys("g", () => {
    setIsShowUI(!isShowUI);
  });

  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDeviceId || "" },
      });
      if (peakRef.current) {
        peakRef.current.close();
      }
      peakRef.current = new AudioPeak(stream);
    })();
  }, [selectedDeviceId]);

  useAnimationFrame(() => {
    if (peakRef.current) {
      const peakValue = peakRef.current.getCurrentPeak();
      setCenterValue(peakValue * 100);
      const timeDomain = peakRef.current.getTimeDomainByteArray();
      setTimeDomainData(
        timeDomain.map((value) => {
          return value;
        })
      );
    }
  });

  return (
    <>
      <PuddlePlayContainer
        color={color}
        centerValue={centerValue}
        damp={damp}
      />
      {isShowUI && (
        <div className="ui-container">
          <div>
            <label>Wave Color: </label>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                saveColor(e.target.value);
              }}
            />
          </div>
          <div>
            <label>
              Audio input:&nbsp;
              <select
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                }}
              >
                {audioInputs.map((ai) => (
                  <option
                    value={ai.deviceId}
                    selected={ai.deviceId === selectedDeviceId}
                  >
                    {ai.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {timeDomainData && (
            <div>
              <label>Audio wave form:&nbsp;</label>
              {Array.from(timeDomainData).map((td) => {
                return (
                  <div
                    style={{
                      height: 3,
                      marginBottom: 2,
                      width: `${td}px`,
                      backgroundColor: "red",
                    }}
                  ></div>
                );
              })}
            </div>
          )}
          <div>
            <label>Damping factor: </label>
            <input
              type="range"
              min={0}
              max={10000}
              value={(10000 / 0.1) * (damp - 0.9)}
              onChange={(e) => {
                const val = Number(e.target.value);
                const newDamp = 0.9 + (val * 0.1) / 10000;
                setDamp(newDamp);
                saveDamp(newDamp);
              }}
              style={{ width: 300 }}
            ></input>
            {damp}
          </div>
          <div>
            <h2>shortcut keys</h2>
            <ul>
              <li>h: change color</li>
              <li>c: set wave center at mouse pointer</li>
              <li>shift + c: reset wave center on the center of screen</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
