module BABYLON {
    export class InterpolateValueAction extends Action {
        private _target: any;
        private _effectiveTarget: any;
        private _property: string;

        constructor(triggerOptions: any, target: any, public propertyPath: string, public value: any, public duration: number = 1000, condition?: Condition, public stopOtherAnimations?: boolean, public onInterpolationDone?: () => void) {
            super(triggerOptions, condition);

            this._target = this._effectiveTarget = target;
        }

        public _prepare(): void {
            this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        }

        public execute(): void {
            var scene = this._actionManager.getScene();
            var keys = [
                {
                    frame: 0,
                    value: this._effectiveTarget[this._property]
                }, {
                    frame: 100,
                    value: this.value
                }
            ];

            var dataType: number;

            if (typeof this.value === "number") {
                dataType = Animation.ANIMATIONTYPE_FLOAT;
            } else if (this.value instanceof Color3) {
                dataType = Animation.ANIMATIONTYPE_COLOR3;
            } else if (this.value instanceof Vector3) {
                dataType = Animation.ANIMATIONTYPE_VECTOR3;
            } else if (this.value instanceof Matrix) {
                dataType = Animation.ANIMATIONTYPE_MATRIX;
            } else if (this.value instanceof Quaternion) {
                dataType = Animation.ANIMATIONTYPE_QUATERNION;
            } else {
                Tools.Warn("InterpolateValueAction: Unsupported type (" + typeof this.value + ")");
                return;
            }

            var animation = new Animation("InterpolateValueAction", this._property, 100 * (1000.0 / this.duration), dataType, Animation.ANIMATIONLOOPMODE_CONSTANT);

            animation.setKeys(keys);

            if (this.stopOtherAnimations) {
                scene.stopAnimation(this._effectiveTarget);
            }

            scene.beginDirectAnimation(this._effectiveTarget, [animation], 0, 100, false, 1, this.onInterpolationDone);
        }
        
        public serialize(parent: any): any {
            return super._serialize({
                name: "InterpolateValueAction",
                properties: [
                    Action._GetTargetProperty(this._target),
                    { name: "propertyPath", value: this.propertyPath },
                    { name: "value", value: Action._SerializeValueAsString(this.value) },
                    { name: "duration", value: Action._SerializeValueAsString(this.duration) },
                    { name: "stopOtherAnimations", value: Action._SerializeValueAsString(this.stopOtherAnimations) || false }
                ]
            }, parent);
        }
    }
} 