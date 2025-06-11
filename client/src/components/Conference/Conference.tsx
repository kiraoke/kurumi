"use client";

import React, { useState } from "react";
import styles from "./Conference.module.css";
import { AudioTrack } from "../Agora/Agora";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import useDebounce from "@/utils/debounce";
import { api } from "@/utils/fetch";
import { truncate } from "@/utils/truncate";
import Wavebar from "./Wavebar";
import { useSocket } from "@/utils/socket";
import Lyrics from "../Lyrics/Lyrics";
import { useAtom } from "jotai";
import { userAtom } from "@/state/store";
import { useRouter } from "next/navigation";
import { serverUrl, socketUrl } from "@/utils/constants";

interface Props {
  audioTrack?: React.RefObject<AudioTrack>;
  rtc: IAgoraRTCClient | null;
  roomId: string;
  isHost: boolean;
}

export interface SearchResult {
  item: { name: string; duration: number };
  refIndex: number;
  score: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export default function Conference({ audioTrack, rtc, roomId, isHost }: Props) {
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [user] = useAtom(userAtom);
  const router = useRouter();

  const {
    socket,
    users,
    playing,
    seekTime,
    setPlaying,
    musicRecord,
    setSeekTime,
    setMusicRecord,
  } = useSocket({
    socketUrl,
    roomId,
    isHost,
  });

  const toggleMic = () => {
    audioTrack?.current?.localTrack?.setMuted(!micMuted);

    setMicMuted(!micMuted);
  };

  useDebounce(
    async () => {
      const { data } = await api.get<SearchResponse>(
        `/music?search=${encodeURIComponent(search)}`
      );

      if (data) setSearchResults(data.results);
    },
    [search],
    300
  );

  const togglePlay = async () => {
    if (!isHost) return;

    if (playing) {
      audioTrack?.current?.musicTrack?.pauseProcessAudioBuffer();

      socket?.emit("pauseTrack", {
        roomId,
        track: musicRecord?.name,
        timestamp: audioTrack?.current?.musicTrack?.getCurrentTime(),
        duration: musicRecord?.cover,
      });
    } else {
      audioTrack?.current?.musicTrack?.resumeProcessAudioBuffer();

      socket?.emit("resumeTrack", {
        roomId,
        track: musicRecord?.name,
        timestamp: audioTrack?.current?.musicTrack?.getCurrentTime(),
        duration: musicRecord?.cover,
      });
    }
    setPlaying((play) => !play);
  };

  const playMusic = async ({
    trackName,
    duration,
  }: {
    trackName: string;
    duration: number;
  }) => {
    const musicTrack = await AgoraRTC.createBufferSourceAudioTrack({
      source: `${serverUrl}/static/music/${encodeURIComponent(trackName)}`,
    });
    audioTrack?.current?.musicTrack?.stop();

    await rtc?.unpublish(audioTrack?.current?.musicTrack);

    if (audioTrack?.current) {
      audioTrack.current.musicTrack = musicTrack;
    }

    musicTrack.startProcessAudioBuffer();
    musicTrack.play();
    setMusicRecord({
      name: trackName,
      cover: `${serverUrl}/static/covers/${encodeURIComponent(trackName)}.png`,
      duration: duration,
    });

    await rtc?.publish(musicTrack);
    socket?.emit("pushTrack", {
      roomId,
      track: trackName,
      duration: duration,
    });

    setPlaying(true);
    setSeekTime(0);
  };

  const leaveRoom = async () => {
    if (!audioTrack?.current.localTrack) return;
    if (!rtc) return;

    audioTrack.current.localTrack.stop();
    audioTrack.current.localTrack.close();

    rtc.unpublish();
    rtc.leave();

    socket?.disconnect();
    router.push("/player");
  };

  return (
    <div className={styles.container}>
      {isHost && (
        <div className={styles.sidebar}>
          <div className={styles.logo}>Kurumi.</div>

          <div className={styles.searchContainer}>
            <img src="/icons/search.svg" className={styles.searchIcon} />
            <input
              type="text"
              className={styles.search}
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <hr className={styles.line} />
          <div className={styles.resultsContainer}>
            {searchResults?.map((result, i) => (
              <div
                className={styles.result}
                key={i}
                onClick={() =>
                  playMusic({
                    trackName: result.item.name,
                    duration: result.item.duration,
                  })
                }>
                <img src={"/icons/play.svg"} />
                {truncate(result.item.name, 20)}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={styles.mainContainer}>
        <div className={styles.playerContainer}>
          <div className={styles.playContainer}>
            <img
              className={`${styles.play} ${isHost ? styles.hostPlay : ""}`}
              onClick={togglePlay}
              src={playing ? "/icons/pause.svg" : "/icons/play.svg"}
            />
          </div>
          <div className={styles.seekContainer}>
            <img
              className={styles.thumbnail}
              src={musicRecord?.cover || "/kuload.gif"}
            />
            <div className={styles.nameContainer}>
              <p className={styles.songName}>
                {musicRecord
                  ? truncate(musicRecord.name, 50)
                  : "No track playing"}
              </p>
              <input
                className={styles.seekbar}
                value={seekTime}
                onChange={(e) => setSeekTime(parseInt(e.target.value))}
                type="range"
                min={0}
                max={musicRecord ? musicRecord.duration : 100}
              />
            </div>
          </div>
          <div className={styles.volumeContainer}>
            <img className={styles.vIcon} src={"/icons/volume.svg"} />
            <input
              className={styles.volumeBar}
              type="range"
              min="0"
              max={"100"}
            />
          </div>
        </div>

        <div className={styles.participantsContainer}>
          <div className={styles.part}>
            <img src={user?.pfp} />
            <div className={styles.partBox}>
              <p>You.</p>
            </div>
          </div>
          {users.map((participant, i) => (
            <div
              className={styles.part}
              key={i}
              id={`part_${participant.user_id}`}>
              <img src={participant.pfp} />
              <div className={styles.partBox}>
                <p>{participant.username}</p>
                <Wavebar />
              </div>
            </div>
          ))}
        </div>
        <div className={styles.actionContainer}>
          <button className={styles.button} onClick={toggleMic}>
            <img
              src={`/icons/${micMuted ? "micoff" : "mic"}.svg`}
              alt="mic icon"
            />
          </button>
          <button className={styles.button} onClick={leaveRoom}>
            <img src={"/icons/leave.svg"} alt="mic icon" />
          </button>
        </div>
      </div>

      <Lyrics track={musicRecord?.name || ""} />
    </div>
  );
}
