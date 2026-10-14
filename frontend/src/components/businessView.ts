export type BusinessCamera = { x: number; y: number; z: number };
export interface BusinessViewState {
  camera: BusinessCamera;
  held: boolean;
  history: BusinessCamera[];
}
export const initialBusinessView = (): BusinessViewState => ({
  camera: { x: 0, y: 0, z: 1 },
  held: false,
  history: [],
});
