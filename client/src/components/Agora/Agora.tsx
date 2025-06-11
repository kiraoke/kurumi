"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IBufferSourceAudioTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import Conference from "../Conference/Conference";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/utils/fetch";
import { useAtom } from "jotai";
import { accessTokenAtom, userAtom } from "@/state/store";
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
  musicTrack?: IBufferSourceAudioTrack | undefined;
}

export default function Agora({ roomId }: { roomId: string }) {
  const [accessToken] = useAtom(accessTokenAtom);
  const [user] = useAtom(userAtom);
  const memoizedUser = useMemo(
    () => user,
    [user ? JSON.stringify(user) : null]
  );
  const [isHost, setIsHost] = useState<boolean>(false);

  const appId: string = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
  const token = null;

  const rtcClientRef = useRef<IAgoraRTCClient | null>(null);

  useEffect(() => {
    if (memoizedUser) {
      setIsHost(memoizedUser.email === decodeURIComponent(roomId)); // it fixes @ being %40 due to url encoding
    }
  }, [memoizedUser]);

  const audioTrackRef = useRef<AudioTrack>({
    localTrack: null,
    remoteTracks: {},
  });

  const router = useRouter();

  const hasRunRef = useRef<boolean>(false);

  const initRtc = async ({ rtcClient }: { rtcClient: IAgoraRTCClient }) => {
    if (!accessToken) router.push("/panic");

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

    audioTrackRef.current.localTrack = localTrack;

    await rtcClient.publish(localTrack);

    // if there are any existing remote tracks, stop them
    for (const remoteUser in audioTrackRef.current.remoteTracks) {
      const remoteAudioTrack = audioTrackRef.current.remoteTracks[remoteUser];
      remoteAudioTrack.stop();
      delete audioTrackRef.current.remoteTracks[remoteUser];
    }

    // subscribe to existing users
    rtcClient.remoteUsers.forEach(async (user) => {
      if (user.uid.toString() === uid) return;

      await rtcClient.subscribe(user, "audio");

      const remoteAudioTrack = user.audioTrack;

      if (!remoteAudioTrack) return;

      audioTrackRef.current.remoteTracks[user.uid] = remoteAudioTrack;

      remoteAudioTrack.play();
    });
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
    }
  }, []);

  return (
    <Conference
      rtc={rtcClientRef.current}
      audioTrack={audioTrackRef}
      roomId={roomId}
      isHost={isHost}
    />
  );
}
