import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { AudioTrack } from "./Agora";
import { AuthApi } from "@/utils/fetch";
import React from "react";
import styles from "@/components/Conference/Wavebar.module.css";

export const handleUserJoined = async ({
  user,
  rtcClient,
}: {
  user: IAgoraRTCRemoteUser;
  rtcClient: IAgoraRTCClient;
}) => {
  return;
};

export const handleUserPublished = async ({
  user,
  mediaType,
  rtcClient,
  accessToken,
  audioTrackRef,
}: {
  user: IAgoraRTCRemoteUser;
  mediaType: "audio" | "video" | "datachannel";
  rtcClient: IAgoraRTCClient;
  accessToken: string | null;
  audioTrackRef: React.RefObject<AudioTrack>;
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

export const handleUserUnpublished = async ({
  user,
  rtcClient,
  mediaType,
  audioTrackRef,
}: {
  user: IAgoraRTCRemoteUser;
  rtcClient: IAgoraRTCClient;
  mediaType: "audio" | "video" | "datachannel";
  audioTrackRef: React.RefObject<AudioTrack>;
}) => {
  await rtcClient.unsubscribe(user, mediaType);
  const remoteAudioTrack = user.audioTrack;

  delete audioTrackRef.current?.remoteTracks[user.uid];
  remoteAudioTrack?.stop();
};

export const handleUserLeave = async ({
  user,
  audioTrackRef,
}: {
  user: IAgoraRTCRemoteUser;
  audioTrackRef: React.RefObject<AudioTrack>;
}) => {
  user.audioTrack?.stop();

  const { [user.uid]: _, ...remainingTracks } =
    audioTrackRef.current.remoteTracks;
  audioTrackRef.current.remoteTracks = remainingTracks;
};

export const handleVolumeIndicator = (
  volumes: {
    level: number;
    uid: string | number;
  }[]
) => {
  for (const volume of volumes) {
    const diva = document.querySelector(`#part_${volume.uid} .bars`);

    if (volume.level > 40) diva?.classList.add("active");
    else diva?.classList.remove("active");
  }
};
