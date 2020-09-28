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
