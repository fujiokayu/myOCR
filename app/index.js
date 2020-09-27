// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict"

// [START functions_ocr_setup]
// Get a reference to the Cloud Storage component
const { Storage } = require("@google-cloud/storage")
const storage = new Storage()

// Get a reference to the Cloud Vision API component
const Vision = require("@google-cloud/vision")
const vision = new Vision.ImageAnnotatorClient()
// [END functions_ocr_setup]

// [START functions_ocr_detect]
/**
 * Detects the text in an image using the Google Vision API.
 *
 * @param {string} bucketName Cloud Storage bucket name.
 * @param {string} filename Cloud Storage file name.
 * @returns {Promise}
 */
const detectText = async (bucketName, filename) => {
  console.log(`Looking for text in image ${filename}`)
  const [textDetections] = await vision.textDetection(
    `gs://${bucketName}/${filename}`
  )
  const [annotation] = textDetections.textAnnotations
  const text = annotation ? annotation.description : ""
  console.log(`Extracted text from image:`, text)
}
// [END functions_ocr_detect]

// [START functions_ocr_rename]
/**
 * Appends a .txt suffix to the image name.
 *
 * @param {string} filename Name of a file.
 * @param {string} lang Language to append.
 * @returns {string} The new filename.
 */
const renameImageForSave = (filename, lang) => {
  return `${filename}_to_${lang}.txt`
}
// [END functions_ocr_rename]

// [START functions_ocr_process]
/**
 * This function is exported by index.js, and is executed when
 * a file is uploaded to the Cloud Storage bucket you created
 * for uploading images.
 *
 * @param {object} event A Google Cloud Storage File object.
 */
exports.processImage = async (event) => {
  const { bucket, name } = event

  if (!bucket) {
    throw new Error(
      'Bucket not provided. Make sure you have a "bucket" property in your request'
    )
  }
  if (!name) {
    throw new Error(
      'Filename not provided. Make sure you have a "name" property in your request'
    )
  }

  await detectText(bucket, name)
  console.log(`File ${name} processed.`)
}
// [END functions_ocr_process]

// [START functions_ocr_save]
/**
 * This function is exported by index.js, and is executed when
 * a message is published to the Cloud Pub/Sub topic specified
 * by the RESULT_TOPIC environment variable. The function saves
 * the data packet to a file in GCS.
 *
 * @param {object} event The Cloud Pub/Sub Message object.
 * @param {string} {messageObject}.data The "data" property of the Cloud Pub/Sub
 * Message. This property will be a base64-encoded string that you must decode.
 */
exports.saveResult = async (event) => {
  const pubsubData = event.data
  const jsonStr = Buffer.from(pubsubData, "base64").toString()
  const { text, filename } = JSON.parse(jsonStr)

  if (!text) {
    throw new Error(
      'Text not provided. Make sure you have a "text" property in your request'
    )
  }
  if (!filename) {
    throw new Error(
      'Filename not provided. Make sure you have a "filename" property in your request'
    )
  }

  console.log(`Received request to save file ${filename}`)

  const bucketName = process.env.RESULT_BUCKET
  const newFilename = renameImageForSave(filename, lang)
  const file = storage.bucket(bucketName).file(newFilename)

  console.log(`Saving result to ${newFilename} in bucket ${bucketName}`)

  await file.save(text)
  console.log(`File saved.`)
}
// [END functions_ocr_save]
