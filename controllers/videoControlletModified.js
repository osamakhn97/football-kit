const playwright              = require('@playwright/test');
const uniqueFilename          = require('unique-filename')
const fs                      = require('fs');
const config                  = require('../utils/config')
const {setUpApp,isJsonString} = require('../libraries/helperFunctions');
const https                   = require("https");
const webmToMp4 = require("webm-to-mp4");
const path = require('path');
const fsPromises = require("fs/promises");

const { getSubdomain } = require("../utils/getSubdomain");
const uuid = require("uuid");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobe = require("ffprobe-static");
const ios = require("../libraries/socket/socket");
const execSync                = require("child_process").execSync;
const Xvfb                    = require('xvfb');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);

const getVideoUrl =  async (req, res)=> {
    const subdomain = getSubdomain(req);
    const fileID = req.query["fileID"];
    console.log("File ID Received",`${config.jsonFolder}${fileID}`);
    ios.on("connection",(socket)=>{
        socket.on(`send-message${fileID}`,message=>{
            console.log(message);
            ios.emit(`receive-messageq`,message)
        })
    })

    /*
        let xvfb = new Xvfb({
            silent:    true,
            xvfb_args: ["-screen", "0", '1600x760x24', "-ac"],
        });
        xvfb.start((err)=>{
            if (err)
                console.log(err)
        })*/
    console.log(`${config.jsonFolder}/${fileID}.json`);
    if(!fs.existsSync(`${config.jsonFolder}/${fileID}.json`))
        return res.status(400).send({ message: 'Invalid JSON File!'});
    let browser = null;
    try{
        const uniqueName = `${uniqueFilename('')}`;
        const videoPath  = `${config.videoFolder}/${uniqueName}.webm`;
        const videoURLWebm   = `${config.serverURL}/${uniqueName}.webm`;
        const videoURLMp4    = `${config.serverURL}/controllers/${uniqueName}.mp4`;
        const pageToLoad = `${config.appURL}${fileID}`;
        console.log('page to load',pageToLoad);

        browser    = await playwright['chromium'].launchPersistentContext( config.userCacheDir,{
            headless:          true,
            executablePath:    config.executablePath,
            timeout:           300000,
            deviceScaleFactor: 1,
            viewport:          {width: 1600, height: 760},
            //  args:              [
            //      '--display='+xvfb._display
            //  ],
        });
        const page = await browser.newPage();
        page.on('load', (p) => {
            console.timeEnd("pageload");
        });
        console.log(pageToLoad);


        await page.goto(pageToLoad, { timeout: 300000 });

        const [ download ] = await Promise.all([
            page.waitForEvent('download', { timeout: 300000 }), // wait for download to start
        ]);

        let downloadError = await download.failure();
        if (downloadError != null)
            return res.status(400).send({ message: `download failed: ${e.message}`});
        // save into the desired path
        await download.saveAs(videoPath).then(async () => {
            // const file = fs.readFileSync(videoPath);
            // const mp4Buffer = webmToMp4(file);
            const out = path.join(__dirname,`${uniqueName}.mp4`);
            let inp = videoPath;
            let command = ffmpeg()
              .addInput(inp)
              .outputOption(
                "-fflags",
                "+genpts",
                "-vcodec",
                "libx264",
                "-pix_fmt",
                `yuv420p`,
                "-r",
                `30`
              )

              .on("end", async function (stdout, stderr) {
            fsPromises.unlink(videoPath);
            fsPromises.unlink(`${config.jsonFolder}/${fileID}.json`);
                res.send({ path: videoURLMp4, error: false });
              })
              .on("error", function (stdout, stderr) {
                console.log("failed to process video", stdout, stderr);
                return res.status(400).send({ message: `Something went wrong: ${stderr}`});

              })
              .output(out);
            command.run();
            // execSync(`ffmpeg -i ${videoPath} -fflags +genpts -vcodec libx264 -pix_fmt yuv420p -r 30 ${path.join(__dirname,`${uniqueName}.mp4`)}`)

            // fs.writeFileSync(path.join(__dirname,`${uniqueName}.mp4`), Buffer.from(mp4Buffer));
            // await uploadVideoToS3(path.join(__dirname,`${uniqueName}.mp4`),subdomain);

        });

        await download.delete()
        await browser.close();
        // xvfb.stop();
    }
    catch(ex){
        return res.status(400).send({ message: `Something went wrong: ${ex.message}`});
        if(browser)
            await browser.close();
        //xvfb.stop();
    }finally {
        if(browser)
            await browser.close();
    }

}

const saveJson = async (req,res)=>{
    const json = req.body["data"];

    if(!isJsonString(json))
        return res.status(400).send({ message: `Invalid JSON`});

    const jsonName     = `${uniqueFilename('')}.json`;
    const jsonSavePath = `${config.jsonFolder}/${jsonName}`;
    const jsonURL      = `${config.serverURL}/${jsonName}`;

    try {
        fs.writeFileSync(jsonSavePath, json);
        res.send({jsonFile: jsonURL,jsonID: jsonName })
    }
    catch (ex) {
        res.statusMessage = ex.message;
        return res.status(400).send({ message: `save failed: ${e.message}`});
        return '';
    }
}
const uploadVideoToS3 = async (videoPath, domain = "dev") => {
    console.log('uploading plase wait...');
    console.log('videoPAth',videoPath);
    const id = uuid.v4();
    const s3_video_key = `animation/${id}.mp4`;
    const config = {
      Bucket: process.env.AWS_S3_BUCKET_NAME || "easycoach",
      Key: domain + "/" + s3_video_key,
      Body: fs.readFileSync(videoPath),
      ACL: "public-read",
      ContentType: "video/mp4",
    };

    return {
      domain,
      s3_video_key,
    };
  };
module.exports = {saveJson,getVideoUrl}

