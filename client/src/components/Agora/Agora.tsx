"use client";

import React, { useEffect, useRef } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import Conference from "../Conference/Conference";
import { useRouter } from "next/navigation";
import { useSocket } from "@/utils/socket";
import { AuthApi } from "@/utils/fetch";
import { useAtom } from "jotai";
import { accessTokenAtom } from "@/state/store";
import {
  handleUserLeave,
  handleUserJoined,
  handleUserPublished,
  handleUserUnpublished,
  handleVolumeIndicator,
} from "./listeners";

export interface AudioTrack {
  localTrack: IMicrophoneAudioTrack | null;
  remoteTracks: { [key: string]: IRemoteAudioTrack };
}

export default function Agora({ roomId }: { roomId: string }) {
  const [accessToken] = useAtom(accessTokenAtom);

  const appId: string = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
  const token = null;

  const rtcClientRef = useRef<IAgoraRTCClient | null>(null);

  const audioTrackRef = useRef<AudioTrack>({
    localTrack: null,
    remoteTracks: {},
  });

  const router = useRouter();
  const { socket, users } = useSocket({
    serverUrl: "http://localhost:4000",
    roomId,
  });

  const hasRunRef = useRef<boolean>(false);

  const initRtc = async ({ rtcClient }: { rtcClient: IAgoraRTCClient }) => {
    if (!accessToken) router.push("/panic");
    const musicTrack = await AgoraRTC.createBufferSourceAudioTrack({
      source: "http://localhost:8000/static/music/Suzume.flac",
    });

    console.log("tako create suzume succcess");

    const {
      data: { user_id: uid },
    } = await AuthApi.get<{ user_id: string }>(
      accessToken as string,
      "/profile/user_id"
    );

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

    socket?.disconnect();
    console.log("leave panic tako", socket);
    if (!notPush) router.push("/player");
  };

  useEffect(() => {
    if (!hasRunRef.current) {
      hasRunRef.current = true;
      const rtc: IAgoraRTCClient = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      // @ts-ignore this throws a ts error but somehow works, usual typescript being shit
      AgoraRTC.setParameter("AUDIO_VOLUME_INDICATION_INTERVAL", 200);
      rtc.enableAudioVolumeIndicator();

      rtc.on("user-joined", (user) =>
        handleUserJoined({ user, rtcClient: rtc })
      );

      rtc.on(
        "user-published",
        async (user, mediaType) =>
          await handleUserPublished({
            user,
            rtcClient: rtc,
            mediaType,
            accessToken,
            audioTrackRef,
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

      rtc.on("user-left", (user) => handleUserLeave({ user, audioTrackRef }));

      rtcClientRef.current = rtc;

      initRtc({
        rtcClient: rtc,
      });

      return () => {
        console.log("levaing kiwa");
        rtc.unpublish();
      };
    }
  }, []);

  useEffect(() => {
    console.log("users tako", users);
  }, [users]);

  return <Conference participants={users} audioTrack={audioTrackRef.current} />;
}
