#!/usr/bin/env node
import fs from "fs/promises"
import path from "path"
import { createCanvas, loadImage } from "@napi-rs/canvas"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

yargs(hideBin(process.argv))
  .command(
    "$0 <file>",
    "Pixelate an image",
    (yargs) => {
      yargs.positional("file", {
        describe: "Path to original image file",
        type: "string",
      })
    },
    run
  )
  .option("strength", {
    alias: "s",
    type: "array",
    description: "Pixel reduction ratio; larger numbers produce fewer pixels",
    default: [2],
  })
  .parse()

async function run({ file, strength: strengths }) {
  const filePath = path.resolve(process.cwd(), file)
  const dirname = path.dirname(filePath)
  const extension = path.extname(filePath)
  const filename = path.basename(filePath, extension)
  const input = await loadImage(filePath)
  for (let i = 0; i < strengths.length; i++) {
    const denominator = strengths[i]
    const output = await pixelate(input, extension, denominator)
    await fs.writeFile(
      `${dirname}/${filename}-pixelate_${denominator}${extension}`,
      output
    )
  }
  console.info("Pixelate complete")
}

async function pixelate(image, extension, denominator) {
  const ratio = 1 / denominator
  const pWidth = image.width * ratio
  const pHeight = image.height * ratio
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext("2d")
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(image, 0, 0, pWidth, pHeight)
  ctx.drawImage(
    canvas,
    0,
    0,
    pWidth,
    pHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return canvas.encode(extension.replace(".", ""))
}
