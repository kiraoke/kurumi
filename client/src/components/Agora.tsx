"use client";

import React, { useState, useEffect } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IAgoraRTCRemoteUser, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import Conference from './Conference/Conference';
import { useRouter } from 'next/navigation';


interface AudioTrack {
  localTrack: IMicrophoneAudioTrack | null;
  remoteTracks: { [key: string]: IRemoteAudioTrack };
}

export default function Agora({ children }: { children: React.ReactNode }) {
  const appId: string = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
  const token = null;

  const roomid = "kuru";
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>();
  const [rtcUid, setRtcUid] = useState<number>(0);
  const [audioTrack, setAudioTrack] = useState<AudioTrack>({ localTrack: null, remoteTracks: {} });
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const router = useRouter();

  const initRtc = async (rtcClient: IAgoraRTCClient, uid: number) => {
    await rtcClient.join(appId, roomid, token, uid);
    const localTrack: IMicrophoneAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

    setAudioTrack(track => ({ localTrack: localTrack, remoteTracks: track.remoteTracks }));

    rtcClient.publish(localTrack);
  }

  const leaveRoom = async () => {
    if (!audioTrack.localTrack) return;
    if (!rtcClient) return;

    audioTrack.localTrack.stop();
    audioTrack.localTrack.close();

    rtcClient.unpublish();
    rtcClient.leave();
    router.push("/panic");
  };

  const handleUserJoined = async (user: IAgoraRTCRemoteUser) => {
    console.log("A new takodachi", user);
    setUsers(prevUsers => [...prevUsers, user]);
  }

  const handleUserPublished = async (user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video' | 'datachannel',
    rtcClient: IAgoraRTCClient) => {
    console.log("User published kiwawawaawa", rtcClient);
    if (!rtcClient) return;

    await rtcClient.subscribe(user, mediaType);
    console.log("audio calliope", user, mediaType);

    if (mediaType !== 'audio') return;
    const audioTrack = user.audioTrack;

    if (!audioTrack) return;

    setAudioTrack(track => ({
      ...track,
      remoteTracks: {
        ...track.remoteTracks,
        [user.uid]: audioTrack
      }
    }));

    console.log("Remote audio track subscribed", audioTrack);

    audioTrack.play();
  }


  const handleUserLeave = async (user: IAgoraRTCRemoteUser) => {
    console.log("takodachi left", user);
    setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));

    setAudioTrack(track => {
      const { [user.uid]: _, ...remainingTracks } = track.remoteTracks;
      return { ...track, remoteTracks: remainingTracks };
    });
  }

  useEffect(() => {
    const rtc: IAgoraRTCClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    rtc.on("user-joined", handleUserJoined);
    rtc.on("user-published", async (user, mediaType) => await handleUserPublished(user, mediaType, rtc));
    rtc.on("user-left", handleUserLeave);
    const uid = Math.floor(Math.random() * 2032);
    setRtcUid(uid);
    setRtcClient(rtc);
    console.log("AgoraRTC client created with UID:", rtcUid, appId);

    initRtc(rtc, uid);
  }, []);

  return <Conference
    participants={users}
    toggleMic={() => console.log("toggle")}
    leaveRoom={leaveRoom} />;
}
