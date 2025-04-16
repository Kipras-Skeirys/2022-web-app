import { useEffect, useRef, useContext } from 'react'
import { LocalStreamContext } from '../App'

function RemoteCamera(props) {

    // Props
    const sessionStatus = props.sessionStatus
    const setRemoteVideoRefState = props.setRemoteVideoRefState
    const remoteTrack = props.remoteTrack
    
    // Refs
    const remoteVideoRef = useRef()
    const remoteVideoBlurRef = useRef()
    const blurRef = useRef()

    // Context
    const { localStream, setLocalStream } = useContext(LocalStreamContext)
    const { mutedLocalStream, setMutedLocalStream } = useContext(LocalStreamContext)

    useEffect(() => {

        if (sessionStatus === 'in_session' && remoteVideoBlurRef.current.srcObject !== remoteVideoRef.current.srcObject && remoteVideoRef.current.srcObject) {

            const muted = remoteVideoRef.current.srcObject.clone()
            const audioTrack = muted.getAudioTracks()
            if (audioTrack.length > 0) {
                muted.removeTrack(audioTrack[0])
            }

            remoteVideoBlurRef.current.srcObject = muted

        }else if (sessionStatus !== 'in_session' && remoteVideoRef.current && remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject = null
        }
        if (sessionStatus !== 'in_session' && remoteVideoBlurRef.current && mutedLocalStream && remoteVideoBlurRef.current.srcObject !== mutedLocalStream) {
            remoteVideoBlurRef.current.srcObject = mutedLocalStream
 
        }
        
        // Crude fix to re-render `.camera-side-cont` correctly after adding stream to video elements
        const handleCanPlay = () => {
            const cameraSideCont = document.querySelector('.camera-side-cont')
            if (cameraSideCont) {
                setTimeout(() => {
                    cameraSideCont.style.display = 'none'
                    void cameraSideCont.offsetHeight
                    cameraSideCont.style.display = ''
                }, 0)
            }
        }
        remoteVideoBlurRef.current.addEventListener('canplay', handleCanPlay);

        // Cleanup function to remove the event listener
        return () => {
            if ( remoteVideoBlurRef && remoteVideoBlurRef.current ) remoteVideoBlurRef.current.removeEventListener('canplay', handleCanPlay)
        }
        
    }, [localStream, sessionStatus, mutedLocalStream])

    useEffect(() => {
        setRemoteVideoRefState(remoteVideoRef)
    }, [remoteVideoRef])

    useEffect(() => {
        if (remoteTrack) {
            remoteTrack.forEach(track => {
                remoteVideoRef.current.srcObject = track
            })
        }
    }, [remoteTrack])

    return ( 
        <div className="RemoteCamera">
            <video className="RemoteCamera-video" id="cont" ref={remoteVideoRef} autoPlay={true} playsInline={true}>
                <source src="https://vast.yomeno.xyz/vast?spot_id=86505" type='text/xml'/>
            </video>
            <div className="backdrop-blur" ref={blurRef}></div>
            <video className="RemoteCamera-video-background-blur" ref={remoteVideoBlurRef} autoPlay={true} playsInline muted={true}></video>
        </div>
     )
}

export default RemoteCamera