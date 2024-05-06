const getSubdomain = (req) => {
  const easycoachSubdomain = req.header("origin");

  if (!easycoachSubdomain || easycoachSubdomain.includes("localhost"))
    return "dev";

  return easycoachSubdomain.substring(
    easycoachSubdomain.indexOf("//") + 2,
    easycoachSubdomain.indexOf(".")
  );
};

module.exports = {
  getSubdomain,
};
