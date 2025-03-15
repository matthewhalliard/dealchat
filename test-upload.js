const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// URL of a sample PDF for testing
const samplePdfUrl = 'https://of5hqzjkqvxkwr9h.public.blob.vercel-storage.com/1741986503411-NDA%20Template%20%282025%20RC%29%20-%20Signed.docx-eGMziiDUHf9sxHp22cpBE3ALJMvbv1.pdf';

async function downloadFile(url, outputPath) {
  console.log(`Downloading from ${url}...`);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function uploadFile(filePath) {
  console.log(`Uploading ${filePath}...`);
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post('http://localhost:3001/api/upload', form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log('Upload response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error uploading file:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

async function main() {
  try {
    // Download the sample PDF
    const samplePdfPath = path.join(__dirname, 'sample.pdf');
    await downloadFile(samplePdfUrl, samplePdfPath);
    console.log(`Sample PDF downloaded to ${samplePdfPath}`);

    // Upload the PDF to test extraction
    const result = await uploadFile(samplePdfPath);
    
    // Clean up
    fs.unlinkSync(samplePdfPath);
    console.log('Sample PDF deleted');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

main(); 