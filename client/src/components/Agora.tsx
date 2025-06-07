"use client";

import React, { useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IAgoraRTCRemoteUser, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import Conference from './Conference/Conference';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/utils/socket';

export interface AudioTrack {
  localTrack: IMicrophoneAudioTrack | null;
  remoteTracks: { [key: string]: IRemoteAudioTrack };
}

export default function Agora({ roomId }: { roomId: string }) {
  const appId: string = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
  const token = null;

  const rtcClientRef = useRef<IAgoraRTCClient | null>(null);
  const rtcUidRef = useRef<number>(0);
  const audioTrackRef = useRef<AudioTrack>({ localTrack: null, remoteTracks: {} });
  const router = useRouter();
  const { socket, users } = useSocket("http://localhost:4000", roomId);
  const hasRunRef = useRef<boolean>(false);

  const initRtc = async (rtcClient: IAgoraRTCClient, uid: number) => {
    await rtcClient.join(appId, roomId, token, uid);
    const localTrack: IMicrophoneAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

    audioTrackRef.current.localTrack = localTrack;

    rtcClient.publish(localTrack);

    for (const remoteUser in audioTrackRef.current.remoteTracks) {
      const remoteAudioTrack = audioTrackRef.current.remoteTracks[remoteUser];
      remoteAudioTrack.stop();
      delete audioTrackRef.current.remoteTracks[remoteUser];
    }
  }


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

  const handleUserJoined = async (user: IAgoraRTCRemoteUser, rtc: IAgoraRTCClient) => {
    return;
  }

  const handleUserPublished = async (user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video' | 'datachannel',
    uid: number,
    rtcClient: IAgoraRTCClient) => {
    if (!rtcClient) return;
    if (user.uid.toString() === rtcUidRef.current.toString()) return;

    await rtcClient.subscribe(user, mediaType);

    if (mediaType !== 'audio') return;
    const remoteAudioTrack = user.audioTrack;

    if (!remoteAudioTrack) return;

    audioTrackRef.current.remoteTracks[user.uid] = remoteAudioTrack;

    remoteAudioTrack.play();
  }

  const handleUserUnpublished = async (user: IAgoraRTCRemoteUser,
    rtcClient: IAgoraRTCClient,
    uid: number,
    mediaType: 'audio' | 'video' | 'datachannel') => {
    await rtcClient.unsubscribe(user, mediaType);
    const remoteAudioTrack = user.audioTrack;

    delete audioTrackRef.current?.remoteTracks[user.uid];
    remoteAudioTrack?.stop();
  };


  const handleUserLeave = async (user: IAgoraRTCRemoteUser) => {
    user.audioTrack?.stop();

    const { [user.uid]: _, ...remainingTracks } = audioTrackRef.current.remoteTracks
    audioTrackRef.current.remoteTracks = remainingTracks;
  }

  useEffect(() => {
    if (!hasRunRef.current) {
      hasRunRef.current = true;
      const rtc: IAgoraRTCClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      rtc.on("user-joined", handleUserJoined);
      rtc.on("user-published", async (user, mediaType) => await handleUserPublished(user, mediaType, uid, rtc));
      rtc.on("user-unpublished", async (user, mediaType) => await handleUserUnpublished(user, rtc, uid, mediaType));
      rtc.on("user-left", handleUserLeave);
      const uid = Math.floor(Math.random() * 2032);

      rtcClientRef.current = rtc;
      rtcUidRef.current = uid;

      initRtc(rtc, uid);

      return () => {
        console.log("levaing kiwa");
        rtc.unpublish();
      }
    }
  }, []);

  useEffect(() => {
    console.log("users tako", users)
  }, [users]);


  return <Conference
    participants={users}
    audioTrack={audioTrackRef.current}
  />;
}
