export interface ILocalStorage {
  saveColor(color: string): void;
  getColor(): string;
  saveDamp(damp: number): void;
  getDamp(): number;
}
