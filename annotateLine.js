const addAnnotation = (fabric)=>{
    const HANDLE_RADIUS = 10;
    const MIN_THICKNESS = 2;
    const MAX_THICKNESS = 250;
    const RAD_360 = Math.PI * 2;
    const numberPrecision= 8;
    const keyboardShift= 16;
    const RAD_90 = Math.PI / 2;
    const RAD_180 = Math.PI;
    const RAD_270 = Math.PI * (3 / 2);

    const getTriangleSizeByThickness = arrowSize => arrowSize;

    const toFixed = fabric.util.toFixed;

    const extrapolatePoints = (p1, p2, ratio) =>
        new fabric.Point(p1.x + (p2.x - p1.x) * ratio, p1.y + (p2.y - p1.y) * ratio);

    const getSnapAngleForAngle = angle => {
        const snapAngleStep = 15;
        const minAngle = Math.floor(angle / snapAngleStep) * snapAngleStep;
        const maxAngle = Math.ceil(angle / snapAngleStep) * snapAngleStep;
        if (Math.abs(angle - minAngle) < Math.abs(angle - maxAngle)) {
            return minAngle;
        }
        return maxAngle;
    };

    const canvasEventProxy = (listener, _this) => o => {
        if (_this.canvas) {
            listener.call(_this, o);
        }
    };

    const pointProperties = 'x1 y1 x2 y2'.split(' ');
    const ownProperties = 'arrowSize arrow1 arrow2 p1 p2 custom'.split(' ');
    const cacheProperties = fabric.Object.prototype.cacheProperties.concat(
        ownProperties,
    );
    const stateProperties = fabric.Object.prototype.stateProperties.concat(
        ownProperties,
    );
    const getGradientAngleFromFabricGradientCoords = (
        coords,
        offset = -RAD_90,
    ) => {
        if (!coords) {
            return offset;
        }
        const dx = coords.x2 - coords.x1;
        const dy = coords.y2 - coords.y1;
        const radians = ((Math.atan2(dy, dx) + RAD_360) % RAD_360) + offset; // output 0 - 2PI
        return fabric.util.radiansToDegrees(radians);
    };
    const getFabricGradient = (
        gradientData,
        width,
        height,
        offsetX = 0,
        offsetY = 0,
        centered = true,
    ) => {
        const { type, angle, colorStops } = gradientData;

        const w = width;
        const h = height;
        const tl = centered
            ? new fabric.Point(-w / 2, -h / 2)
            : new fabric.Point(0, 0);
        const tr = centered
            ? new fabric.Point(w / 2, -h / 2)
            : new fabric.Point(w, 0);
        const bl = centered
            ? new fabric.Point(-w / 2, h / 2)
            : new fabric.Point(0, h);
        const br = centered ? new fabric.Point(w / 2, h / 2) : new fabric.Point(w, h);

        const realCenter = new fabric.Point(0, 0);
        const center = tl.midPointFrom(br);

        let coords;
        let gradientTransform;

        if (type === 'radial') {
            coords = {
                x1: center.x,
                y1: center.y,
                x2: center.x,
                y2: center.y,
                r1: 0,
                r2: w,
            };

            const tx = centered ? w / 2 : 0;
            const ty = centered ? h / 2 : 0;
            gradientTransform = [1, 0, 0, 1, tx, ty];
        } else {
            const rad = fabric.util.degreesToRadians(angle) % RAD_360;
            let cornerPoint;
            let side;
            let offset;

            if (rad >= 0 && rad < RAD_90) {
                cornerPoint = tr;
                side = Math.abs(cornerPoint.y - center.y);
                offset = 0;
            } else if (rad >= RAD_90 && rad < RAD_180) {
                cornerPoint = br;
                side = Math.abs(cornerPoint.x - center.x);
                offset = RAD_90;
            } else if (rad >= RAD_180 && rad < RAD_270) {
                cornerPoint = bl;
                side = Math.abs(cornerPoint.y - center.y);
                offset = RAD_180;
            } else {
                cornerPoint = tl;
                side = Math.abs(cornerPoint.x - center.x);
                offset = RAD_270;
            }

            const hyp = center.distanceFrom(cornerPoint);
            const cornerAngle = (Math.acos(side / hyp) + RAD_360) % RAD_360; // output 0 - 2PI
            const angleDiff = Math.abs(cornerAngle - (rad - offset));
            const dist = hyp * Math.cos(angleDiff);

            const x1 = center.x + dist * Math.sin(rad);
            const y1 = center.y - dist * Math.cos(rad);
            const p1 = new fabric.Point(x1, y1);
            const p2 = extrapolatePoints(p1, center, 2);
            const x2 = p2.x;
            const y2 = p2.y;

            coords = {
                x1: realCenter.x + offsetX + x1,
                y1: realCenter.y + offsetY + y1,
                x2: realCenter.x + offsetX + x2,
                y2: realCenter.y + offsetY + y2,
            };
        }

        return new fabric.Gradient({
            type,
            coords,
            colorStops,
            gradientTransform,
        });
    };

    fabric.LineAnnotateArrow = fabric.util.createClass(fabric.Object,{
        type: 'LineAnnotateArrow',
        arrowSize: 20,
        arrow1: true,
        arrow2: false,
        strokeWidth: 10,
        originX: 'center',
        originY: 'center',
        hasBorders: true,
        objectCaching: false,
        noScaleCache: true,
        lockSkewingX: true,
        lockSkewingY: true,
        lockUniScaling: false,
        length: 0,
        // padding: 5,
        perPixelTargetFind: false,
        cacheProperties,
        stateProperties,
        scaleX: 1,
        scaleY: 1,
        p1: { x: -50, y: 0 },
        p2: { x: 50, y: 0 },
        canvas:null,

        initialize: function(options) {
            this.canvas = options.canvas
            // if no strokeWidth, rendering issue can occur
            const optionsFixed = {
                ...options,
                originX: 'center',
                originY: 'center',
                custom: { ...options.custom, type: 'line' },
            };

            if (options[1]) {
                // object to migrate
                const p1 = new fabric.Point(options[0], options[1]);
                const p2 = { x: options[2], y: options[3] };
                const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

                const width = p1.distanceFrom(p2);
                const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
                optionsFixed.left = midPoint.x;
                optionsFixed.top = midPoint.y;
                optionsFixed.width = width;
                optionsFixed.height = 5;
                optionsFixed.angle = angle;
            }
            if (options.thickness) {
                // migrate data
                optionsFixed.arrowSize = options.thickness ** (8 / 10) * 10 - 6;
                optionsFixed.stroke = options.fill;
                optionsFixed.strokeWidth = options.thickness;

                delete optionsFixed.thickness;
            }

            this.callSuper('initialize', optionsFixed);
            // Set all controls hidden here and keep 'hasControls' to true, so we can hook into
            // Fabric internal controls drawing system.
            this.setControlsVisibility({
                tl: false,
                tr: false,
                br: false,
                bl: false,
                ml: false,
                mt: false,
                mr: false,
                mb: false,
                mtr: false,
            });

            this.lockSkewingX = true;
            this.lockSkewingY = true;
            this.skewX = 0;
            this.skewY = 0;

            this.on('removed', () => {
                this.removeCanvasListeners();
            });
            // this.applyStrokeStyle();
            this.canvasSelectionCreatedHandler = canvasEventProxy(
                this.onCanvasSelectionCreated,
                this,
            );
            this.canvasSelectionClearedHandler = canvasEventProxy(
                this.onCanvasSelectionCleared,
                this,
            );
            this.canvasMouseDownHandler = canvasEventProxy(
                this.onCanvasMouseDown,
                this,
            );
            this.canvasMouseUpHandler = canvasEventProxy(this.onCanvasMouseUp, this);
            this.canvasMouseMoveHandler = canvasEventProxy(
                this.onCanvasMouseMove,
                this,
            );
            this.shiftKeyActive = false;
            this.initialized = true;
        },

        getPointsFromCoordsArray: function(array) {
            const x1 = array[0];
            const y1 = array[1];
            const x2 = array[2];
            const y2 = array[3];
            return {
                p1: new fabric.Point(x1, y1),
                p2: new fabric.Point(x2, y2),
            };
        },

        getMaxThicknessByLength: function(length) {
            let arrowsVisible = 0;
            if (this.arrow1) arrowsVisible += 1;
            if (this.arrow2) arrowsVisible += 1;
            if (arrowsVisible === 0) {
                return MAX_THICKNESS;
            }
            return Math.min(
                MAX_THICKNESS,
                ((length / arrowsVisible + 6) / 10) ** (10 / 8),
            );
        },

        getMinLengthFromArrowSize: function() {
            const size = getTriangleSizeByThickness(this.arrowSize);
            let arrowsVisible = 0;
            if (this.arrow1) arrowsVisible += 1;
            if (this.arrow2) arrowsVisible += 1;
            return size * arrowsVisible;
        },

        getLocalP1: function() {
            return new fabric.Point(-this.width / 2, 0);
        },

        getLocalP2: function() {
            return new fabric.Point(this.width / 2, 0);
        },

        getGlobalPoint: function(localPoint) {
            const radians = fabric.util.degreesToRadians(this.angle);
            const rotatedPoint = fabric.util.rotatePoint(
                localPoint,
                new fabric.Point(0, 0),
                radians,
            );
            return rotatedPoint.multiply(this.scaleX).add(this.getCenterPoint());
        },

        getGlobalP1: function() {
            return new fabric.Point(this.x1, this.y1);
        },

        getGlobalP2: function() {
            return new fabric.Point(this.x2, this.y2);
        },

        isPointInsideTarget: function(point, targetPoint, radius) {
            return (
                targetPoint.distanceFrom(point) < (radius * 2) / this.canvas.getZoom()
            );
        },

        isPointInsideHandle: function(point, handlePoint) {
            return this.isPointInsideTarget(point, handlePoint, HANDLE_RADIUS);
        },

        isPointInsideP1Handle: function(point) {
            return this.isPointInsideHandle(point, this.getGlobalP1());
        },

        isPointInsideP2Handle: function(point) {
            return this.isPointInsideHandle(point, this.getGlobalP2());
        },

        setCoords: function(ignoreZoom, skipAbsolute) {
            this.updateCoords();
            const coords = this.callSuper('setCoords', ignoreZoom, skipAbsolute);
            this.updateGradient();
            return coords;
        },

        getCoords:function(absolute, calculate) {
            if (!this.oCoords) {
                this.setCoords();
            }
            if (absolute) {
                const tl = {
                    x: this.x1,
                    y: this.y1,
                };
                const tr = {
                    x: this.x2,
                    y: this.y1,
                };
                const br = {
                    x: this.x1,
                    y: this.y2,
                };
                const bl = {
                    x: this.x2,
                    y: this.y2,
                };
                this.aCoords = {
                    tl,
                    tr,
                    br,
                    bl,
                };
            }
            const coords = absolute ? this.aCoords : this.oCoords;
            return this.getCoordsAsPoints(
                calculate ? this.calcCoords(absolute) : coords,
            );
        },

        getCoordsAsPoints:function(coords) {
            return [
                new fabric.Point(coords.tl.x, coords.tl.y),
                new fabric.Point(coords.tr.x, coords.tr.y),
                new fabric.Point(coords.br.x, coords.br.y),
                new fabric.Point(coords.bl.x, coords.bl.y),
            ];
        },

        getLength:function(p1, p2) {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            return Math.sqrt(dx * dx + dy * dy);
        },

        // getBoundingRect(absolute, calculate) {
        //   const coords = [
        //     {
        //       x: this.x1,
        //       y: this.y1,
        //     },
        //     {
        //       x: this.x2,
        //       y: this.y1,
        //     },
        //     {
        //       x: this.x1,
        //       y: this.y2,
        //     },
        //     {
        //       x: this.x2,
        //       y: this.y2,
        //     }];
        //   return fabric.util.makeBoundingBoxFromPoints(coords);
        // },

        updateCoords:function() {
            // const groupScale = this.getObjectScaling();
            const height = Math.max(this.strokeWidth, 2);
            this.updateP1Coords(this.getGlobalPoint(this.getLocalP1()));
            this.updateP2Coords(this.getGlobalPoint(this.getLocalP2()));
            this.length = this.getLineMeasuresBetweenPoints(
                this.getGlobalP1(),
                this.getGlobalP2(),
            ).distance;
            this.set({
                width: this.length,
                height, // / groupScale.scaleY,
                scaleX: 1,
                scaleY: 1,
            });
        },

        updateP1Coords:function(coords) {
            this.x1 = toFixed(coords.x, numberPrecision);
            this.y1 = toFixed(coords.y, numberPrecision);
        },

        updateP2Coords:function(coords) {
            this.x2 = toFixed(coords.x, numberPrecision);
            this.y2 = toFixed(coords.y, numberPrecision);
        },

        updateWithPoints:function(p1, p2) {
            const measures = this.getLineMeasuresBetweenPoints(p1, p2);
            this.set({
                left: toFixed(measures.center.x, numberPrecision),
                top: toFixed(measures.center.y, numberPrecision),
                angle: measures.degrees,
                width: measures.distance / this.scaleX,
            });
        },

        updateWithP1Point:function(p1) {
            this.updateWithPoints(p1, this.getGlobalP2());
        },

        updateWithP2Point:function(p2) {
            this.updateWithPoints(this.getGlobalP1(), p2);
        },

        updateWithPoint:function(index, p) {
            if (index === 1) {
                this.updateWithP1Point(p);
            } else if (index === 2) {
                this.updateWithP2Point(p);
            }
        },

        addCanvasListeners:function() {
            if (!this.canvas) {
                return;
            }
            // Be sure to remove all existing listeners before adding new ones
            this.removeCanvasListeners();
            this.canvas.on('selection:created', this.canvasSelectionCreatedHandler);
            this.canvas.on('selection:cleared', this.canvasSelectionClearedHandler);
            this.canvas.on('mouse:down', this.canvasMouseDownHandler);
            this.canvas.on('mouse:up', this.canvasMouseUpHandler);
            this.canvas.on('mouse:move', this.canvasMouseMoveHandler);
        },

        removeCanvasListeners:function() {
            if (!this.canvas) {
                return;
            }
            this.canvas.off('selection:created', this.canvasSelectionCreatedHandler);
            this.canvas.off('selection:cleared', this.canvasSelectionClearedHandler);
            this.canvas.off('mouse:down', this.canvasMouseDownHandler);
            this.canvas.off('mouse:up', this.canvasMouseUpHandler);
            this.canvas.off('mouse:move', this.canvasMouseMoveHandler);
        },

        // Return true or false to tell whether the keystroke was handled or not
        onKeyDownWithKey:function(key) {
            if (key === keyboardShift) {
                this.shiftKeyActive = true;
                return true;
            }
            return false;
        },

        // Return true or false to tell whether the keystroke was handled or not
        onKeyUpWithKey:function(key) {
            if (key === keyboardShift) {
                this.shiftKeyActive = false;
                return true;
            }
            return false;
        },

        // Object subclass implementation
        onSelect:function() {
            this.setSelected(true);
            return false; // return false to allow selection (yes, this is counterintuitive)
        },

        // Object subclass implementation
        onDeselect:function() {
            this.setSelected(false);
            return false; // return false to allow deselection (yes, this is counterintuitive)
        },

        setSelected:function(value) {
            if (this.selected === value) {
                return;
            }
            this.selected = value;
            this.dirty = true;
        },

        getActiveHandleGlobalPoint:function() {
            if (this.activeHandleIndex === 1) {
                return this.getGlobalP1();
            }
            if (this.activeHandleIndex === 2) {
                return this.getGlobalP2();
            }
            return null;
        },

        onCanvasSelectionCreated:function(e) {
            if (this.canvas) {
                if (e.target?.type === "activeSelection") this.removeCanvasListeners();
            }
        },
        onCanvasSelectionCleared:function() {
            if (this.canvas) {
                // when unselecting an active selection we must force a render
                this.updateCoords();
                this.canvas.renderAll();
            }
        },

        onCanvasMouseDown:function(o) {
            // this.canvas = window.canvas;
            if (this.canvas.skipTargetFind) {
                return;
            }

            if (this.activeHandleIndex) {
                return;
            }
            const pointer = this.canvas.getPointer(o.e, false);
            const coords = new fabric.Point(pointer.x, pointer.y);

            const isInsideP1Handle = this.isPointInsideP1Handle(coords);
            const isInsideP2Handle = this.isPointInsideP2Handle(coords);
            if (isInsideP1Handle || isInsideP2Handle) {
                if (o.target === this) {
                    if (this.canvas.selection) {
                        this.canvasNeedsSelection = true;
                        this.canvas.selection = false;
                    }
                    this.canvas.setCursor('-webkit-grabbing');
                    this.set({
                        lockMovementX: true,
                        lockMovementY: true,
                    });
                    this.activeHandleIndex = isInsideP1Handle ? 1 : 2;
                    this.innerTargetCoords = coords.subtract(
                        this.getActiveHandleGlobalPoint(),
                    );
                    this.canvas.setActiveObject(this);
                }
            }
        },

        onCanvasMouseMove:function(o) {
            // this.canvas = window.canvas;
            if (this.canvas.skipTargetFind) {
                return;
            }

            const pointer = this.canvas.getPointer(o.e, false);
            let coords = new fabric.Point(pointer.x, pointer.y);
            let isInsideP1Handle = this.isPointInsideP1Handle(coords);
            let isInsideP2Handle = this.isPointInsideP2Handle(coords);
            if (this.activeHandleIndex) {
                this.canvas.setCursor('-webkit-grabbing');
                coords = coords.subtract(this.innerTargetCoords);
                coords.x = Math.max(coords.x, this.canvas.vptCoords.tl.x);
                coords.x = Math.min(coords.x, this.canvas.vptCoords.br.x);
                coords.y = Math.max(coords.y, this.canvas.vptCoords.tl.y);
                coords.y = Math.min(coords.y, this.canvas.vptCoords.br.y);

                const minLength = 2;
                let newP1;
                let newP2;
                let newPoint;

                if (this.activeHandleIndex === 1) {
                    newP1 = coords;
                    const p2 = this.getGlobalP2();
                    // Make sure line is not too short
                    const newLength = newP1.distanceFrom(p2);
                    if (newLength < minLength) {
                        newP1 = extrapolatePoints(p2, newP1, minLength / newLength);
                    }
                    // Snap rotation if shift key is active
                    if (this.shiftKeyActive) {
                        const measures = this.getLineMeasuresBetweenPoints(newP1, p2);
                        const rad = fabric.util.degreesToRadians(
                            getSnapAngleForAngle(measures.degrees),
                        );
                        const x = p2.x - Math.cos(rad) * measures.distance;
                        const y = p2.y - Math.sin(rad) * measures.distance;
                        newP1 = new fabric.Point(x, y);
                    }
                    this.updateWithPoints(newP1, p2);
                    newPoint = newP1;
                }
                else{
                    const p1 = this.getGlobalP1();
                    newP2 = coords;
                    // Make sure line is not too short
                    const newLength = p1.distanceFrom(newP2);
                    if (newLength < minLength) {
                        newP2 = extrapolatePoints(p1, newP2, minLength / newLength);
                    }
                    // Snap rotation if shift key is active
                    if (this.shiftKeyActive) {
                        const measures = this.getLineMeasuresBetweenPoints(p1, newP2);
                        const rad = fabric.util.degreesToRadians(
                            getSnapAngleForAngle(measures.degrees),
                        );
                        const x = p1.x + Math.cos(rad) * measures.distance;
                        const y = p1.y + Math.sin(rad) * measures.distance;
                        newP2 = new fabric.Point(x, y);
                    }
                    this.updateWithPoints(p1, newP2);
                    newPoint = newP2;
                }

                this.setCoords();
                this.isMoving = true;
                this.dirty = true;
                if (this.canvas) {
                    this.canvas.requestRenderAll();
                }

                this.dispatchHandleMoving(
                    o.e,
                    this.activeHandleIndex,
                    newPoint,
                    !this.shiftKeyActive,
                );
                this.dispatchRotating(o.e);
            } else if (isInsideP1Handle || isInsideP2Handle) {
                if (o.target === this) {
                    this.canvas.setCursor('-webkit-grab');
                }
            }
        },
        setGrabbingCursor: function (o){
            const pointer = this.canvas.getPointer(o, false);
            let coords = new fabric.Point(pointer.x, pointer.y);
            let isInsideP1Handle = this.isPointInsideP1Handle(coords);
            let isInsideP2Handle = this.isPointInsideP2Handle(coords);
            if (isInsideP1Handle || isInsideP2Handle) {
                if (o === this) {
                    this.canvas.setCursor('-webkit-grab');
                }
            }
        },
        onCanvasMouseUp:function(o) {
            if (this.canvas.skipTargetFind) {
                return;
            }

            if (!this.activeHandleIndex) {
                return;
            }
            const pointer = this.canvas.getPointer(o.e, false);
            const coords = new fabric.Point(pointer.x, pointer.y);

            if (this.canvasNeedsSelection) {
                this.canvasNeedsSelection = false;
                this.canvas.selection = true;
            }
            this.set({
                lockMovementX: false,
                lockMovementY: false,
            });
            this.activeHandleIndex = 0;
            this.isMoving = false;
            this.dirty = true;
            this.updateCoords();
            if (this.canvas) {
                // this.canvas.requestRenderAll();
            }

            const isInsideP1Handle = this.isPointInsideP1Handle(coords);
            const isInsideP2Handle = this.isPointInsideP2Handle(coords);

            if (isInsideP1Handle || isInsideP2Handle) {
                this.canvas.setCursor('-webkit-grab');
            }

            this.dispatchModified(o.e);
        },

        rotate:function(angle) {
            this.callSuper('rotate', angle);
            this.setCoords();
        },

        _set:function(key, value) {
            if (!this.initialized) {
                this.callSuper('_set', key, value);
                return this;
            }
            const newValue = value;
            const previousArrow1 = this.arrow1;
            const previousArrow2 = this.arrow2;

            if (key === 'thickness') {
                this.strokeWidth = Math.min(this.strokeWidth, newValue * 4);
                this.canvas.requestRenderAll();
            }

            if (key === 'fill') {
                this.stroke = newValue;
                this.canvas.requestRenderAll();
            }

            if (key === 'strokeWidth') {
                this.strokeWidth = newValue;
                return this;
            }

            if (key === 'stroke') {
                // this.thickness = Math.max(this.thickness, newValue / 4);
                this.stroke = newValue;
                return this;
            }
            this.callSuper('_set', key, newValue);

            if (pointProperties.includes(key)) {
                const points = [this.x1, this.y1, this.x2, this.y2];
                const { p1, p2 } = this.getPointsFromCoordsArray(points);
                let newP1 = p1;
                let newP2 = p2;
                // Make sure line is not too short
                const minLength = this.getMinLengthFromArrowSize(this.thickness);
                const newLength = p1.distanceFrom(p2);
                if (newLength < minLength) {
                    const pointChanged = parseInt(key.substr(1, 1), 10);
                    if (pointChanged === 1) {
                        newP1 = extrapolatePoints(p2, p1, minLength / newLength);
                        newP2 = p2;
                    } else {
                        newP1 = p1;
                        newP2 = extrapolatePoints(p1, p2, minLength / newLength);
                    }
                }
                this.updateWithPoints(newP1, newP2);
            }

            if (key === 'length') {
                // Flip line if length is negative
                let points = [this.x1, this.y1, this.x2, this.y2];
                if (newValue < 0) {
                    points = [this.x2, this.y2, this.x1, this.y1];
                }
                const { p1, p2 } = this.getPointsFromCoordsArray(points);
                const newLength = Math.abs(newValue);
                const minLength = this.getMinLengthFromArrowSize(this.strokeWidth);
                const currentLength = p1.distanceFrom(p2);
                // Make sure line is not too short
                const newP2 = extrapolatePoints(
                    p1,
                    p2,
                    Math.max(newLength, minLength) / currentLength,
                );
                this.updateWithPoints(p1, newP2);
            }

            if (key === 'top' || key === 'left') {
                this.updateP1Coords(this.getGlobalPoint(this.getLocalP1()));
                this.updateP2Coords(this.getGlobalPoint(this.getLocalP2()));
            }

            if (key === 'arrow1' && !previousArrow1 && newValue === true) {
                const points = [this.x1, this.y1, this.x2, this.y2];
                const { p1, p2 } = this.getPointsFromCoordsArray(points);
                const minLength = this.getMinLengthFromArrowSize(this.strokeWidth);
                const currentLength = p1.distanceFrom(p2);

                // Make sure line is not too short
                if (currentLength < minLength) {
                    const newP1 = extrapolatePoints(p2, p1, minLength / currentLength);
                    this.updateWithPoints(newP1, p2);
                }
            }

            if (key === 'arrow2' && !previousArrow2 && newValue === true) {
                const points = [this.x1, this.y1, this.x2, this.y2];
                const { p1, p2 } = this.getPointsFromCoordsArray(points);
                const minLength = this.getMinLengthFromArrowSize(this.strokeWidth);
                const currentLength = p1.distanceFrom(p2);

                // Make sure line is not too short
                if (currentLength < minLength) {
                    const newP2 = extrapolatePoints(p1, p2, minLength / currentLength);
                    this.updateWithPoints(p1, newP2);
                }
            }
            if (key === 'canvas') {
                if (newValue) {
                    // Canvas is set, we can use it
                    this.addCanvasListeners();
                } else {
                    this.removeCanvasListeners();
                }
            }

            return this;
        },

        _render:function(ctx) {
            ctx.save();
            this.set({ skewX: 0, skewY: 0 });
            const currentM = this.calcTransformMatrix();
            const invertM = fabric.util.invertTransform(currentM);
            const currentOptions = fabric.util.qrDecompose(currentM);

            const p1 = this.getLocalP1();
            const p2 = this.getLocalP2();

            const arrowSize = getTriangleSizeByThickness(this.arrowSize);
            const halfArrowSize = arrowSize / 2;


            ctx.transform(invertM[0], invertM[1], invertM[2], invertM[3], 0, 0);
            const currentMNoMove = [
                currentM[0],
                currentM[1],
                currentM[2],
                currentM[3],
                0,
                0,
            ];
            const transformedP1 = fabric.util.transformPoint(p1, currentMNoMove);
            const transformedP2 = fabric.util.transformPoint(p2, currentMNoMove);

            ctx.lineWidth = this.strokeWidth;
            ctx.strokeStyle = 'transparent';
            ctx.lineCap = this.strokeLineCap;

            if (this.strokeDashArray) {
                ctx.setLineDash(this.strokeDashArray);
            }

            const length = this.getLength(transformedP1, transformedP2);
            const relativeX1 = arrowSize * this.arrow1;
            const relativeX2 = length - arrowSize * this.arrow2; // ;

            ctx.save();
            ctx.beginPath();
            ctx.translate(transformedP1.x, transformedP1.y);
            ctx.rotate((currentOptions.angle * Math.PI) / 180);

            if ((this.arrow1 || this.arrow2) && !this.shadow && this.opacity < 0.01) {
                const marginForRoundCap1 = !this.arrow1 ? this.strokeWidth / 2 : 0;
                const marginForRoundCap2 = !this.arrow2 ? this.strokeWidth / 2 : 0;
                ctx.rect(
                    relativeX1 - marginForRoundCap1,
                    -this.strokeWidth,
                    length -
                    arrowSize * (this.arrow1 + this.arrow2) +
                    marginForRoundCap2 +
                    marginForRoundCap1,
                    this.strokeWidth * 2,
                );
                // ctx.fill();
                ctx.clip();
            }
            ctx.beginPath();
            if(this.arrow1) {
                let arrowType = this.custom.arrowA;
                switch(arrowType.type) {
                    case 'arrow':
                        ctx.moveTo(arrowSize + 5, 0);
                        break;
                    case 'circle':
                        ctx.moveTo(halfArrowSize - this.cornerSize, 0);
                        break;
                    case 'arc':
                        ctx.moveTo(halfArrowSize - (this.cornerSize/2), 0);
                        break;
                    case 'arrow-curve':
                        ctx.moveTo(arrowSize, 0);
                        break;
                    case 'arrow-sharp':
                        ctx.moveTo(arrowSize*2, 0);
                        break;
                    case 'arrow-pencil-round':
                        ctx.moveTo(arrowSize/3, 0);
                        break;
                    case 'arrow-pencil-poly':
                        ctx.moveTo(arrowSize/3, 0);
                        break;
                    case 'line-half':
                        ctx.lineTo(this.strokeWidth,0);
                        break;
                }

            }
            else {
                ctx.moveTo(arrowSize * this.arrow1, 0);
            }

            if(this.arrow2) {
                let arrowType = this.custom.arrowB;
                switch(arrowType.type) {
                    case 'arrow':
                        ctx.lineTo(length - arrowSize, 0);
                        break;
                    case 'circle':
                        ctx.lineTo(length - halfArrowSize + 4, 0);
                        break;
                    case 'arc':
                        ctx.lineTo(length - halfArrowSize + 4, 0);
                        break;
                    case 'arrow-curve':
                        ctx.lineTo(length - arrowSize, 0);
                        break;
                    case 'arrow-sharp':
                        ctx.lineTo(length - arrowSize*2, 0);
                        break;
                    case 'arrow-pencil-round':
                        ctx.lineTo(length - (arrowSize/3),0);
                        break;
                    case 'arrow-pencil-poly':
                        ctx.lineTo(length - (arrowSize/3),0);
                        break;
                    case 'line-half':
                        ctx.lineTo(length - this.strokeWidth,0);
                        break;

                }

            }
            else {
                ctx.lineTo(length, 0);
            }

            this.stroke && this._renderStroke(ctx);
            ctx.restore();

            if(this.arrow1) {
                let arrowType = this.custom.arrowA;

                ctx.save();
                ctx.fillStyle = arrowType.color;
                ctx.beginPath();
                ctx.translate(transformedP1.x, transformedP1.y);
                ctx.rotate((currentOptions.angle * Math.PI) / 180);

                switch(arrowType.type) {
                    // original arrow
                    case 'arrow':
                        ctx.moveTo(0, 0);
                        ctx.lineTo(arrowSize, halfArrowSize);
                        ctx.lineTo(arrowSize, -halfArrowSize);
                        ctx.fill();
                        break;
                    case 'arrow-sharp':
                        ctx.moveTo(0, 0);
                        ctx.lineTo(arrowSize*2, halfArrowSize);
                        ctx.lineTo(arrowSize*2, -halfArrowSize);
                        ctx.fill();
                        break;
                    case 'line-half':
                        ctx.save();
                        ctx.moveTo(0,0);
                        ctx.rect(0,-halfArrowSize, this.strokeWidth,arrowSize)
                        // ctx.lineTo(0, halfArrowSize);
                        // ctx.lineTo(-arrowSize*0.3, halfArrowSize);
                        // ctx.lineTo(-arrowSize*0.3, -halfArrowSize);
                        // ctx.lineTo(0, -halfArrowSize);
                        // //ctx.lineWidth = halfArrowSize*0.7;
                        ctx.fill();
                        ctx.restore();
                        break;

                    case 'arrow-curve':
                        ctx.save();
                        ctx.translate(arrowSize-(this.cornerSize/2), 0);
                        //ctx.moveTo(0, 0);
                        var path = new Path2D('M -1.5 0.03 V -1.62 A 0.48 0.48 0 0 1 -0.78 -2.04 L 0.64 -1.21 l 1.43 0.82 a 0.48 0.48 0 0 1 0 0.83 l -1.43 0.82 L -0.78 2.09 A 0.48 0.48 0 0 1 -1.5 1.67 Z');
                        ctx.rotate(180 * Math.PI / 180);
                        ctx.scale(arrowSize/3, arrowSize/3);
                        ctx.fill(path);
                        ctx.restore();
                        break;
                    case 'arrow-pencil-round':
                        ctx.save();
                        ctx.translate((arrowSize/2)-(this.cornerSize/2), 0);
                        var path_pencil_round = new Path2D('M -0.83 2.6 a 0.36 0.36 0 0 1 -0.25 -0.1 a 0.38 0.38 0 0 1 0 -0.53 L 0.65 0.02 L -1.1 -1.92 A 0.38 0.38 0 1 1 -0.55 -2.43 l 1.81 2 a 0.67 0.67 0 0 1 0 0.88 L -0.55 2.45 A 0.34 0.34 0 0 1 -0.83 2.6 Z');
                        ctx.rotate(180 * Math.PI / 180);
                        ctx.scale(arrowSize/3, arrowSize/3);
                        ctx.fill(path_pencil_round);
                        ctx.restore();
                        break;
                    case 'arrow-pencil-poly':
                        ctx.save();
                        ctx.translate((arrowSize/2)-(this.cornerSize/2), 0);
                        var path_pencil_poly = new Path2D('M -1.21 1.28 L 0.06 0.01 L -1.21 -1.26 L -0.13 -1.26 L 1.14 0.01 L -0.13 1.28 L -1.21 1.28 z');
                        ctx.rotate(180 * Math.PI / 180);
                        ctx.scale(arrowSize/2, arrowSize/2);
                        ctx.fill(path_pencil_poly);
                        ctx.restore();
                        break;
                    case 'circle':
                        ctx.save();
                        ctx.translate(-halfArrowSize + this.cornerSize + 4, 0);
                        ctx.moveTo(0, 0);
                        ctx.arc(0, 0, halfArrowSize, 0 * Math.PI, 2 * Math.PI)
                        ctx.fill();
                        ctx.restore();
                        break;
                    case 'arc':
                        ctx.save();
                        ctx.lineWidth = halfArrowSize*0.5;
                        ctx.strokeStyle = arrowType.color;
                        ctx.translate(-halfArrowSize+ this.cornerSize + 4, 0);
                        // ctx.moveTo(halfArrowSize, 0);
                        ctx.arc(0, 0, halfArrowSize, 0 * Math.PI, 2 * Math.PI)
                        //ctx.fill();
                        ctx.stroke();
                        ctx.restore();
                        break;
                }
                ctx.restore();
            }
            if(this.arrow2) {
                let arrowType = this.custom.arrowB;

                ctx.save();
                ctx.fillStyle = arrowType.color;
                ctx.beginPath();
                ctx.translate(transformedP2.x, transformedP2.y);
                ctx.rotate((currentOptions.angle * Math.PI) / 180);

                switch(arrowType.type) {
                    case 'arrow':
                        ctx.moveTo(0, 0);
                        ctx.lineTo(-arrowSize, halfArrowSize);
                        ctx.lineTo(-arrowSize, -halfArrowSize);
                        ctx.fill();
                        break;
                    case 'arrow-sharp':
                        ctx.moveTo(0, 0);
                        ctx.lineTo(-arrowSize*2, halfArrowSize);
                        ctx.lineTo(-arrowSize*2, -halfArrowSize);
                        ctx.fill();
                        break;
                    case 'circle':
                        ctx.save();
                        ctx.translate(0 + this.cornerSize - 2, 0);
                        ctx.moveTo(0, 0);
                        ctx.arc(0, 0, halfArrowSize, 0 * Math.PI, 2 * Math.PI)
                        ctx.fill();
                        ctx.restore();
                        break;
                    case 'line-half':
                        ctx.save();
                        ctx.moveTo(0,0);
                        ctx.rect(-this.strokeWidth,-halfArrowSize, this.strokeWidth,arrowSize)
                        // ctx.lineTo(0, halfArrowSize);
                        // ctx.lineTo(-arrowSize*0.3, halfArrowSize);
                        // ctx.lineTo(-arrowSize*0.3, -halfArrowSize);
                        // ctx.lineTo(0, -halfArrowSize);
                        // //ctx.lineWidth = halfArrowSize*0.7;
                        ctx.fill();
                        ctx.restore();
                        break;
                    case 'arrow-curve':
                        ctx.save();
                        ctx.translate(-arrowSize+(this.cornerSize/2), 0);
                        // ctx.moveTo(0, 0);
                        var path_curve = new Path2D('M -1.5 0.03 V -1.62 A 0.48 0.48 0 0 1 -0.78 -2.04 L 0.64 -1.21 l 1.43 0.82 a 0.48 0.48 0 0 1 0 0.83 l -1.43 0.82 L -0.78 2.09 A 0.48 0.48 0 0 1 -1.5 1.67 Z');
                        //ctx.fillStyle = '#000'
                        // ctx.rotate(180 * Math.PI / 180);
                        ctx.scale(arrowSize/3, arrowSize/3);
                        ctx.fill(path_curve);
                        ctx.restore();
                        break;
                    case 'arrow-pencil-poly':
                        ctx.save();
                        ctx.translate(-(arrowSize/2)+(this.cornerSize/2), 0);
                        var path_pencil_poly_2 = new Path2D('M -1.21 1.28 L 0.06 0.01 L -1.21 -1.26 L -0.13 -1.26 L 1.14 0.01 L -0.13 1.28 L -1.21 1.28 z');
                        ctx.scale(arrowSize/2, arrowSize/2);
                        ctx.fill(path_pencil_poly_2);
                        ctx.restore();
                        break;
                    case 'arrow-pencil-round':
                        ctx.save();
                        ctx.translate(-(arrowSize/2)+(this.cornerSize/2), 0);
                        var path_pencil_round_2 = new Path2D('M -0.83 2.6 a 0.36 0.36 0 0 1 -0.25 -0.1 a 0.38 0.38 0 0 1 0 -0.53 L 0.65 0.02 L -1.1 -1.92 A 0.38 0.38 0 1 1 -0.55 -2.43 l 1.81 2 a 0.67 0.67 0 0 1 0 0.88 L -0.55 2.45 A 0.34 0.34 0 0 1 -0.83 2.6 Z');
                        ctx.scale(arrowSize/3, arrowSize/3);
                        ctx.fill(path_pencil_round_2);
                        ctx.restore();
                        break;
                    case 'arc':
                        ctx.save();
                        ctx.lineWidth = halfArrowSize*0.5;
                        ctx.strokeStyle = arrowType.color;
                        ctx.translate(0 + this.cornerSize - 2, 0);
                        ctx.arc(0, 0, halfArrowSize, 0 * Math.PI, 2 * Math.PI)
                        //ctx.fill();
                        ctx.stroke();
                        ctx.restore();
                        break;
                }
                ctx.restore();
            }

            if (this.opacity === 1 && this.shadow) {
                // redraw the stroke on top to erase shadows of arrows heads on line
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0)';

                ctx.translate(transformedP1.x, transformedP1.y);
                ctx.rotate((currentOptions.angle * Math.PI) / 180);
                if (this.arrow1 || this.arrow2) {
                    const marginForRoundCap1 = !this.arrow1 ? this.strokeWidth / 2 : 0;
                    const marginForRoundCap2 = !this.arrow2 ? this.strokeWidth / 2 : 0;
                    ctx.rect(
                        relativeX1 - marginForRoundCap1,
                        -50,
                        length -
                        arrowSize * (this.arrow1 + this.arrow2) +
                        marginForRoundCap2 +
                        marginForRoundCap1,
                        100,
                    );

                    ctx.clip();
                }
                ctx.beginPath();
                ctx.moveTo(relativeX1, 0);
                ctx.lineTo(relativeX2, 0);
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        },
        _getNonTransformedDimensions:function() {
            const w = this.width;
            const h = this.height;
            return { x: w, y: h };
        },

        // Overriding fabric.Object.prototype._findTargetCorner so we can trick Fabric controls engine
        // to think ml & mr controls are usable, allowing grabbing handles when the arrow is selected
        // below another object
        _findTargetCorner:function(pointer) {
            if (!this.canvas) return;
            if (this.selected) {
                const coords = this.canvas.restorePointerVpt(
                    new fabric.Point(pointer.x, pointer.y),
                );
                const isInsideP1Handle = this.isPointInsideP1Handle(coords);
                const isInsideP2Handle = this.isPointInsideP2Handle(coords);
                if (isInsideP1Handle) {
                    return 'ml';
                }
                if (isInsideP2Handle) {
                    return 'mr';
                }
            }
            return false;
        },

        // Overriding fabric.Object.prototype.drawControls so we can draw our handles
        // regardless of isControlVisible(), because if we set these visible ('ml' and 'mr'),
        // then fabric allows modifying the line in ways we don't want (distort)
        drawBorders:function(ctx, styleOverride) {
            styleOverride = styleOverride || {};

            const wh = this._calculateCurrentDimensions();
            const strokeWidth = 1 / this.borderScaleFactor;
            const width = wh.x + strokeWidth;
            const height = wh.y + strokeWidth;
            const scaleOffset = styleOverride.cornerSize || this.cornerSize;
            const left = -(width + scaleOffset) / 2;
            const top = -(height + scaleOffset) / 2;

            ctx.save();
            const prevStrokeStyle = ctx.strokeStyle;
            ctx.strokeStyle = styleOverride.borderColor || this.borderColor;
            // this.drawHandleLine(
            //     ctx,
            //     left,
            //     top + height / 2,
            //     left + width,
            //     top + height / 2,
            // );
            ctx.strokeStyle = prevStrokeStyle;
            ctx.restore();
            return this;
        },

        drawBordersInGroup:function(ctx, options, styleOverride) {
            styleOverride = styleOverride || {};

            const strokeWidth = 1 / this.borderScaleFactor;
            const width = this.width * options.scaleX + strokeWidth;
            const height = this.height + strokeWidth;
            const scaleOffset = styleOverride.cornerSize || this.cornerSize;
            const left = -(width + scaleOffset) / 2;
            const top = -(height + scaleOffset) / 2;

            ctx.save();
            const prevStrokeStyle = ctx.strokeStyle;
            ctx.strokeStyle = styleOverride.borderColor || this.borderColor;
            // this.drawHandleLine(
            //     ctx,
            //     left,
            //     top + height / 2,
            //     left + width,
            //     top + height / 2,
            // );
            ctx.strokeStyle = prevStrokeStyle;
            ctx.restore();
            return this;
        },

        // Original code start
        drawControls:function(ctx, styleOverride) {
            // Only draw handles if the line is either selected or a handle is being dragged around
            if (!this.selected && !this.activeHandleIndex) {
                return this;
            }
            styleOverride = styleOverride || {};

            const wh = this._calculateCurrentDimensions();
            const width = wh.x;
            const height = wh.y;
            const scaleOffset = styleOverride.cornerSize || this.cornerSize;
            const left = -(width + scaleOffset) / 2;
            const top = -(height + scaleOffset) / 2;
            const transparentCorners =
                typeof styleOverride.transparentCorners !== 'undefined'
                    ? styleOverride.transparentCorners
                    : this.transparentCorners;
            const methodName = transparentCorners ? 'stroke' : 'fill';

            ctx.save();
            ctx.strokeStyle = ctx.fillStyle = styleOverride.cornerColor || 'rgb(253, 216, 53,0.5)';
            if (!this.transparentCorners) {
                ctx.strokeStyle =
                    styleOverride.cornerStrokeColor || this.cornerStrokeColor;
            }

            // 'left' and 'right' values are in fact our p1 and p2, let's just use these here,
            // as they're the official way and work well.
            const prevStrokeStyle = ctx.strokeStyle;
            ctx.strokeStyle = styleOverride.borderColor || this.borderColor;
            // this.drawHandleLine(
            //     ctx,
            //     left,
            //     top + height / 2,
            //     left + width,
            //     top + height / 2,
            // );
            ctx.strokeStyle = prevStrokeStyle;
            this.drawHandle(methodName, ctx, left, top + height / 2);
            this.drawHandle(methodName, ctx, left + width, top + height / 2);
            ctx.restore();
            return this;
        },

        // Mostly copied from fabric.Object.prototype._drawControl
        drawHandle:function(methodName, ctx, left, top) {
            const size = this.cornerSize;
            const halfSize = size + 5;

            ctx.beginPath();
            ctx.arc(left + halfSize - 2, top + halfSize - 10, halfSize, 0, RAD_360, false);
            if (methodName === 'fill') {
                ctx.fill();
            }
            // ctx.stroke();
            ctx.closePath();
        },

        drawHandleLine:function(ctx, l1, t1, l2, t2) {
            const size = this.cornerSize;
            const halfSize = size / 2;

            ctx.beginPath();
            ctx.moveTo(l1 + halfSize, t1 + halfSize);
            ctx.lineTo(l2 + halfSize, t2 + halfSize);
            ctx.closePath();
            ctx.stroke();
        },

        updateGradient:function() {
            if (!this.fill || !this.fill.coords) {
                return;
            }
            const angle = getGradientAngleFromFabricGradientCoords(this.fill.coords);
            const gradient = getFabricGradient(
                {
                    ...this.fill,
                    angle,
                },
                this.strokeWidth,
                this.strokeWidth,
                this.width / 2,
            );
            this.fill = gradient;
        },

        getLineMeasuresBetweenPoints:function(p1, p2) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const radians = (Math.atan2(dy, dx) + RAD_360) % RAD_360; // output 0 - 2PI
            const degrees = fabric.util.radiansToDegrees(radians);
            const center = p1.midPointFrom(p2);
            const distance = p1.distanceFrom(p2);
            return {
                p1: p1.clone(),
                p2: p2.clone(),
                center,
                radians,
                degrees,
                distance,
            };
        },

        dispatchHandleMoving:function(e, handleIndex, point, snap) {
            const payload = {
                e,
                handleIndex,
                point,
                snap,
            };
            this.canvas.fire('object:handle:moving', { target: this, ...payload });
            this.fire('handle:moving', payload);
        },

        dispatchRotating:function(e) {
            this.canvas.fire('object:rotating', { target: this, e });
            this.fire('rotating', { e });
        },

        dispatchModified:function(e) {
            if (!this.throttledDispatchModified) {

                /*this.throttledDispatchModified = throttle(() => {
                    this.canvas.fire('object:modified', { target: this, e });
                    this.fire('modified', { e });
                }, 10);*/
            }
            //this.throttledDispatchModified();
            this.canvas.fire('object:modified', { target: this, e });
            this.fire('modified', { e });
        },

        toObject:function(propertiesToInclude) {
            const _propertiesToInclude = propertiesToInclude ? propertiesToInclude:['custom'];
            return this.callSuper(
                'toObject',
                _propertiesToInclude.concat(ownProperties),
            );
        },

        applyGroupScale:function() {
            if (this.group) {
                const scale =
                    this.group.scaleX > this.group.scaleY
                        ? this.group.scaleY
                        : this.group.scaleX;
                this.set({ strokeWidth: this.strokeWidth * scale });
            }
        },

        _toSVG:function() {
            // const transformMatrix = [...this.custom.transformMatrix];
            const transformMatrix = this.calcTransformMatrix();
            const options = fabric.util.qrDecompose(transformMatrix);
            this.setPositionByOrigin(
                { x: options.translateX, y: options.translateY },
                'center',
                'center',
            );
            this.angle = options.angle;
            const p1 = this.getLocalP1();
            const p2 = this.getLocalP2();
            const arrowSize = this.arrowSize / options.scaleX;
            const halfArrowSize = arrowSize / 2;
            let arrow1 = null,
                arrow1Diff = (arrowSize + 0.5);
            let arrow2 = null,
                arrow2Diff = (arrowSize + 0.5);
            if(this.arrow1) {
                let arrowType = this.custom.arrowA;
                switch(arrowType.type) {
                    case 'arrow':
                        arrow1Diff = (arrowSize + 0.5);
                        arrow1 = `<path d="M ${p1.x} ${p1.y} l${arrowSize} -${arrowSize /
                        2} l0 ${arrowSize} l-${arrowSize} -${arrowSize / 2}" fill="${
                            arrowType.color
                        }" />`
                        break;
                    case 'line-half':
                        arrow1Diff = (this.strokeWidth);
                        arrow1 = `<rect x="${p1.x}" y="${p1.y-halfArrowSize}" width="${this.strokeWidth}" height="${arrowSize}" fill="${arrowType.color}" />`;
                        break;
                    case 'arrow-sharp':
                        arrow1Diff = (arrowSize + 0.5);
                        arrow1 = `<path d="M ${p1.x} ${p1.y} l${arrowSize*2} -${arrowSize /
                        2} l0 ${arrowSize} l-${arrowSize*2} -${arrowSize / 2}" fill="${
                            arrowType.color
                        }" />`
                        break;
                    case 'circle':
                        arrow1Diff = (arrowSize + 0.5);
                        arrow1 = `<circle cx="${p1.x+halfArrowSize}" cy="${p1.y}" r="${halfArrowSize}" fill="${arrowType.color}" />`
                        break;
                    case 'arc':
                        arrow1Diff = (arrowSize + 0.5);
                        arrow1 = `<circle cx="${p1.x+halfArrowSize}" cy="${p1.y}" r="${halfArrowSize}" stroke="${arrowType.color}" stroke-width="${halfArrowSize*0.5}" fill="transparent"/>`
                        break;
                    case 'arrow-curve':
                        arrow1Diff = (arrowSize/2);
                        arrow1 = `<path d="M -1.5 0.03 V -1.62 A 0.48 0.48 0 0 1 -0.78 -2.04 L 0.64 -1.21 l 1.43 0.82 a 0.48 0.48 0 0 1 0 0.83 l -1.43 0.82 L -0.78 2.09 A 0.48 0.48 0 0 1 -1.5 1.67 Z" transform="scale(${arrowSize/3} ${arrowSize/3}) rotate(180) translate(${(Math.abs(p1.x)-(arrowSize-(this.cornerSize/2)))/(arrowSize/3)} 0)" fill="${arrowType.color}"  />`
                        break;
                    case 'arrow-pencil-round':
                        arrow1Diff = (arrowSize/3)-(this.cornerSize/2);
                        arrow1 = `<path d="M -0.83 2.6 a 0.36 0.36 0 0 1 -0.25 -0.1 a 0.38 0.38 0 0 1 0 -0.53 L 0.65 0.02 L -1.1 -1.92 A 0.38 0.38 0 1 1 -0.55 -2.43 l 1.81 2 a 0.67 0.67 0 0 1 0 0.88 L -0.55 2.45 A 0.34 0.34 0 0 1 -0.83 2.6 Z" transform="scale(${arrowSize/3} ${arrowSize/3}) rotate(180) translate(${(Math.abs(p1.x)-((arrowSize/3)+(this.cornerSize/2)))/(arrowSize/3)} 0)" fill="${arrowType.color}"  />`
                        break;
                    case 'arrow-pencil-poly':
                        arrow1Diff = (arrowSize/3)-(this.cornerSize/2);
                        arrow1 = `<path d="M -1.21 1.28 L 0.06 0.01 L -1.21 -1.26 L -0.13 -1.26 L 1.14 0.01 L -0.13 1.28 L -1.21 1.28 z" transform="scale(${arrowSize/2} ${arrowSize/2}) rotate(180) translate(${(Math.abs(p1.x)-((arrowSize/3)+(this.cornerSize/2)))/(arrowSize/2)} 0)" fill="${arrowType.color}"  />`
                        break;

                }
            }
            if(this.arrow2) {
                let arrowType = this.custom.arrowB;
                switch(arrowType.type) {
                    case 'arrow':
                        arrow2Diff = (arrowSize + 0.5);
                        arrow2 = `<path d="M ${p2.x} ${p2.y} l-${arrowSize} -${arrowSize /
                        2} l0 ${arrowSize} l${arrowSize} -${arrowSize / 2}" fill="${
                            arrowType.color
                        }"  />`
                        break;
                    case 'arrow-sharp':
                        arrow2Diff = (arrowSize + 0.5);
                        arrow2 = `<path d="M ${p2.x} ${p2.y} l-${arrowSize*2} -${arrowSize /
                        2} l0 ${arrowSize} l${arrowSize*2} -${arrowSize / 2}" fill="${
                            arrowType.color
                        }" />`;
                        break;
                    case 'line-half':
                        arrow2Diff = (this.strokeWidth);
                        arrow2 = `<rect x="${p2.x-(this.strokeWidth)}" y="${p2.y-halfArrowSize}" width="${this.strokeWidth}" height="${arrowSize}" fill="${arrowType.color}" />`;
                        break;
                    case 'circle':
                        arrow2Diff = (arrowSize + 0.5);
                        arrow2 = `<circle cx="${p2.x-halfArrowSize}" cy="${p2.y}" r="${halfArrowSize}" fill="${arrowType.color}"/>`
                        break;
                    case 'arc':
                        arrow2Diff = (arrowSize + 0.5);
                        arrow2 = `<circle cx="${p2.x-halfArrowSize}" cy="${p2.y}" r="${halfArrowSize}" stroke="${arrowType.color}" stroke-width="${halfArrowSize*0.5}" fill="transparent"/>`
                        break;
                    case 'arrow-curve':
                        arrow2Diff = (arrowSize/2);
                        arrow2 = `<path d="M -1.5 0.03 V -1.62 A 0.48 0.48 0 0 1 -0.78 -2.04 L 0.64 -1.21 l 1.43 0.82 a 0.48 0.48 0 0 1 0 0.83 l -1.43 0.82 L -0.78 2.09 A 0.48 0.48 0 0 1 -1.5 1.67 Z" transform="scale(${arrowSize/3} ${arrowSize/3}) rotate(0) translate(${(Math.abs(p2.x)-(arrowSize-(this.cornerSize/2)))/(arrowSize/3)} 0)" fill="${arrowType.color}"  />`
                        break;
                    case 'arrow-pencil-round':
                        arrow2Diff = (arrowSize/3)-(this.cornerSize/2);
                        arrow2 = `<path d="M -0.83 2.6 a 0.36 0.36 0 0 1 -0.25 -0.1 a 0.38 0.38 0 0 1 0 -0.53 L 0.65 0.02 L -1.1 -1.92 A 0.38 0.38 0 1 1 -0.55 -2.43 l 1.81 2 a 0.67 0.67 0 0 1 0 0.88 L -0.55 2.45 A 0.34 0.34 0 0 1 -0.83 2.6 Z" transform="scale(${arrowSize/3} ${arrowSize/3}) rotate(0) translate(${(Math.abs(p2.x)-((arrowSize/3)+(this.cornerSize/2)))/(arrowSize/3)} 0)" fill="${arrowType.color}"  />`
                        break;
                    case 'arrow-pencil-poly':
                        arrow2Diff = (arrowSize/3)-(this.cornerSize/2);
                        arrow2 = `<path d="M -1.21 1.28 L 0.06 0.01 L -1.21 -1.26 L -0.13 -1.26 L 1.14 0.01 L -0.13 1.28 L -1.21 1.28 z" transform="scale(${arrowSize/2} ${arrowSize/2}) rotate(0) translate(${(Math.abs(p2.x)-((arrowSize/3)+(this.cornerSize/2)))/(arrowSize/2)} 0)" fill="${arrowType.color}"  />`
                        break;
                }
            }
            let hrefSvg = '';
            let hrefSvgHead = '';
            let hrefSvgFoot = '';
            if (this.hrefSvg != null && this.hrefSvg != undefined) {
                hrefSvg = this.hrefSvg.replace(/[\u00A0-\u9999<>]/gim, function (i) {
                    return '&#' + i.charCodeAt(0) + ';';
                });
                hrefSvg = hrefSvg.replace("&amp;", "&&amp;");
                hrefSvg = hrefSvg.replace("&&amp;", "&");
                hrefSvg = hrefSvg.replace("&", "&amp;");
                hrefSvgHead = '<a href="' + hrefSvg + '" target="_blank">\n';
                hrefSvgFoot = '</a>\n';
            }
            return [

                '<g opacity="',
                this.opacity,
                '" >',
                hrefSvgHead,
                '<line ',
                'stroke="',
                this.stroke||this.fill,
                '" stroke-width="',
                this.strokeWidth,
                '" stroke-dasharray="',
                this.strokeDashArray,
                '" stroke-linecap="',
                this.strokeLineCap,
                '" x1="',
                p1.x + arrow1Diff * this.arrow1,
                '" y1="',
                p1.y,
                '" x2="',
                p2.x - arrow2Diff * this.arrow2,
                '" y2="',
                p2.y,
                '" />\n',
                arrow1,
                arrow2,
                hrefSvgFoot,
                '</g>\n',
            ];
        },
    })
    fabric.LineAnnotateArrow.fromObject = function fromObject(object, callback) {
        const options = fabric.util.object.clone(object, true);
        if(isNaN(options.scaleX)||isNaN(options.scaleY)||options.scaleX==null||options.scaleY==null){
            options.scaleX=1;
            options.scaleY=1;
        }
        if (callback) callback(new fabric.LineAnnotateArrow(options));
    };

    fabric.LineAnnotateArrow.fromElement = function(element, callback, options) {
        const extend = fabric.util.object.extend;
        options = options || {};
        let parsedAttributes = fabric.parseAttributes(
            element,
            fabric.Line.ATTRIBUTE_NAMES,
        );
        let points = [
            parsedAttributes.x1 || 0,
            parsedAttributes.y1 || 0,
            parsedAttributes.x2 || 0,
            parsedAttributes.y2 || 0,
        ];

        callback(
            new fabric.LineAnnotateArrow({ ...points, ...extend(parsedAttributes, options) }),
        );
    };

    fabric.LineAnnotateArrow.MIN_THICKNESS = MIN_THICKNESS;
    fabric.LineAnnotateArrow.MAX_THICKNESS = MAX_THICKNESS;
}
module.exports = {addAnnotation}
