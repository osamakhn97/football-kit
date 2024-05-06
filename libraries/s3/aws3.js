const AWS = require("@aws-sdk/client-s3");
// Set the AWS Region.
// Create Amazon S3 service object.
const s3 = new AWS.S3({
  region: "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
  },
});
// Export 's3' constant.
module.exports = { s3 };
