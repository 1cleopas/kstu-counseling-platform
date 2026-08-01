import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Peer } from 'peerjs';
import { useAuth } from '../context/AuthContext';
import PageBanner from '../components/PageBanner';

export default function VideoSession() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [status, setStatus] = useState('Connecting media devices...');
  const [error, setError] = useState('');

  useEffect(() => {
    let localStream;
    let destroyed = false;

    async function start() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        const roomId = `kstu-appt-${appointmentId}`;
        const myId = `${roomId}-${user.role}-${user.id}`;
        const peerHost = import.meta.env.VITE_PEER_HOST || window.location.hostname;
        const peerPort = Number(
          import.meta.env.VITE_PEER_PORT || (window.location.protocol === 'https:' ? 443 : 5000)
        );
        const peerSecure =
          String(
            import.meta.env.VITE_PEER_SECURE || (window.location.protocol === 'https:')
          ).toLowerCase() === 'true';
        const peer = new Peer(myId, {
          host: peerHost === 'localhost' ? 'localhost' : peerHost,
          port: peerHost === 'localhost' ? 5000 : peerPort,
          path: '/peerjs',
          secure: peerHost === 'localhost' ? false : peerSecure
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
          if (destroyed) return;
          setPeerId(id);
          setStatus('Camera ready. Share your Peer ID or call the other participant.');
        });

        peer.on('call', (call) => {
          setStatus('Incoming call... answering');
          call.answer(localStream);
          call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
            setStatus('Connected');
          });
        });

        peer.on('error', (err) => {
          setError(err.message || 'Peer connection error');
        });
      } catch (err) {
        setError(err.message || 'Could not access camera/microphone');
      }
    }

    start();

    return () => {
      destroyed = true;
      peerRef.current?.destroy();
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [appointmentId, user.id, user.role]);

  function callPeer() {
    if (!peerRef.current || !remotePeerId || !localVideoRef.current?.srcObject) return;
    setStatus('Calling...');
    const call = peerRef.current.call(remotePeerId.trim(), localVideoRef.current.srcObject);
    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setStatus('Connected');
    });
  }

  return (
    <div>
      <PageBanner
        image="/images/video-care.jpg"
        title="Video counseling"
        subtitle={`Appointment #${appointmentId} · WebRTC session via PeerJS`}
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
            <h3>Counseling partner</h3>
            <video ref={remoteVideoRef} autoPlay playsInline />
          </div>
        </div>

        <div className="panel form-grid">
          <label>
            Your Peer ID
            <input value={peerId} readOnly />
          </label>
          <label>
            Partner Peer ID
            <input
              value={remotePeerId}
              onChange={(e) => setRemotePeerId(e.target.value)}
              placeholder="Paste the other person's Peer ID"
            />
          </label>
          <button className="btn btn-primary" type="button" onClick={callPeer}>
            Start / join call
          </button>
          <p className="muted">
            Both participants open this page for the same appointment. One person copies their Peer ID;
            the other pastes it and clicks start.
          </p>
        </div>
      </div>
    </div>
  );
}
