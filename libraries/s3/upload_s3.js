const s3 = require("./aws3");

async function upload_s3(file_key, file) {
  const config = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: file_key,
    Body: file,
  };
  const uploadedImage = await s3.putObject(config);

  return uploadedImage;
}

module.exports = upload_s3;
