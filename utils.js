const setTextDimensions = (nameText, shirtNo, imgInstance,canvas) => {
    if (!nameText) return;
    const imgScaledHeight = imgInstance.getScaledHeight();
    const imgScaledWidth = imgInstance.getScaledWidth();
    nameText.top = (imgInstance.top + imgScaledHeight / 2) + nameText.getScaledHeight() / 2;
    nameText.left = imgInstance.left;
    if (nameText.width <= imgScaledWidth) nameText.set("width", imgScaledWidth);
    else nameText.set("width", nameText.width);
    nameText.setCoords();
    if(shirtNo){
        if (shirtNo.width <= (imgScaledWidth * 0.4)) shirtNo.set("width", imgScaledWidth * 0.4);
        else shirtNo.set("width", shirtNo.width);
        shirtNo.left = (imgInstance.left) - (imgScaledWidth / 3) - (shirtNo.getScaledWidth() / 16);
        shirtNo.top = (imgInstance.top - (imgScaledHeight / 2) - 3) + (shirtNo.getScaledHeight() / 1.5);
        shirtNo.setCoords();
        shirtNo.evented = false
    }
    imgInstance.setCoords()
}
const setPlayerNameDim = (name,player,canvas)=>{
    let objHeight = player.getScaledHeight();
    name.set('left',player.left)
    name.set('top',(player.top + name.getScaledHeight()/2)+objHeight/2)
    name.setCoords();

}
const setConnectLineDim = (canvas,connectLine)=>{
    let ids = connectLine.ref_id.split('_')
    let objInd1 = canvas._objects.findIndex(f => (f.name === 'player' || f.name === 'player_custom_image' || f.objecttype === 'sprite-image') && f.ref_id === ids[0]);
    let objInd2 = canvas._objects.findIndex(f => (f.name === 'player' || f.name === 'player_custom_image' || f.objecttype === 'sprite-image') && f.ref_id === ids[1]);

    let from = canvas._objects[objInd1].calcTransformMatrix();
    let to = canvas._objects[objInd2].calcTransformMatrix();

    connectLine.set({ 'x1': from[4], 'y1': from[5], 'x2': to[4], 'y2': to[5] });

    canvas.renderAll()
}
const animateShapes = (canvas, duration = 1000,player)=> {

    if(player.fadeFlag && (player.fadeFlag === 'fade-in-out' || player.fadeFlag === 'fade-in-stay' || player.fadeFlag === 'no-fade-out')) {
        player._objects[0].animate('bgrOpacity', '1', {
            onChange: function () {
                player._objects[0].set('dirty', true)
                canvas.renderAll.bind(canvas)
            },
            duration: duration / 3
        })
    }

}
const fadeOutShapes = (canvas, duration = 1000,player)=>{
    if(player.fadeFlag && (player.fadeFlag === 'fade-in-out' ||  player.fadeFlag === 'fade-out')){
        player._objects[0].animate('bgrOpacity','0',{
            onChange:function(){
                player._objects[0].set('dirty',true)
                canvas.renderAll.bind(canvas)},
            duration:duration/6
        })
    }
}
const hideOpacity = (canvas,i)=>{
    if(canvas._objects[i].fadeFlag){
        if(canvas._objects[i].fadeFlag === 'fade-in-stay' || canvas._objects[i].fadeFlag === 'fade-in-out' ) {
            if ((canvas._objects[i].name === 'player' || canvas._objects[i].name === 'player_custom_image')&& canvas._objects[i].bgrOpacity !== 0) {
                canvas._objects[i]._objects[0].bgrOpacity = 0;
                canvas._objects[i]._objects[0].set('dirty', true);
            }
            else if(canvas._objects[i].opacity !== 0) {
                canvas._objects[i].opacity = 0;
            }
            canvas.renderAll()
        }
    }
}
const showOpacity = (canvas,i)=>{
    if(canvas._objects[i].fadeFlag){
        if(canvas._objects[i].fadeFlag === 'no-fade-out' || canvas._objects[i].fadeFlag === 'fade-out') {
            if ((canvas._objects[i].name === 'player' || canvas._objects[i].name === 'player_custom_image') && canvas._objects[i].bgrOpacity === 0) {
                canvas._objects[i]._objects[0].bgrOpacity = 1;
                canvas._objects[i]._objects[0].set('dirty', true);
            } else if(canvas._objects[i].opacity === 0) {
                canvas._objects[i].opacity = 1;
            }
            canvas.renderAll()
        }
    }
}
const animateNonMoveables = (canvas,time,ob,noMove=false)=>{
    if(ob.fadeFlag && (ob.fadeFlag === 'fade-in-out' || ob.fadeFlag === 'fade-in-stay' || ob.fadeFlag === 'no-fade-out')) {
        ob.animate('opacity', '1', {
            onChange: canvas.renderAll.bind(canvas),
            duration: noMove?time/2:time
        })
    }
    setTimeout(()=>{
        if(ob.fadeFlag && (ob.fadeFlag === 'fade-in-out' ||  ob.fadeFlag === 'fade-out')) {
            ob.animate('opacity', '0', {
                onChange: canvas.renderAll.bind(canvas),
                duration: time/2
            })
        }
    },(noMove?time/3:time*3))
}
const setExportVideoSize = (reset = false,canvas,originalZoom,originalWidth,originalHeight) => {
    if(!reset)
    {
        originalZoom = canvas.getZoom();
        originalWidth = canvas.getWidth();
        originalHeight = canvas.getHeight();
        const width = canvas.getWidth()*canvas.getZoom();
        const height = canvas.getHeight()*canvas.getZoom();
        const ratio = height/width;
        const videoWidth = 1280;
        let zoom = videoWidth/width;
        canvas.setZoom(zoom);
        canvas.setWidth(videoWidth)
        canvas.setHeight(videoWidth*ratio);

    }
    else {
        canvas.setZoom(originalZoom);
        canvas.setWidth(originalWidth)
        canvas.setHeight(originalHeight);

    }
}

module.exports = {
    animateNonMoveables,animateShapes,fadeOutShapes,hideOpacity,showOpacity, setTextDimensions, setPlayerNameDim, setConnectLineDim,setExportVideoSize
}