const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const crypto = require("crypto");

const COLLECTION_NAME = "repeatsentence";
const CSV_PATH = path.join(__dirname, "data", "repeatsentence.csv");

function resolveServiceAccountPath() {
  const candidates = [
    path.join(__dirname, "serviceAccountKey.json"),
    path.join(__dirname, "serviceAccountkey.json"),
  ];

  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(
      "Không tìm thấy service account key. Hãy đặt file serviceAccountKey.json hoặc serviceAccountkey.json ở thư mục gốc project."
    );
  }
  return found;
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\uFFFD/g, " ")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripWrappingQuotes(value) {
  const text = String(value ?? "");
  if (text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1);
  }
  return text;
}

async function readCsvRows() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`Không tìm thấy file dữ liệu: ${CSV_PATH}`);
  }

  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(CSV_PATH, { encoding: "latin1" })
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (error) => reject(error));
  });
}

function toImportItems(rows) {
  const uniqueMap = new Map();
  let skipped = 0;

  rows.forEach((row, index) => {
    const rawId = row.QuestionNo ?? row.questionNo ?? row.ID ?? "";
    const rawType = row.Type ?? row.type ?? "RS";
    const rawContent = row.Content ?? row.content ?? row.Text ?? "";

    const ID = normalizeText(rawId).toUpperCase();
    const questionType = normalizeText(rawType).toUpperCase() || "RS";
    const text = normalizeText(stripWrappingQuotes(rawContent));

    if (!ID || !text) {
      skipped += 1;
      return;
    }

    const uniqueKey = `${ID}|||${text}`;
    const hash = crypto.createHash("sha1").update(uniqueKey).digest("hex").slice(0, 28);
    const docId = `rs_${hash}`;

    if (!uniqueMap.has(uniqueKey)) {
      uniqueMap.set(uniqueKey, {
        __docId: docId,
        __line: index + 2,
        ID,
        text,
        audio: {
          Brian: "",
          Olivia: "",
          Joanna: "",
        },
        occurrence: 1,
        isHidden: false,
        questionType,
        importSource: "data/repeatsentence.csv",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  return {
    items: Array.from(uniqueMap.values()),
    skipped,
    duplicatesRemoved: rows.length - skipped - uniqueMap.size,
  };
}

async function checkExistingCount(db, items) {
  const refs = items.map((item) => db.collection(COLLECTION_NAME).doc(item.__docId));
  let existing = 0;

  const chunkSize = 200;
  for (let i = 0; i < refs.length; i += chunkSize) {
    const chunk = refs.slice(i, i + chunkSize);
    const snapshots = await db.getAll(...chunk);
    snapshots.forEach((snap) => {
      if (snap.exists) existing += 1;
    });
  }

  return existing;
}

async function importRepeatSentence() {
  const serviceAccountPath = resolveServiceAccountPath();
  const serviceAccount = require(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();

  console.log("Đang đọc CSV...", CSV_PATH);
  const rows = await readCsvRows();
  console.log(`Tổng dòng data đọc được: ${rows.length}`);

  const { items, skipped, duplicatesRemoved } = toImportItems(rows);
  console.log(`Dòng hợp lệ sau khi chuẩn hóa: ${items.length}`);
  console.log(`Dòng bị bỏ qua (thiếu ID hoặc text): ${skipped}`);
  console.log(`Dòng trùng (ID + text) đã loại bỏ: ${duplicatesRemoved}`);

  if (items.length === 0) {
    console.log("Không có dữ liệu hợp lệ để import. Dừng script.");
    return;
  }

  const existingBefore = await checkExistingCount(db, items);
  console.log(`Đã tồn tại trước khi import: ${existingBefore}`);

  let batch = db.batch();
  let opCount = 0;
  let committedBatches = 0;

  for (const item of items) {
    const { __docId, __line, ...data } = item;
    const ref = db.collection(COLLECTION_NAME).doc(__docId);

    batch.set(
      ref,
      {
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    opCount += 1;
    if (opCount === 450) {
      await batch.commit();
      committedBatches += 1;
      console.log(`Đã commit batch #${committedBatches} (450 records)`);
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
    committedBatches += 1;
    console.log(`Đã commit batch #${committedBatches} (${opCount} records)`);
  }

  const inserted = items.length - existingBefore;
  const updated = existingBefore;

  console.log("\n=== KẾT QUẢ IMPORT ===");
  console.log(`Collection: ${COLLECTION_NAME}`);
  console.log(`Upsert thành công: ${items.length}`);
  console.log(`- Thêm mới: ${inserted}`);
  console.log(`- Cập nhật (đã tồn tại): ${updated}`);
  console.log(`Batch đã commit: ${committedBatches}`);
}

importRepeatSentence()
  .then(() => {
    console.log("\n✅ Import Repeat Sentence hoàn tất.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import thất bại:", error);
    process.exit(1);
  });
