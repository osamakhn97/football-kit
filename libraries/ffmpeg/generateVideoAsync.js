const Ffmpeg = require("fluent-ffmpeg");
const fsPromises = require("fs/promises");

const convertWebmToMp4 = async (inp, out, ios, socketId) => {
  return new Promise((resolve, reject) => {
    console.log("starting conversion");

    const command = Ffmpeg()
      .addInput(inp)
      // .outputOption(
      //   "-fflags",
      //   "+genpts",
      //   "-vcodec",
      //   "libx264",
      //   "-pix_fmt",
      //   `yuv420p`,
      //   "-r",
      //   `30`
      // )

        .on("progress", function (progress) {
                // ios.emit(`receive-message${socketId}`, "Setting video speed, please wait...");
                console.log("Setting video speed: " + progress.percent + "% Done");
                if(Math.round(50+(progress.percent)))
                    ios.emit(
                        `receive-message${socketId}`,'Processing Video: ' + Math.round(50+(progress.percent)) + "% Done");
            })

      .on("end", function (stdout, stderr) {
        console.log("end conversion");
          ios.emit(
              `receive-message${socketId}`,'Processing Video: ' + 100 + "% Done");
        console.log("video created good");
        resolve();
      })
      .on("error", function (stdout, stderr) {
        console.log("failed to process video", stdout, stderr);
        return reject(new Error(stdout));
      })
      .output(out);

    command.run();
  });
};

module.exports = {
  convertWebmToMp4,
};
