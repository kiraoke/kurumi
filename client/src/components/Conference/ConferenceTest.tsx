"use client";

import styles from "./ConferenceTest.module.css";
import { AudioTrack } from "../Agora/Agora";
import { useState } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import useDebounce from "@/utils/debounce";
import { api } from "@/utils/fetch";
import { truncate } from "@/utils/truncate";
import Wavebar from "./Wavebar";

interface Props {
  participants: IAgoraRTCRemoteUser[];
  audioTrack?: AudioTrack;
}

export interface SearchResult {
  item: { name: string };
  refIndex: number;
  score: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export default function Conference({ participants, audioTrack }: Props) {
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [play, setPlay] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const toggleMic = () => {
    audioTrack?.localTrack?.setMuted(!micMuted);

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

  const togglePlay = () => {
    setPlay((play) => !play);
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        {/*<div className={styles.buttContainer}>
          <button className={styles.button} onClick={toggleMic}>
            <Image
              src={`/icons/${micMuted ? "micoff" : "mic"}.svg`}
              width={25}
              height={25}
              alt="mic icon"
            />
          </button>
          <button className={styles.button}>
            <Image
              src={"/icons/leave.svg"}
              width={25}
              height={25}
              alt="mic icon"
            />
          </button>
        </div>*/}

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
            <div className={styles.result} key={i}>
              <img src={"/icons/play.svg"} />
              {truncate(result.item.name, 20)}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.mainContainer}>
        <div className={styles.playerContainer}>
          <div className={styles.playContainer}>
            <img
              className={styles.play}
              onClick={togglePlay}
              src={play ? "/icons/pause.svg" : "/icons/play.svg"}
            />
          </div>
          <div className={styles.seekContainer}>
            <img className={styles.thumbnail} src={"/kuload.gif"} />
            <div className={styles.nameContainer}>
              <p className={styles.songName}>Suzume</p>
              <input
                className={styles.seekbar}
                type="range"
                min="0"
                max={"100"}
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
            <img src={"/pfp.jpg"} />
            <div className={styles.partBox}>
              <p>daring-megumin-chan</p>
              <Wavebar active />
            </div>
          </div>
        </div>
        <div className={styles.actionContainer}>
          <button className={styles.button} onClick={toggleMic}>
            <img
              src={`/icons/${micMuted ? "micoff" : "mic"}.svg`}
              alt="mic icon"
            />
          </button>
          <button className={styles.button}>
            <img src={"/icons/leave.svg"} alt="mic icon" />
          </button>
        </div>
      </div>
    </div>
  );
}
