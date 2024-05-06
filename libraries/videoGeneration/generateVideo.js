const fs = require("fs");
const { fabric } = require("fabric");
const { startAnimation,startAnimationTemp, addAllObjs } = require("./animations");
const { setExportVideoSize } = require("../../utils");
var path = require("path");
var Frame = require("canvas-to-buffer");

module.exports = async function generateVideo(req, res) {
  return new Promise((resolveAnimation) => {
    let datals = req.body.data;
    console.log("id", req.params.id);
    let id = req.params.id;
    let dir = path.join(__dirname, "frames", `${id}`);
    let bufferArr = [];
    let videoDir = path.join(__dirname, "videos");
    let backgroundsDir = path.join(__dirname, "bg");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    if (!fs.existsSync(backgroundsDir)) {
      fs.mkdirSync(backgroundsDir, { recursive: true });
    }
    let canvasEl = new fabric.Canvas(`${id}`, {
      width: datals.canvasWidth,
      height: datals.canvasHeight,
    });
    var frameC = new Frame(canvasEl, {
      quality: 0.4,
      types: ["png"],
    });

    canvasEl.clear();
    setExportVideoSize(
      false,
      canvasEl,
      canvasEl.getZoom(),
      canvasEl.getWidth(),
      canvasEl.getHeight()
    );
    fabric.Image.fromURL(datals.img, async function (img) {
      canvasEl.setBackgroundImage(img, canvasEl.renderAll.bind(canvasEl), {
        scaleX: canvasEl.width / canvasEl.getZoom() / img.width,
        scaleY: canvasEl.height / canvasEl.getZoom() / img.height,
      });
      var buffer = frameC.toBuffer();
      fs.writeFileSync(path.join(__dirname, `bg`, `${id}.png`), buffer);
      canvasEl.clear();
      console.log("before add all objs");
      await addAllObjs(datals.frames, canvasEl);
      startAnimation(
        0,
        true,
        canvasEl,
        datals.frames,
        datals.shadowFrames,
        false,
        datals.svgPaths,
        frameC,
        res,
        id,
        resolveAnimation,
        bufferArr
      );
    });
  });
};
module.exports = async function generateVideoTemp(req, res) {
  return new Promise((resolveAnimation) => {
    let datals = req.body.data;
    console.log("id", req.params.id);
    let id = req.params.id;
    let dir = path.join(__dirname, "frames", `${id}`);
    let bufferArr = [];
    let videoDir = path.join(__dirname, "videos");
    let backgroundsDir = path.join(__dirname, "bg");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    if (!fs.existsSync(backgroundsDir)) {
      fs.mkdirSync(backgroundsDir, { recursive: true });
    }
    let canvasEl = new fabric.StaticCanvas(`${id}`, {
      width: datals.canvasWidth,
      height: datals.canvasHeight,
      objectCaching:true,
      selection:false,
      renderOnAddRemove:false,
      skipTargetFind:true

    });
    var frameC = new Frame(canvasEl, {
      quality: 0.4,
      types: ["png"],
    });

    canvasEl.clear();
    setExportVideoSize(
      false,
      canvasEl,
      canvasEl.getZoom(),
      canvasEl.getWidth(),
      canvasEl.getHeight()
    );
    fabric.Image.fromURL(datals.img, async function (img) {
      canvasEl.setBackgroundImage(img, canvasEl.renderAll.bind(canvasEl), {
        scaleX: canvasEl.width / canvasEl.getZoom() / img.width,
        scaleY: canvasEl.height / canvasEl.getZoom() / img.height,
      });
      var buffer = frameC.toBuffer();
      fs.writeFileSync(path.join(__dirname, `bg`, `${id}.png`), buffer);
      canvasEl.clear();
      console.log("before add all objs");
      const t0 = performance.now();
      console.log("t0:",t0);
      await addAllObjs(datals.frames, canvasEl);
      const t1 = performance.now();
      console.log("difference:",t1-t0);


      startAnimationTemp(
        0,
        true,
        canvasEl,
        datals.frames,
        datals.shadowFrames,
        false,
        datals.svgPaths,
        frameC,
        res,
        id,
        resolveAnimation,
        bufferArr
      );
    });
  });
};
