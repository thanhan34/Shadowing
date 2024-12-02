import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useEffect, useState } from "react";

export default function TestComplete() {
  const [emailStatus, setEmailStatus] = useState<string>('');

  useEffect(() => {
    // Send email notification when page loads
    const sendEmailNotification = async () => {
      try {
        console.log('Sending email notification...');
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Failed to send email notification:', data);
          setEmailStatus('Failed to send email notification');
          throw new Error(data.message || 'Failed to send email');
        }

        console.log('Email notification sent successfully:', data);
        setEmailStatus('Email notification sent successfully');
      } catch (error: any) {
        console.error('Error sending email notification:', error);
        setEmailStatus(`Error: ${error?.message || 'Unknown error occurred'}`);
      }
    };

    sendEmailNotification();
  }, []);

  return (
    <div className="min-h-screen bg-[#232323] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Test Complete</title>
      </Head>
      <div className="max-w-md w-full space-y-8 bg-[#2b2b2b] p-8 rounded-lg shadow-lg border border-[#fdbc94]">
        <div>
          <div className="mb-8 flex flex-col justify-center items-center">
            <Image
              src="/logo1.png"
              alt="Logo"
              width={150}
              height={150}
              priority
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#fc5d01]">
            Test Completed
          </h2>
          <div className="mt-8 text-center">
            <div className="rounded-full bg-[#ffac7b] p-3 inline-flex">
              <svg
                className="h-12 w-12 text-[#fc5d01]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <p className="mt-6 text-center text-lg text-white">
            Thank you for completing the placement test. Your responses have
            been recorded successfully.
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            We will review your test and get back to you with the results soon.
          </p>
          {emailStatus && (
            <p className={`mt-2 text-center text-sm ${emailStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {emailStatus}
            </p>
          )}

          <div className="mt-8 space-y-4">
            <div className="text-center">
              <Link
                href="/placement-test"
                className="inline-flex items-center px-4 py-2 border border-[#fdbc94] text-sm font-medium rounded-md text-white bg-[#fc5d01] hover:bg-[#fd7f33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01]"
              >
                Take Another Test
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
