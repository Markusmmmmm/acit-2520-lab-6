const { pipeline } = require("stream/promises");

const yauzl = require("yauzl-promise"),
  fs = require("fs"),
  PNG = require("pngjs").PNG,
  path = require("path")
const {pixelGrayscale} = require("./filter");

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
@param {string} pathIn
@param {string} pathOut
@return {promise}
 */
async function unzip (pathIn, pathOut) {
  const zip = await yauzl.open(pathIn);
  try {
  for await (const entry of zip) {
    if (entry.filename.endsWith('/')) {
      await fs.promises.mkdir(`${pathOut}/${entry.filename}`);
    } else {
      const readStream = await entry.openReadStream();
      const writeStream = fs.createWriteStream(`${pathOut}/${entry.filename}`);
      await pipeline(readStream, writeStream);
    }
  }
} finally {
  await zip.close();
  console.log("Extraction operation complete")
}
  
};

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const readDir = async (dir) => {
  const fileArray = []
  try {
    const dirFile = await fs.promises.readdir(dir)
    for(const file of dirFile) {
      if(path.extname(file) === ".png"){
        fileArray.push(path.join(file))
      }
    }
  } catch (err) {
    console.log(err)
  }
  return fileArray
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
@param {string} filePath
@param {string} pathProcessed
@return {promise}
 */
const grayScale = async (pathIn, pathOut, filter) => {
  
  async function grayScale(pathIn, pathOut, filter) {
    const image = await fs.promises.readFile(path.join(__dirname, "unzipped", pathIn));
    const png = new PNG();
  
    return new Promise((resolve, reject) => {
      png.parse(image, (err, data) => {
        if (err) {
          reject(err);
        } else {
          for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
              const idx = (png.width * y + x) << 2;
              switch (filter) {
                case "grayscale":
                  const rgbGrayscale = pixelGrayscale(png.data[idx], png.data[idx + 1], png.data[idx + 2]);
                  png.data[idx] = png.data[idx + 1] = png.data[idx + 2] = rgbGrayscale;
                  break;
              }
            }
          }
  
          png.pack().pipe(fs.createWriteStream(`${pathOut}/${pathIn}`));
          resolve();
        }
      });
    });
  }}


module.exports = {
  unzip,
  readDir,
  grayScale,
};