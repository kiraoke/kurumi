"use client";

import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import Conference from "../Conference/ConferenceTest";
import { useRouter } from "next/navigation";
import {
  handleUserLeave,
  handleUserJoined,
  handleUserPublished,
  handleUserUnpublished,
  handleVolumeIndicator,
} from "./listenersTest";

export interface AudioTrack {
  localTrack: IMicrophoneAudioTrack | null;
  remoteTracks: { [key: string]: IRemoteAudioTrack };
}

export type SetUsers = React.Dispatch<
  React.SetStateAction<IAgoraRTCRemoteUser[]>
>;

export default function Agora({ roomId }: { roomId: string }) {
  const appId: string = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
  const token = null;

  const rtcClientRef = useRef<IAgoraRTCClient | null>(null);

  const audioTrackRef = useRef<AudioTrack>({
    localTrack: null,
    remoteTracks: {},
  });

  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  const router = useRouter();

  const hasRunRef = useRef<boolean>(false);

  const initRtc = async ({
    rtcClient,
    uid,
  }: {
    rtcClient: IAgoraRTCClient;
    uid: string | number;
  }) => {
    const musicTrack = await AgoraRTC.createBufferSourceAudioTrack({
      source: "http://localhost:8000/static/music/Suzume.flac",
    });

    console.log("tako create suzume succcess");

    // create audio track
    await rtcClient.join(appId, roomId, token, uid);
    const localTrack: IMicrophoneAudioTrack =
      await AgoraRTC.createMicrophoneAudioTrack();

    musicTrack.startProcessAudioBuffer();
    audioTrackRef.current.localTrack = localTrack;

    await rtcClient.publish([localTrack, musicTrack]);

    console.log("tako publish kira suzume succcess");
    // if there are any existing remote tracks, stop them
    for (const remoteUser in audioTrackRef.current.remoteTracks) {
      const remoteAudioTrack = audioTrackRef.current.remoteTracks[remoteUser];
      remoteAudioTrack.stop();
      delete audioTrackRef.current.remoteTracks[remoteUser];
    }
  };

  const leaveRoom = async (notPush?: boolean) => {
    if (!audioTrackRef.current.localTrack) return;
    if (!rtcClientRef.current) return;

    audioTrackRef.current.localTrack.stop();
    audioTrackRef.current.localTrack.close();

    rtcClientRef.current.unpublish();
    rtcClientRef.current.leave();

    if (!notPush) router.push("/player");
  };

  useEffect(() => {
    if (!hasRunRef.current) {
      hasRunRef.current = true;
      const rtc: IAgoraRTCClient = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      const uid = Math.floor(Math.random() * 2032).toString();

      // @ts-ignore this throws a ts error but somehow works, usual typescript being shit
      AgoraRTC.setParameter("AUDIO_VOLUME_INDICATION_INTERVAL", 200);
      rtc.enableAudioVolumeIndicator();

      rtc.on("user-joined", (user) =>
        handleUserJoined({ user, rtcClient: rtc, setUsers })
      );

      rtc.on(
        "user-published",
        async (user, mediaType) =>
          await handleUserPublished({
            user,
            rtcClient: rtc,
            mediaType,
            audioTrackRef,
            uid,
          })
      );

      rtc.on(
        "user-unpublished",
        async (user, mediaType) =>
          await handleUserUnpublished({
            user,
            mediaType,
            rtcClient: rtc,
            audioTrackRef,
          })
      );

      rtc.on("volume-indicator", handleVolumeIndicator);

      rtc.on("user-left", (user) =>
        handleUserLeave({ user, audioTrackRef, setUsers })
      );

      rtcClientRef.current = rtc;

      initRtc({
        rtcClient: rtc,
        uid,
      });

      return () => {
        console.log("levaing kiwa");
        rtc.unpublish();
      };
    }
  }, []);

  return <Conference participants={users} audioTrack={audioTrackRef.current} />;
}
