import type { NextApiRequest, NextApiResponse } from "next";

const DISCORD_WEBHOOK_URL =
  process.env.DISCORD_WRITE_FROM_DICTATION_WEBHOOK ||
  "https://discord.com/api/webhooks/1486745126746198138/053F8gXCHtevdGlyWhrORxtnNBLuDc0gZNpr292HJtUxzhKTKikbkTJbNjskd6Gmb3BO";

type ReportIssueRequestBody = {
  questionNumber?: number;
  sentenceText?: string;
  topic?: string;
  vietnameseTranslation?: string;
  selectedVoice?: string;
  audioUrl?: string;
  issueTypes?: string[];
  note?: string;
  pageMode?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    questionNumber,
    sentenceText,
    topic,
    vietnameseTranslation,
    selectedVoice,
    audioUrl,
    issueTypes,
    note,
    pageMode,
  } = (req.body || {}) as ReportIssueRequestBody;

  if (!questionNumber || !sentenceText || !Array.isArray(issueTypes) || issueTypes.length === 0) {
    return res.status(400).json({ message: "Missing required report information" });
  }

  try {
    const fields = [
      {
        name: "Câu số",
        value: `#${questionNumber}`,
        inline: true,
      },
      {
        name: "Loại lỗi",
        value: issueTypes.join(", "),
        inline: true,
      },
      {
        name: "Mode",
        value: pageMode || "practice",
        inline: true,
      },
      {
        name: "Sentence",
        value: sentenceText.slice(0, 1024),
      },
      {
        name: "Topic",
        value: (topic || "General").slice(0, 1024),
        inline: true,
      },
      {
        name: "Voice",
        value: (selectedVoice || "Unknown").slice(0, 1024),
        inline: true,
      },
      {
        name: "Translation",
        value: (vietnameseTranslation || "Không có bản dịch").slice(0, 1024),
      },
      {
        name: "Audio URL",
        value: audioUrl ? audioUrl.slice(0, 1024) : "Không có audio URL",
      },
    ];

    if (note?.trim()) {
      fields.push({
        name: "Ghi chú thêm",
        value: note.trim().slice(0, 1024),
      });
    }

    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "WFD Error Reporter",
        embeds: [
          {
            title: "🚨 Write From Dictation - Báo cáo lỗi",
            color: 0xfc5d01,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      throw new Error(`Discord webhook failed: ${discordResponse.status} ${errorText}`);
    }

    return res.status(200).json({ message: "Report sent successfully" });
  } catch (error) {
    console.error("Failed to send Write From Dictation issue report:", error);
    return res.status(500).json({ message: "Failed to send report" });
  }
}