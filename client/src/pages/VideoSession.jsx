import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Peer } from 'peerjs';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageBanner from '../components/PageBanner';

function peerOptions() {
  const ice = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  if (import.meta.env.DEV) {
    return { host: 'localhost', port: 5000, path: '/peerjs', secure: false, config: ice };
  }
  return {
    host: window.location.hostname,
    port: window.location.protocol === 'https:' ? 443 : 80,
    path: '/peerjs',
    secure: window.location.protocol === 'https:',
    config: ice
  };
}

function roomPeerId(appointmentId, role, userId) {
  return `kstu-appt-${appointmentId}-${role}-${userId}`;
}

export default function VideoSession() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const retryTimerRef = useRef(null);
  const [partnerName, setPartnerName] = useState('your counseling partner');
  const [status, setStatus] = useState('Connecting camera...');
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);

  function stopMedia() {
    clearInterval(retryTimerRef.current);
    retryTimerRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }

  function endSession() {
    stopMedia();
    setEnded(true);
    setStatus('Session ended');
    navigate(user.role === 'student' ? '/app/appointments' : '/app/counselor-appointments');
  }

  useEffect(() => {
    let destroyed = false;
    const connectedRef = { current: false };

    async function start() {
      try {
        if (user.role !== 'student' && user.role !== 'counselor') {
          setError('Only the student and counselor on this appointment can join the video session.');
          setStatus('Unavailable');
          return;
        }

        const { data } = await api.get('/appointments');
        const appointment = (data.appointments || []).find(
          (item) => String(item.id) === String(appointmentId)
        );
        if (!appointment) {
          setError('This video appointment was not found.');
          return;
        }
        if (appointment.mode !== 'video') {
          setError('This appointment is not a video session.');
          return;
        }

        const partnerId =
          user.role === 'student' ? appointment.counselor_id : appointment.student_id;
        const partnerRole = user.role === 'student' ? 'counselor' : 'student';
        setPartnerName(
          user.role === 'student' ? appointment.counselor_name : appointment.student_name
        );

        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play?.().catch(() => {});
        }
        if (destroyed) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }

        const myId = roomPeerId(appointmentId, user.role, user.id);
        const theirId = roomPeerId(appointmentId, partnerRole, partnerId);
        const shouldCall = Number(user.id) < Number(partnerId);
        const peer = new Peer(myId, peerOptions());
        peerRef.current = peer;

        function callPartner() {
          if (destroyed || connectedRef.current || !peerRef.current || !streamRef.current) return;
          setStatus(`Calling ${user.role === 'student' ? appointment.counselor_name : appointment.student_name}...`);
          const call = peerRef.current.call(theirId, streamRef.current);
          if (!call) return;
          call.on('stream', attachRemote);
          call.on('error', () => {
            if (!connectedRef.current) setStatus('Waiting for the other person to join...');
          });
        }

        function attachRemote(remoteStream) {
          connectedRef.current = true;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play?.().catch(() => {});
          }
          setStatus('Connected');
          clearInterval(retryTimerRef.current);
          retryTimerRef.current = null;
        }

        peer.on('open', () => {
          if (destroyed) return;
          setStatus('Camera ready. Waiting for the other person to join...');
          if (shouldCall) {
            callPartner();
            retryTimerRef.current = setInterval(callPartner, 4000);
          }
        });

        peer.on('call', (call) => {
          setStatus('Connecting...');
          call.answer(streamRef.current);
          call.on('stream', attachRemote);
        });

        peer.on('error', (err) => {
          if (err?.type === 'peer-unavailable' || String(err.message || '').includes('Could not connect')) {
            setStatus('Waiting for the other person to join...');
            return;
          }
          setError(err.message || 'Video connection error');
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Could not start the video session');
      }
    }

    start();

    return () => {
      destroyed = true;
      stopMedia();
    };
  }, [appointmentId, user.id, user.role]);

  return (
    <div>
      <PageBanner
        image="/images/video-care.jpg"
        title="Video counseling"
        subtitle={`Appointment #${appointmentId} · live session with ${partnerName}`}
      />

      {error && <div className="error">{error}</div>}
      <div className="success">{status}</div>

      <div className="video-shell stack" style={{ marginTop: '1rem' }}>
        <div className="video-grid">
          <div>
            <h3>You</h3>
            <video ref={localVideoRef} autoPlay muted playsInline />
          </div>
          <div>
            <h3>{partnerName}</h3>
            <video ref={remoteVideoRef} autoPlay playsInline />
          </div>
        </div>
        <div className="inline-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn-danger" type="button" onClick={endSession} disabled={ended}>
            End session
          </button>
        </div>
        <p className="muted">
          Both people click Join video / Start video for the same appointment. Allow camera and microphone.
          The call connects automatically when both are on this page. Use End session to hang up and turn off your camera.
        </p>
      </div>
    </div>
  );
}
