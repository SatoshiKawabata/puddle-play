import { useEffect, useRef, useState } from "react";
import { AudioPeak } from "../../audio/AudioPeak";
import PuddlePlayContainer from "../PuddlePlay/PuddlePlayContainer";
import "./App.css";

function App() {
  const [color, setColor] = useState("#00fbff");
  const [isShowUI, setIsShowUI] = useState(false);
  const [centerValue, setCenterValue] = useState(0);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<
    MediaDeviceInfo["deviceId"] | null
  >(null);
  const peakRef = useRef<AudioPeak>();
  const peakTimerIdRef = useRef<number>();
  const [timeDomainData, setTimeDomainData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    // get color from storage
    const colorStr = localStorage.getItem("color");
    if (colorStr) {
      setColor(colorStr);
    }

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

  useEffect(() => {
    document.addEventListener("keyup", (e) => {
      if (e.key === "g") {
        setIsShowUI(!isShowUI);
      }
    });
  }, [isShowUI]);

  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDeviceId || "" },
      });
      if (peakRef.current) {
        peakRef.current.close();
      }
      peakRef.current = new AudioPeak(stream);
      clearInterval(peakTimerIdRef.current);
      peakTimerIdRef.current = setInterval(() => {
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
      }, 50);
    })();
  }, [selectedDeviceId]);

  return (
    <>
      <PuddlePlayContainer color={color} centerValue={centerValue} />
      {isShowUI && (
        <div className="ui-container">
          <div>
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
          <div>
            <label>
              Audio input
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
              <label>Audio wave form</label>
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
        </div>
      )}
    </>
  );
}

export default App;
