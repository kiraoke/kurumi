import { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { AudioTrack } from "./Agora";
import React from "react";
import { SetUsers } from "./AgoraTest";

export const handleUserJoined = async ({
  user,
  rtcClient,
  setUsers,
}: {
  user: IAgoraRTCRemoteUser;
  rtcClient: IAgoraRTCClient;
  setUsers: SetUsers;
}) => {
  setUsers((prevUsers) => [...prevUsers, user]);
  return;
};

export const handleUserPublished = async ({
  user,
  mediaType,
  rtcClient,
  audioTrackRef,
  uid,
}: {
  user: IAgoraRTCRemoteUser;
  mediaType: "audio" | "video" | "datachannel";
  rtcClient: IAgoraRTCClient;
  uid: string | number;
  audioTrackRef: React.RefObject<AudioTrack>;
}) => {
  if (!rtcClient) return;

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
  setUsers,
}: {
  user: IAgoraRTCRemoteUser;
  audioTrackRef: React.RefObject<AudioTrack>;
  setUsers: SetUsers;
}) => {
  user.audioTrack?.stop();

  setUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));

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
    const diva = document.getElementById(`part_${volume.uid}`);

    if (volume.level > 40) diva?.classList.add("speaking");
    else diva?.classList.remove("speaking");
  }
};
