"use client";

import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IAgoraRTCRemoteUser, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import Conference from './Conference/Conference';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/utils/socket';

interface AudioTrack {
  localTrack: IMicrophoneAudioTrack | null;
  remoteTracks: { [key: string]: IRemoteAudioTrack };
}

export default function Agora({ children }: { children: React.ReactNode }) {
  const appId: string = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
  const token = null;

  const roomid = "kuru";
  const rtcClientRef = useRef<IAgoraRTCClient | null>(null);
  const rtcUidRef = useRef<number>(0);
  const audioTrackRef = useRef<AudioTrack>({ localTrack: null, remoteTracks: {} });
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const router = useRouter();
  const {socket} = useSocket("http://localhost:4000");

  const initRtc = async (rtcClient: IAgoraRTCClient, uid: number) => {
    await rtcClient.join(appId, roomid, token, uid);
    const localTrack: IMicrophoneAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

    audioTrackRef.current.localTrack = localTrack;

    rtcClient.publish(localTrack);
  }

  const leaveRoom = async () => {
    if (!audioTrackRef.current.localTrack) return;
    if (!rtcClientRef.current) return;

    audioTrackRef.current.localTrack.stop();
    audioTrackRef.current.localTrack.close();

    rtcClientRef.current.unpublish();
    rtcClientRef.current.leave();
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
    const remoteAudioTrack = user.audioTrack;

    if (!remoteAudioTrack) return;

    audioTrackRef.current.remoteTracks[user.uid] = remoteAudioTrack;

    console.log("Remote audio track subscribed", remoteAudioTrack);

    remoteAudioTrack.play();
  }


  const handleUserLeave = async (user: IAgoraRTCRemoteUser) => {
    console.log("takodachi left", user);
    setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));

    const {[user.uid]: _, ...remainingTracks} = audioTrackRef.current.remoteTracks
    audioTrackRef.current.remoteTracks = remainingTracks;
  }

  useEffect(() => {
    const rtc: IAgoraRTCClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    rtc.on("user-joined", handleUserJoined);
    rtc.on("user-published", async (user, mediaType) => await handleUserPublished(user, mediaType, rtc));
    rtc.on("user-left", handleUserLeave);
    const uid = Math.floor(Math.random() * 2032);

    rtcClientRef.current = rtc;
    rtcUidRef.current = uid;
    console.log("AgoraRTC client created with UID:", rtcUidRef.current, appId);

    initRtc(rtc, uid);
  }, []);


  return <Conference
    participants={users}
    toggleMic={() => console.log("toggle")}
    leaveRoom={leaveRoom} />;
}
