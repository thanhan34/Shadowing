import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { db, storage } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import AppShellBackground from "../components/ui/AppShellBackground";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";

type VoiceType = "Brian" | "Joanna" | "Olivia";
type MessageType = "success" | "error" | "info";
type VisibilityFilter = "all" | "visible" | "hidden";

interface AudioSample {
  id: string;
  text: string;
  occurrence: number;
  isHidden?: boolean;
  audio: Record<VoiceType, string>;
}

interface AppMessage {
  type: MessageType;
  text: string;
}

const VOICES: VoiceType[] = ["Brian", "Joanna", "Olivia"];

const AudioSampleList: React.FC = () => {
  const router = useRouter();

  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<AppMessage | null>(null);

  const [searchText, setSearchText] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [uploadingFor, setUploadingFor] = useState<{ id: string; voice: VoiceType } | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendMessage = (text: string, type: MessageType = "info") => {
    setMessage({ text, type });
  };

  useEffect(() => {
    const samplesRef = collection(db, "writefromdictation");
    const q = query(samplesRef, orderBy("text"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedSamples = querySnapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data() as Partial<AudioSample> & {
              audio?: Partial<Record<VoiceType, string>>;
            };

            return {
              id: docSnapshot.id,
              text: data.text ?? "",
              occurrence: Number(data.occurrence ?? 0),
              isHidden: data.isHidden ?? false,
              audio: {
                Brian: data.audio?.Brian ?? "",
                Joanna: data.audio?.Joanna ?? "",
                Olivia: data.audio?.Olivia ?? "",
              },
            } as AudioSample;
          })
          .sort((a, b) => a.text.localeCompare(b.text));

        setSamples(fetchedSamples);
        setIsLoading(false);
      },
      (error) => {
        appendMessage(`Error fetching samples: ${error.message}`, "error");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredSamples = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return samples.filter((sample) => {
      const matchesKeyword =
        keyword.length === 0 ||
        sample.text.toLowerCase().includes(keyword) ||
        sample.id.toLowerCase().includes(keyword);

      const matchesVisibility =
        visibilityFilter === "all"
          ? true
          : visibilityFilter === "visible"
          ? sample.isHidden !== true
          : sample.isHidden === true;

      return matchesKeyword && matchesVisibility;
    });
  }, [samples, searchText, visibilityFilter]);

  const stats = useMemo(() => {
    const visible = samples.filter((sample) => sample.isHidden !== true).length;
    const hidden = samples.length - visible;
    const missingAudio = samples.filter((sample) =>
      VOICES.some((voice) => !sample.audio[voice]?.trim())
    ).length;

    return {
      total: samples.length,
      visible,
      hidden,
      missingAudio,
    };
  }, [samples]);

  const updateSampleInState = (id: string, updater: (sample: AudioSample) => AudioSample) => {
    setSamples((prev) => prev.map((sample) => (sample.id === id ? updater(sample) : sample)));
  };

  const handleSave = async (sample: AudioSample) => {
    setSavingId(sample.id);

    try {
      const sampleRef = doc(db, "writefromdictation", sample.id);

      await updateDoc(sampleRef, {
        text: sample.text,
        isHidden: sample.isHidden ?? false,
        audio: {
          Brian: sample.audio.Brian ?? "",
          Joanna: sample.audio.Joanna ?? "",
          Olivia: sample.audio.Olivia ?? "",
        },
      });

      appendMessage(`Đã lưu sample: "${sample.text}"`, "success");
    } catch (error) {
      appendMessage(
        `Error updating sample: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa sample này?")) return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "writefromdictation", id));
      appendMessage("Đã xóa audio sample.", "success");
    } catch (error) {
      appendMessage(
        `Error deleting sample: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadClick = (id: string, voice: VoiceType) => {
    setUploadingFor({ id, voice });
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !uploadingFor) return;

    setIsUploading(true);

    try {
      const file = e.target.files[0];
      const { id, voice } = uploadingFor;
      const storageRef = ref(storage, `audio/${id}/${voice}/${file.name}`);

      const metadata = {
        contentType: "audio/mp3",
        cacheControl: "public, max-age=31536000",
        customMetadata: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      const url = await getDownloadURL(snapshot.ref);

      const targetSample = samples.find((sample) => sample.id === id);
      if (!targetSample) {
        appendMessage("Không tìm thấy sample cần upload.", "error");
        return;
      }

      const updatedAudio = {
        ...targetSample.audio,
        [voice]: url,
      };

      updateSampleInState(id, (sample) => ({
        ...sample,
        audio: updatedAudio,
      }));

      await updateDoc(doc(db, "writefromdictation", id), {
        audio: updatedAudio,
      });

      appendMessage(`Đã upload ${voice} audio cho sample.`, "success");
    } catch (error) {
      appendMessage(
        `Error uploading file: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setIsUploading(false);
      setUploadingFor(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const messageTone = useMemo(
    () => ({
      success: "text-emerald-300",
      info: "text-sky-300",
      error: "text-rose-300",
    }),
    []
  );

  return (
    <AppShellBackground>
      <Head>
        <title>Audio Sample List</title>
      </Head>

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-24 sm:gap-6 sm:px-6 lg:pt-28">
        <Card strong className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[24px] font-bold leading-tight text-white sm:text-[30px]">
                Audio Samples List
              </h1>
              <p className="mt-2 text-sm text-white/70 sm:text-base">
                Chỉnh sửa nhanh toàn bộ nội dung, trạng thái hiển thị và link audio của Write From Dictation.
              </p>
              <p className="mt-1 text-xs text-white/55 sm:text-[13px]">
                Collection hiện tại: <span className="font-semibold text-[#ffac7b]">writefromdictation</span>
              </p>
            </div>
          </div>

          <Tabs
            items={[
              { key: "wfd", label: "Write From Dictation" },
              { key: "rs", label: "Repeat Sentence" },
              { key: "rs-edit", label: "Edit RS List" },
              { key: "edit", label: "Edit Audio Sample" },
              { key: "list", label: "Audio Sample List" },
            ]}
            activeKey="list"
            onChange={(key) => {
              if (key === "wfd") {
                router.push("/add-audio-sample");
                return;
              }
              if (key === "rs") {
                router.push("/AddRepeatSentence");
                return;
              }
              if (key === "edit") {
                router.push("/EditAudioSamplePage");
                return;
              }
              if (key === "rs-list") {
                router.push("/RepeatSentence");
                return;
              }
              if (key === "rs-edit") {
                router.push("/EditRepeatSentenceList");
                return;
              }
              router.push("/AudioSampleList");
            }}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">Bộ lọc & thống kê</h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm theo text hoặc document id..."
            />

            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as VisibilityFilter)}
              className="ui-input accent-ring sm:w-52"
            >
              <option value="all">All samples</option>
              <option value="visible">Visible only</option>
              <option value="hidden">Hidden only</option>
            </select>
          </div>

          <div className="glass rounded-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">Total</p>
              <p className="mt-1 text-2xl font-bold text-[#ffac7b]">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-emerald-400/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">Visible</p>
              <p className="mt-1 text-2xl font-bold text-emerald-300">{stats.visible}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-amber-400/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">Hidden</p>
              <p className="mt-1 text-2xl font-bold text-amber-200">{stats.hidden}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-rose-400/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-white/55">Missing Audio</p>
              <p className="mt-1 text-2xl font-bold text-rose-300">{stats.missingAudio}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white sm:text-lg">Danh sách samples ({filteredSamples.length})</h2>
          </div>

          {isLoading ? (
            <p className="text-sm text-white/70">Loading...</p>
          ) : filteredSamples.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-10 text-center">
              <p className="text-white/85">Không có sample phù hợp bộ lọc hiện tại.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSamples.map((sample, index) => (
                <article
                  key={sample.id}
                  className="glass-hover rounded-2xl border border-white/15 bg-white/[0.08] p-4"
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/55">Sample #{index + 1}</p>
                        <p className="text-xs text-white/55">ID: {sample.id}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          sample.isHidden
                            ? "border-amber-300/35 bg-amber-500/15 text-amber-200"
                            : "border-emerald-300/35 bg-emerald-500/15 text-emerald-200"
                        }`}
                      >
                        {sample.isHidden ? "Hidden" : "Visible"}
                      </span>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-white/70">Text</label>
                      <Input
                        value={sample.text}
                        onChange={(e) =>
                          updateSampleInState(sample.id, (prev) => ({
                            ...prev,
                            text: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-white/75">Occurrence: {sample.occurrence}</p>

                      <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={sample.isHidden ?? false}
                          onChange={(e) =>
                            updateSampleInState(sample.id, (prev) => ({
                              ...prev,
                              isHidden: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 accent-[#fc5d01]"
                        />
                        isHidden
                      </label>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Audio Links</p>

                      {VOICES.map((voice) => (
                        <div key={`${sample.id}-${voice}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <span className="w-16 text-xs font-semibold text-white/70">{voice}</span>

                          <Input
                            value={sample.audio[voice] || ""}
                            onChange={(e) =>
                              updateSampleInState(sample.id, (prev) => ({
                                ...prev,
                                audio: {
                                  ...prev.audio,
                                  [voice]: e.target.value,
                                },
                              }))
                            }
                            placeholder={`Audio URL for ${voice}`}
                            className="sm:flex-1"
                          />

                          <Button
                            variant="secondary"
                            onClick={() => handleUploadClick(sample.id, voice)}
                            disabled={isUploading}
                            className="w-full sm:w-auto"
                          >
                            {isUploading && uploadingFor?.id === sample.id && uploadingFor?.voice === voice
                              ? "Uploading..."
                              : "Upload"}
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        onClick={() => handleSave(sample)}
                        disabled={savingId === sample.id || isUploading}
                        className="w-full sm:w-auto"
                      >
                        {savingId === sample.id ? "Saving..." : "Save"}
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => handleDelete(sample.id)}
                        disabled={deletingId === sample.id || isUploading}
                        className="w-full border-rose-300/35 bg-rose-500/15 text-rose-100 hover:border-rose-200/50 sm:w-auto"
                      >
                        {deletingId === sample.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>

        {message && (
          <Card>
            <p className={`text-sm ${messageTone[message.type]}`}>• {message.text}</p>
          </Card>
        )}

        <input
          type="file"
          accept="audio/mp3"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
      </main>
    </AppShellBackground>
  );
};

export default AudioSampleList;
