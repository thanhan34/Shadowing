import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Set SendGrid API key
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}
sgMail.setApiKey(apiKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get admin emails from environment variable
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (adminEmails.length === 0) {
      throw new Error('No admin emails configured');
    }

    // Get the latest submission
    const submissionsRef = collection(db, 'submissions');
    const q = query(submissionsRef, orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return res.status(404).json({ message: 'No submission found' });
    }

    const submission = querySnapshot.docs[0].data();
    const { personalInfo } = submission;

    // Send email using SendGrid
    const msg = {
      to: adminEmails,
      from: {
        email: process.env.EMAIL_USER || 'admin@pteintensive.com',
        name: 'PTE Intensive Admin'
      },
      replyTo: process.env.EMAIL_USER || 'admin@pteintensive.com',
      subject: `${personalInfo.fullName} | ${personalInfo.target} - New Placement Test Submission`,
      text: `
New Placement Test Submission

Student Name: ${personalInfo.fullName}
Email: ${personalInfo.email}
Phone: ${personalInfo.phone}
Target Score: ${personalInfo.target}
Submission Time: ${new Date(submission.timestamp.toDate()).toLocaleString()}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">Hệ thống đã nhận được bài Placement Test của học sinh</h2>
          <div style="margin-top: 20px;">
            <p><strong>Student Name:</strong> ${personalInfo.fullName}</p>
            <p><strong>Email:</strong> ${personalInfo.email}</p>
            <p><strong>Phone:</strong> ${personalInfo.phone}</p>
            <p><strong>Target Score:</strong> ${personalInfo.target}</p>
            <p><strong>Submission Time:</strong> ${new Date(submission.timestamp.toDate()).toLocaleString()}</p>
            <p>Truy cập vào đường link sau để xem chi tiết: https://study.pteintensive.com/submissions</p>
            <P>PTE Intensive Team</P>
          </div>
        </div>
      `
    };

    try {
      console.log('Attempting to send email with config:', {
        to: msg.to,
        from: msg.from.email,
        subject: msg.subject
      });
      
      const response = await sgMail.send(msg);
      console.log('SendGrid Response:', response);
      
      return res.status(200).json({ 
        message: 'Email sent successfully'
      });
    } catch (sendError: any) {
      console.error('SendGrid Error Details:', {
        message: sendError.message,
        code: sendError.code,
        response: sendError.response?.body
      });
      
      // Return detailed error for debugging
      return res.status(500).json({
        message: 'Email sending failed',
        error: sendError.message,
        code: sendError.code,
        details: sendError.response?.body
      });
    }
  } catch (error: any) {
    console.error('Error in email handler:', error);
    return res.status(500).json({ 
      message: 'Failed to send email',
      error: error.message
    });
  }
}
