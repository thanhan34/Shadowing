import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Validate request method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Create PDF document
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const font = await doc.embedFont(StandardFonts.TimesRoman);
    const { height } = page.getSize();

    // Add test content
    page.drawText('Test PDF Generation', {
      x: 50,
      y: height - 50,
      size: 30,
      font,
    });

    // Save PDF
    const pdfBytes = await doc.save();
    const buffer = Buffer.from(pdfBytes);

    // Send response
    return new Promise((resolve) => {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
        'Content-Length': buffer.length
      });
      
      res.write(buffer, () => {
        res.end(() => {
          resolve(true);
        });
      });
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', {
      message: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message
    });
  }
}
