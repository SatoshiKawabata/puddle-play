import { ILocalStorage } from "../usecase/ILocalStorage";

export const useLocalStorage = (): ILocalStorage => {
  return {
    saveColor(color: string) {
      localStorage.setItem("color", color);
    },
    getColor() {
      const colorStr = localStorage.getItem("color");
      if (colorStr) {
        return colorStr;
      }
      return "#00fbff";
    },
    saveDamp(damp: number) {
      localStorage.setItem("damp", damp + "");
    },
    getDamp() {
      const dampStr = localStorage.getItem("damp");
      if (dampStr) {
        return Number(dampStr);
      }
      return 0.999;
    },
  };
};
