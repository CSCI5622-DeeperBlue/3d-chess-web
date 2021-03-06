module BABYLON {
    export class VRDistortionCorrectionPostProcess extends PostProcess {
        public aspectRatio: number;

        private _isRightEye: boolean;
        private _distortionFactors: number[];
        private _postProcessScaleFactor: number;
        private _lensCenterOffset: number;
        private _scaleIn: Vector2;
        private _scaleFactor: Vector2;
        private _lensCenter: Vector2;

        //ANY
        constructor(name: string, camera: Camera, isRightEye: boolean, vrMetrics: VRCameraMetrics) {
            super(name, "vrDistortionCorrection", [
                'LensCenter',
                'Scale',
                'ScaleIn',
                'HmdWarpParam'
            ], null, vrMetrics.postProcessScaleFactor, camera, Texture.BILINEAR_SAMPLINGMODE, null, null);

            this._isRightEye = isRightEye;
            this._distortionFactors = vrMetrics.distortionK;
            this._postProcessScaleFactor = vrMetrics.postProcessScaleFactor;
            this._lensCenterOffset = vrMetrics.lensCenterOffset;

            this.onSizeChangedObservable.add(() => {
                this.aspectRatio = this.width * .5 / this.height;
                this._scaleIn = new Vector2(2, 2 / this.aspectRatio);
                this._scaleFactor = new Vector2(.5 * (1 / this._postProcessScaleFactor), .5 * (1 / this._postProcessScaleFactor) * this.aspectRatio);
                this._lensCenter = new Vector2(this._isRightEye ? 0.5 - this._lensCenterOffset * 0.5 : 0.5 + this._lensCenterOffset * 0.5, 0.5);
            });
            this.onApplyObservable.add((effect: Effect) => {
                effect.setFloat2("LensCenter", this._lensCenter.x, this._lensCenter.y);
                effect.setFloat2("Scale", this._scaleFactor.x, this._scaleFactor.y);
                effect.setFloat2("ScaleIn", this._scaleIn.x, this._scaleIn.y);
                effect.setFloat4("HmdWarpParam", this._distortionFactors[0], this._distortionFactors[1], this._distortionFactors[2], this._distortionFactors[3]);
            });
        }
    }
}
