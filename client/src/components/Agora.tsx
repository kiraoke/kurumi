"use client";

import React, { useEffect, useRef } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import Conference from "./Conference/Conference";
import { useRouter } from "next/navigation";
import { useSocket } from "@/utils/socket";
import { AuthApi } from "@/utils/fetch";
import { useAtom } from "jotai";
import { accessTokenAtom } from "@/state/store";

export interface AudioTrack {
  localTrack: IMicrophoneAudioTrack | null;
  remoteTracks: { [key: string]: IRemoteAudioTrack };
}

export default function Agora({ roomId }: { roomId: string }) {
  const [accessToken] = useAtom(accessTokenAtom);

  const appId: string = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
  const token = null;

  const rtcClientRef = useRef<IAgoraRTCClient | null>(null);
  const rtcUidRef = useRef<string>("");

  const audioTrackRef = useRef<AudioTrack>({
    localTrack: null,
    remoteTracks: {},
  });
  const router = useRouter();
  const { socket, users } = useSocket({
    serverUrl: "http://localhost:4000",
    roomId,
    uid: rtcUidRef.current.toString(),
  });

  const hasRunRef = useRef<boolean>(false);

  const initRtc = async ({ rtcClient }: { rtcClient: IAgoraRTCClient }) => {
    if (!accessToken) router.push("/panic");

    const {
      data: { user_id: uid },
    } = await AuthApi.get<{ user_id: string }>(
      accessToken as string,
      "/profile/user_id"
    );

    rtcUidRef.current = uid;

    await rtcClient.join(appId, roomId, token, uid);
    const localTrack: IMicrophoneAudioTrack =
      await AgoraRTC.createMicrophoneAudioTrack();

    audioTrackRef.current.localTrack = localTrack;

    rtcClient.publish(localTrack);

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

  const handleUserJoined = async ({
    user,
    rtcClient,
  }: {
    user: IAgoraRTCRemoteUser;
    rtcClient: IAgoraRTCClient;
  }) => {
    return;
  };

  const handleUserPublished = async ({
    user,
    mediaType,
    rtcClient,
  }: {
    user: IAgoraRTCRemoteUser;
    mediaType: "audio" | "video" | "datachannel";
    rtcClient: IAgoraRTCClient;
  }) => {
    if (!rtcClient) return;

    const {
      data: { user_id: uid },
    } = await AuthApi.get<{ user_id: string }>(
      accessToken as string,
      "/profile/user_id"
    );

    if (user.uid.toString() === uid) return;

    await rtcClient.subscribe(user, mediaType);

    if (mediaType !== "audio") return;
    const remoteAudioTrack = user.audioTrack;

    if (!remoteAudioTrack) return;

    audioTrackRef.current.remoteTracks[user.uid] = remoteAudioTrack;

    remoteAudioTrack.play();
  };

  const handleUserUnpublished = async ({
    user,
    rtcClient,
    mediaType,
  }: {
    user: IAgoraRTCRemoteUser;
    rtcClient: IAgoraRTCClient;
    mediaType: "audio" | "video" | "datachannel";
  }) => {
    await rtcClient.unsubscribe(user, mediaType);
    const remoteAudioTrack = user.audioTrack;

    delete audioTrackRef.current?.remoteTracks[user.uid];
    remoteAudioTrack?.stop();
  };

  const handleUserLeave = async (user: IAgoraRTCRemoteUser) => {
    user.audioTrack?.stop();

    const { [user.uid]: _, ...remainingTracks } =
      audioTrackRef.current.remoteTracks;
    audioTrackRef.current.remoteTracks = remainingTracks;
  };

  const handleVolumeIndicator = (
    volumes: {
      level: number;
      uid: string | number;
    }[]
  ) => {
    for (const volume of volumes) {
      const diva = document.getElementById(`part_${volume.uid}`);

      if (volume.level > 40) diva?.classList.add("speaking");
      else diva?.classList.remove("speaking");
    }
  };

  useEffect(() => {
    if (!hasRunRef.current) {
      hasRunRef.current = true;
      const rtc: IAgoraRTCClient = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      // @ts-ignore
      AgoraRTC.setParameter("AUDIO_VOLUME_INDICATION_INTERVAL", 200);
      rtc.enableAudioVolumeIndicator();

      console.log("rtc uid tako", rtcUidRef.current);
      rtc.on("user-joined", handleUserJoined);
      rtc.on(
        "user-published",
        async (user, mediaType) =>
          await handleUserPublished({
            user,
            rtcClient: rtc,
            mediaType,
          })
      );
      rtc.on(
        "user-unpublished",
        async (user, mediaType) =>
          await handleUserUnpublished({
            user,
            mediaType,
            rtcClient: rtc,
          })
      );
      rtc.on("volume-indicator", handleVolumeIndicator);
      rtc.on("user-left", handleUserLeave);

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
