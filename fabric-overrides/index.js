
//Text Override
const overrideFabricObjs = (fabric)=>{
    fabric.Text.prototype._renderText= function(ctx) {
        if(this.name === 'custom_image_name' || this.name === 'shadow-object')
        {
            if(this.hasBg) {
                ctx.save();
                ctx.fillStyle = this.fillStyle;
                var radius = 12;
                var x = -this.width / 2 - 7;
                var y = -this.height / 2 - 2.5;
                var width = this.width + 14;
                var height = this.height + 5;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
        if (this.paintFirst === 'stroke') {
            this._renderTextStroke(ctx);
            this._renderTextFill(ctx);
        }
        else {
            this._renderTextFill(ctx);
            this._renderTextStroke(ctx);
        }
    }
    fabric.Circle.prototype._render = function(ctx) {
        if(this.showHighlight)
        {
            ctx.save();
            ctx.fillStyle = this.highlightColor;
            ctx.globalAlpha = this.bgrOpacity
            ctx.beginPath();
            ctx.arc(
                0,
                0,
                this.radius+10,
                this.startAngle,
                this.endAngle, false);
            ctx.fill();
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(
            0,
            0,
            this.radius,
            this.startAngle,
            this.endAngle, false);
        this._renderPaintInOrder(ctx);
    }
}

// fabric.Object.prototype.drawSelectionBackground =function(ctx) {
//     if (!this.selectionBackgroundColor ||
//         (this.canvas && !this.canvas.interactive) ||
//         (this.canvas && this.canvas?._activeObject !== this) ||
//         (this.canvas?._activeObject?.type === 'activeSelection')
//     ) {
//         if (this.canvas?._activeObject?.type === 'activeSelection'){
//             const bgLessObjNames = ['drawLine','line','arrow','Line Arrow','custom_image_name','custom_image_shirtno','arrow_line','p0','p1','pX','pa','p2','square1','square2','line-end-point_shadow-object'];
//             var ind = this.canvas._activeObject?._objects.findIndex(obj=>obj.ref_id === this.ref_id && !bgLessObjNames.includes(this.name));
//             if (ind === -1) return this;
//         }else return this;
//     }
//     ctx.save();
//     // if (!this.canvas){
//     //     this.canvas = canvasVar;
//     // }
//
//     var center = this.getCenterPoint(), wh = this._calculateCurrentDimensions(),
//         vpt = this.canvas.viewportTransform;
//     if (this.canvas?._activeObject?.type === 'activeSelection' && this.canvas._activeObject?._objects.findIndex(obj=>obj.ref_id === this.ref_id) > -1){
//         var objLeft = this.canvas._activeObject.left;
//         var objTop = this.canvas._activeObject.top;
//         var objWidth = this.canvas._activeObject.width;
//         var objHeight = this.canvas._activeObject.height;
//         center.x += objLeft + objWidth/2;
//         center.y += objTop + objHeight/2;
//     }
//     ctx.translate(center.x, center.y);
//     ctx.scale(1 / vpt[0], 1 / vpt[3]);
//     ctx.rotate(fabric.util.degreesToRadians(this.angle));
//     ctx.fillStyle = this.selectionBackgroundColor;
//     ctx.fillRect(-wh.x / 2, -wh.y / 2, wh.x, wh.y);
//     ctx.restore();
//     return this;
// };
module.exports = {overrideFabricObjs};